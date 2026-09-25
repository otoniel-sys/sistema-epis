'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function parseMonetaryValue(val: FormDataEntryValue | null): number {
  if (!val) return 0
  const normalized = String(val).trim().replace(',', '.')
  const num = parseFloat(normalized)
  return isNaN(num) || num < 0 ? 0 : num
}

function parseSafeDate(val: FormDataEntryValue | null): Date {
  if (!val) return new Date()
  const str = String(val).trim()
  if (!str) return new Date()
  const parsed = new Date(`${str}T12:00:00.000Z`)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}

export async function createEmployee(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const role = (formData.get('role') as string)?.trim() || 'Colaborador'
  const department = (formData.get('department') as string)?.trim() || 'Geral'

  if (!name) {
    throw new Error('O nome do colaborador é obrigatório.')
  }

  await prisma.employee.create({
    data: { name, role, department }
  })

  revalidatePath('/employees')
  redirect('/employees')
}

export async function createEquipment(formData: FormData) {
  const description = (formData.get('description') as string)?.trim()
  const ca = (formData.get('ca') as string)?.trim() || null
  const type = (formData.get('type') as string)?.trim() || 'EPI'
  const idealStock = Math.max(0, parseInt(formData.get('idealStock') as string) || 0)
  const currentStock = Math.max(0, parseInt(formData.get('currentStock') as string) || 0)
  const unitValue = parseMonetaryValue(formData.get('unitValue'))
  const lifespanMonths = Math.max(0, parseInt(formData.get('lifespanMonths') as string) || 0)
  const replacementCriteria = (formData.get('replacementCriteria') as string)?.trim() || null

  if (!description) {
    throw new Error('A descrição do EPI é obrigatória.')
  }

  await prisma.$transaction(async (tx) => {
    const eq = await tx.equipment.create({
      data: {
        description,
        ca,
        type,
        idealStock,
        currentStock,
        unitValue,
        lifespanMonths,
        replacementCriteria
      }
    })

    if (currentStock > 0) {
      await tx.stockTransaction.create({
        data: {
          equipmentId: eq.id,
          quantity: currentStock,
          unitValue,
          type: 'ENTRADA',
          date: new Date()
        }
      })
    }
  })

  revalidatePath('/inventory')
  revalidatePath('/reports')
  revalidatePath('/')
  redirect('/inventory')
}

export async function createStockEntry(formData: FormData) {
  const equipmentId = (formData.get('equipmentId') as string)?.trim()
  const quantity = parseInt(formData.get('quantity') as string) || 0
  const unitValue = parseMonetaryValue(formData.get('unitValue'))
  const date = parseSafeDate(formData.get('date'))

  if (!equipmentId) throw new Error('Selecione um EPI para registrar a entrada.')
  if (quantity <= 0) throw new Error('A quantidade deve ser maior que zero.')

  await prisma.$transaction([
    prisma.stockTransaction.create({
      data: {
        equipmentId,
        quantity,
        unitValue,
        type: 'ENTRADA',
        date,
      }
    }),
    prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        currentStock: { increment: quantity },
        ...(unitValue > 0 ? { unitValue } : {})
      }
    })
  ])

  revalidatePath('/inventory')
  revalidatePath('/reports')
  revalidatePath('/')
  redirect('/reports')
}

export async function deleteStockTransaction(id: string) {
  const transaction = await prisma.stockTransaction.findUnique({
    where: { id },
    include: { equipment: true }
  })
  if (!transaction) throw new Error('Transação não encontrada.')

  if (transaction.type === 'ENTRADA' || transaction.type === 'DEVOLUCAO') {
    // Check if reversing this entry would cause current stock to become negative
    if (transaction.equipment.currentStock < transaction.quantity) {
      throw new Error(
        `Não é possível excluir esta movimentação: o estoque atual (${transaction.equipment.currentStock}) é menor que a quantidade a ser estornada (${transaction.quantity}). O item já foi utilizado em entregas.`
      )
    }

    await prisma.$transaction([
      prisma.equipment.update({
        where: { id: transaction.equipmentId },
        data: { currentStock: { decrement: transaction.quantity } }
      }),
      prisma.stockTransaction.delete({ where: { id } })
    ])
  } else if (transaction.type === 'SAIDA') {
    await prisma.$transaction([
      prisma.equipment.update({
        where: { id: transaction.equipmentId },
        data: { currentStock: { increment: Math.abs(transaction.quantity) } }
      }),
      prisma.stockTransaction.delete({ where: { id } })
    ])
  } else {
    await prisma.stockTransaction.delete({ where: { id } })
  }

  revalidatePath('/inventory')
  revalidatePath('/reports')
  revalidatePath('/')
}

export async function createAssignment(formData: FormData) {
  const employeeId = (formData.get('employeeId') as string)?.trim()
  const equipmentId = (formData.get('equipmentId') as string)?.trim()
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!employeeId) throw new Error('Selecione um colaborador.')
  if (!equipmentId) throw new Error('Selecione um EPI.')

  const assignedDate = new Date()

  await prisma.$transaction(async (tx) => {
    // 1. Fetch equipment and verify existence
    const equipment = await tx.equipment.findUnique({
      where: { id: equipmentId }
    })

    if (!equipment || !equipment.isActive) {
      throw new Error('EPI não encontrado ou inativo.')
    }

    // 2. Concurrency-safe atomic stock decrement
    const updatedStock = await tx.equipment.updateMany({
      where: {
        id: equipmentId,
        currentStock: { gt: 0 }
      },
      data: {
        currentStock: { decrement: 1 }
      }
    })

    if (updatedStock.count === 0) {
      throw new Error('Estoque insuficiente para este EPI (item esgotado no momento).')
    }

    // 3. Calculate safe expiration date
    const lifespan = equipment.lifespanMonths > 0 ? equipment.lifespanMonths : 6
    const expirationDate = new Date(assignedDate)
    expirationDate.setMonth(expirationDate.getMonth() + lifespan)

    // 4. Create the assignment
    await tx.assignment.create({
      data: {
        employeeId,
        equipmentId,
        assignedDate,
        expirationDate,
        notes,
        status: 'ACTIVE'
      }
    })

    // 5. Record the stock exit transaction
    await tx.stockTransaction.create({
      data: {
        equipmentId,
        quantity: -1,
        unitValue: equipment.unitValue,
        type: 'SAIDA',
        date: assignedDate
      }
    })
  })

  revalidatePath('/assignments')
  revalidatePath('/inventory')
  revalidatePath(`/inventory/${equipmentId}`)
  revalidatePath(`/employees/${employeeId}`)
  revalidatePath('/reports')
  revalidatePath('/')
  redirect('/assignments')
}

export async function deleteEmployee(id: string) {
  const activeAssignments = await prisma.assignment.count({
    where: { employeeId: id, status: 'ACTIVE' }
  })

  if (activeAssignments > 0) {
    throw new Error('Não é possível excluir um colaborador com EPIs ativos. Dê baixa/devolução nos EPIs primeiro.')
  }

  // Soft delete
  await prisma.employee.update({
    where: { id },
    data: { isActive: false }
  })

  revalidatePath('/employees')
  redirect('/employees')
}

export async function updateEquipment(id: string, formData: FormData) {
  const description = (formData.get('description') as string)?.trim()
  const ca = (formData.get('ca') as string)?.trim() || null
  const type = (formData.get('type') as string)?.trim() || 'EPI'
  const idealStock = Math.max(0, parseInt(formData.get('idealStock') as string) || 0)
  const currentStock = Math.max(0, parseInt(formData.get('currentStock') as string) || 0)
  const unitValue = parseMonetaryValue(formData.get('unitValue'))
  const lifespanMonths = Math.max(0, parseInt(formData.get('lifespanMonths') as string) || 0)
  const replacementCriteria = (formData.get('replacementCriteria') as string)?.trim() || null

  if (!description) {
    throw new Error('A descrição do EPI é obrigatória.')
  }

  await prisma.equipment.update({
    where: { id },
    data: {
      description,
      ca,
      type,
      idealStock,
      currentStock,
      unitValue,
      lifespanMonths,
      replacementCriteria
    }
  })

  revalidatePath('/inventory')
  revalidatePath(`/inventory/${id}`)
  redirect('/inventory')
}

export async function returnAssignment(
  assignmentId: string,
  reason: string,
  notes?: string
) {
  const returnDate = new Date()
  const finalReason = reason?.trim() || 'Devolução ao estoque'

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch assignment to inspect and verify
    const assignment = await tx.assignment.findUnique({
      where: { id: assignmentId },
      include: { equipment: true }
    })

    if (!assignment) {
      throw new Error('Entrega não encontrada.')
    }

    // 2. Concurrency check: only update if status is currently ACTIVE
    const updateResult = await tx.assignment.updateMany({
      where: {
        id: assignmentId,
        status: 'ACTIVE'
      },
      data: {
        status: 'RETURNED',
        returnDate,
        returnReason: finalReason,
        ...(notes?.trim()
          ? {
              notes: assignment.notes
                ? `${assignment.notes} | Obs devolução: ${notes.trim()}`
                : notes.trim()
            }
          : {})
      }
    })

    if (updateResult.count === 0) {
      throw new Error('Esta entrega já foi devolvida ou não está mais ativa.')
    }

    // 3. Increment stock of the equipment
    await tx.equipment.update({
      where: { id: assignment.equipmentId },
      data: {
        currentStock: { increment: 1 }
      }
    })

    // 4. Create stock transaction for audit trail and reports
    await tx.stockTransaction.create({
      data: {
        equipmentId: assignment.equipmentId,
        quantity: 1,
        unitValue: assignment.equipment?.unitValue ?? 0,
        type: 'DEVOLUCAO',
        date: returnDate
      }
    })

    return { success: true }
  }).then((res) => {
    revalidatePath('/assignments')
    revalidatePath('/inventory')
    revalidatePath('/reports')
    revalidatePath('/')
    return res
  })
}

export async function deleteEquipment(id: string) {
  const activeAssignments = await prisma.assignment.count({
    where: { equipmentId: id, status: 'ACTIVE' }
  })

  if (activeAssignments > 0) {
    throw new Error('Não é possível excluir um EPI que possui entregas ativas. Dê baixa/devolução nos EPIs primeiro.')
  }

  // Soft delete the equipment
  await prisma.equipment.update({
    where: { id },
    data: { isActive: false }
  })

  revalidatePath('/inventory')
  redirect('/inventory')
}
