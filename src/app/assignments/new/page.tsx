import { createAssignment } from '@/app/actions'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import prisma from '@/lib/prisma'

export const revalidate = 0;

export default async function NewAssignmentPage() {
  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } })
  const equipments = await prisma.equipment.findMany({ 
    where: { currentStock: { gt: 0 } },
    orderBy: { description: 'asc' } 
  })

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/assignments" className="btn-secondary" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1>Registrar Entrega de EPI</h1>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <form action={createAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="employeeId">Colaborador</label>
            <select id="employeeId" name="employeeId" required>
              <option value="">Selecione um colaborador...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} - {emp.role}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="equipmentId">EPI (Apenas itens em estoque)</label>
            <select id="equipmentId" name="equipmentId" required>
              <option value="">Selecione o EPI...</option>
              {equipments.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.description} (Estoque: {eq.currentStock})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Observações adicionais</label>
            <input type="text" id="notes" name="notes" placeholder="Motivo da troca, tamanho, etc." />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary">
              <Save size={20} /> Registrar Entrega
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
