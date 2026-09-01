import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, CheckCircle } from 'lucide-react'
import { deleteEmployee, returnAssignment } from '@/app/actions'

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  const employee = await prisma.employee.findUnique({
    where: { id: resolvedParams.id },
    include: {
      assignments: {
        include: { equipment: true },
        orderBy: { assignedDate: 'desc' }
      }
    }
  })

  if (!employee) notFound()

  const activeCount = employee.assignments.filter(a => a.status === 'ACTIVE').length

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/employees" className="btn-secondary" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1>Perfil: {employee.name}</h1>
        </div>
        
        <form action={async () => {
          'use server';
          await deleteEmployee(employee.id);
        }}>
          <button type="submit" className="btn-secondary" style={{ color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }} disabled={activeCount > 0} title={activeCount > 0 ? 'Não é possível excluir colaborador com EPIs ativos' : 'Excluir Colaborador'}>
            <Trash2 size={20} /> Excluir Colaborador
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Informações</h3>
        <p><strong>Cargo:</strong> {employee.role}</p>
        <p><strong>Setor:</strong> {employee.department}</p>
        <p><strong>EPIs Ativos:</strong> {activeCount}</p>
        
        {activeCount > 0 && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <strong>Atenção:</strong> Este colaborador possui {activeCount} EPI(s) ativo(s). Você precisa dar baixa nos EPIs abaixo antes de poder excluir o colaborador.
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '1rem', padding: 0 }}>
        <h3 style={{ padding: '1.5rem 1.5rem 0' }}>Histórico de EPIs</h3>
        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>EPI</th>
                <th>Data de Entrega</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {employee.assignments.map(assignment => {
                const isExpired = assignment.expirationDate < new Date() && assignment.status === 'ACTIVE'
                return (
                  <tr key={assignment.id}>
                    <td style={{ fontWeight: 500 }}>{assignment.equipment.description}</td>
                    <td>{assignment.assignedDate.toLocaleDateString('pt-BR')}</td>
                    <td style={{ color: isExpired ? 'var(--accent-danger)' : 'inherit' }}>
                      {assignment.expirationDate.toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <span className={`badge ${assignment.status === 'ACTIVE' ? 'badge-warning' : 'badge-success'}`}>
                        {assignment.status === 'ACTIVE' ? 'ATIVO' : 'DEVOLVIDO'}
                      </span>
                    </td>
                    <td>
                      {assignment.status === 'ACTIVE' && (
                        <form action={async () => {
                          'use server';
                          await returnAssignment(assignment.id, employee.id);
                        }}>
                          <button type="submit" className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle size={14} /> Dar Baixa
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                )
              })}
              {employee.assignments.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum EPI registrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
