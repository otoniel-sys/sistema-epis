'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createEmployee(formData: FormData) {
  const name = formData.get('name') as string
  const role = formData.get('role') as string
  const department = formData.get('department') as string

  await prisma.employee.create({
    data: { name, role, department }
  })

  revalidatePath('/employees')
  redirect('/employees')
}

export async function createEquipment(formData: FormData) {
  const description = formData.get('description') as string
  const ca = formData.get('ca') as string
  const type = formData.get('type') as string
  const idealStock = parseInt(formData.get('idealStock') as string) || 0
  const currentStock = parseInt(formData.get('currentStock') as string) || 0
  const unitValue = parseFloat(formData.get('unitValue') as string) || 0
  const lifespanMonths = parseInt(formData.get('lifespanMonths') as string) || 0
  const replacementCriteria = formData.get('replacementCriteria') as string

  await prisma.equipment.create({
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
  redirect('/inventory')
}

export async function createAssignment(formData: FormData) {
  const employeeId = formData.get('employeeId') as string
  const equipmentId = formData.get('equipmentId') as string
  const notes = formData.get('notes') as string

  // Fetch the equipment to know its lifespan
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId }
  })

  if (!equipment) throw new Error('EPI não encontrado')
  if (equipment.currentStock <= 0) throw new Error('Estoque insuficiente para este EPI')

  // Calculate expiration date
  const assignedDate = new Date()
  const expirationDate = new Date()
  expirationDate.setMonth(expirationDate.getMonth() + equipment.lifespanMonths)

  // Use a transaction to ensure both operations succeed
  await prisma.$transaction([
    // Create the assignment
    prisma.assignment.create({
      data: {
        employeeId,
        equipmentId,
        assignedDate,
        expirationDate,
        notes,
        status: 'ACTIVE'
      }
    }),
    // Decrease the stock
    prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        currentStock: { decrement: 1 }
      }
    })
  ])

  revalidatePath('/assignments')
  revalidatePath('/inventory')
  revalidatePath('/')
  redirect('/assignments')
}

export async function deleteEmployee(id: string) {
  // Check if they have active assignments
  const activeAssignments = await prisma.assignment.count({
    where: { employeeId: id, status: 'ACTIVE' }
  })

  if (activeAssignments > 0) {
    throw new Error('Não é possível excluir um colaborador com EPIs ativos. Dê baixa nos EPIs primeiro.')
  }

  // Atualiza para inativo ao invés de apagar do banco
  await prisma.employee.update({
    where: { id },
    data: { isActive: false }
  })

  revalidatePath('/employees')
  redirect('/employees')
}

export async function updateEquipment(id: string, formData: FormData) {
  const description = formData.get('description') as string
  const ca = formData.get('ca') as string
  const type = formData.get('type') as string
  const idealStock = parseInt(formData.get('idealStock') as string) || 0
  const currentStock = parseInt(formData.get('currentStock') as string) || 0
  const unitValue = parseFloat(formData.get('unitValue') as string) || 0
  const lifespanMonths = parseInt(formData.get('lifespanMonths') as string) || 0
  const replacementCriteria = formData.get('replacementCriteria') as string

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

export async function returnAssignment(assignmentId: string, employeeId: string) {
  await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      status: 'RETURNED',
      returnDate: new Date()
    }
  })

  revalidatePath(`/employees/${employeeId}`)
  revalidatePath('/assignments')
}

export async function deleteEquipment(id: string) {
  // Check if it has any active assignments
  const activeAssignments = await prisma.assignment.count({
    where: { equipmentId: id, status: 'ACTIVE' }
  })

  if (activeAssignments > 0) {
    throw new Error('Não é possível excluir um EPI que possui entregas ativas. Dê baixa nos EPIs primeiro.')
  }

  // Soft delete the equipment
  await prisma.equipment.update({
    where: { id },
    data: { isActive: false }
  })

  revalidatePath('/inventory')
  redirect('/inventory')
}
