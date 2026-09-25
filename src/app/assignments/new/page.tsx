import { createAssignment } from '@/app/actions'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import prisma from '@/lib/prisma'

export const revalidate = 0;

export default async function NewAssignmentPage() {
  const employees = await prisma.employee.findMany({ 
    where: { isActive: true },
    orderBy: { name: 'asc' } 
  })
  const equipments = await prisma.equipment.findMany({ 
    where: { currentStock: { gt: 0 }, isActive: true },
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
        {equipments.length === 0 && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: '0.875rem' }}>
            <strong>Atenção:</strong> Não há nenhum EPI com estoque positivo no momento.{' '}
            <Link href="/inventory/entry" style={{ textDecoration: 'underline', fontWeight: 600 }}>
              Clique aqui para registrar entrada de estoque
            </Link>{' '}
            antes de realizar entregas.
          </div>
        )}

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
            <select id="equipmentId" name="equipmentId" required disabled={equipments.length === 0}>
              <option value="">{equipments.length === 0 ? 'Nenhum EPI em estoque' : 'Selecione o EPI...'}</option>
              {equipments.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.description} (Estoque: {eq.currentStock})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Observações adicionais</label>
            <input type="text" id="notes" name="notes" placeholder="Motivo da entrega, tamanho, etc." />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={equipments.length === 0 || employees.length === 0}>
              <Save size={20} /> Registrar Entrega
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
