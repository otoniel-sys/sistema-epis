import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, CheckCircle2 } from 'lucide-react'
import { deleteEmployee } from '@/app/actions'
import { ReturnAssignmentModal } from '@/components/ReturnAssignmentModal'

export const revalidate = 0;

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
          <div>
            <h1 style={{ margin: 0 }}>Perfil: {employee.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
              {employee.department} · {employee.role}
            </p>
          </div>
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
        <h3>Informações do Colaborador</h3>
        <p><strong>Cargo:</strong> {employee.role}</p>
        <p><strong>Setor:</strong> {employee.department}</p>
        <p><strong>EPIs Ativos em Uso:</strong> {activeCount}</p>
        
        {activeCount > 0 && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <strong>Atenção:</strong> Este colaborador possui {activeCount} EPI(s) ativo(s). Você precisa dar baixa/devolver os EPIs abaixo para retorná-los ao estoque antes de poder excluir o colaborador.
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '1rem', padding: 0 }}>
        <h3 style={{ padding: '1.5rem 1.5rem 0.5rem' }}>Histórico de EPIs</h3>
        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>EPI / Descrição</th>
                <th>Data de Entrega</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Motivo / Histórico</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {employee.assignments.map(assignment => {
                const isExpired = assignment.expirationDate < new Date() && assignment.status === 'ACTIVE'
                const isReturned = assignment.status === 'RETURNED'

                return (
                  <tr key={assignment.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {assignment.equipment.description}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {assignment.equipment.ca ? `CA: ${assignment.equipment.ca}` : assignment.equipment.type}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{assignment.assignedDate.toLocaleDateString('pt-BR')}</td>
                    <td style={{ fontSize: '0.85rem', color: isExpired ? 'var(--accent-danger)' : 'inherit' }}>
                      {assignment.expirationDate.toLocaleDateString('pt-BR')}
                      {isExpired && (
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--accent-danger)', fontWeight: 600 }}>
                          VENCIDO
                        </span>
                      )}
                    </td>
                    <td>
                      {isReturned ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(52, 211, 153, 0.15)',
                            color: 'var(--accent-success)',
                            border: '1px solid rgba(52, 211, 153, 0.3)'
                          }}
                        >
                          DEVOLVIDO
                        </span>
                      ) : (
                        <span className={`badge ${isExpired ? 'badge-danger' : 'badge-warning'}`}>
                          {isExpired ? 'VENCIDO' : 'ATIVO'}
                        </span>
                      )}
                    </td>
                    <td>
                      {isReturned ? (
                        <div style={{ fontSize: '0.82rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {assignment.returnReason || 'Devolvido ao estoque'}
                          </span>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Devolvido em {assignment.returnDate ? assignment.returnDate.toLocaleDateString('pt-BR') : '-'}
                          </div>
                          {assignment.notes && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>
                              {assignment.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {assignment.notes || '—'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {assignment.status === 'ACTIVE' ? (
                        <ReturnAssignmentModal
                          assignmentId={assignment.id}
                          employeeName={employee.name}
                          equipmentDescription={assignment.equipment.description}
                          equipmentCa={assignment.equipment.ca}
                          currentStock={assignment.equipment.currentStock}
                          assignedDate={assignment.assignedDate.toLocaleDateString('pt-BR')}
                          buttonLabel="Devolver / Baixa"
                        />
                      ) : (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--accent-success)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(52, 211, 153, 0.08)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(52, 211, 153, 0.2)'
                          }}
                        >
                          <CheckCircle2 size={13} /> No Estoque
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {employee.assignments.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    Nenhum EPI registrado para este colaborador.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
