import prisma from '@/lib/prisma'
import { ClipboardCheck, Search, RotateCcw, CheckCircle2, AlertTriangle, Package, Clock, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { ReturnAssignmentModal } from '@/components/ReturnAssignmentModal'

export const revalidate = 0;

export default async function AssignmentsPage({
  searchParams
}: {
  searchParams: Promise<{ employee?: string; date?: string; status?: string }>
}) {
  const resolvedParams = await searchParams;
  const employeeQ = resolvedParams.employee || '';
  const dateQ = resolvedParams.date || '';
  const statusQ = resolvedParams.status || 'ALL';

  const where: any = {}

  if (employeeQ) {
    where.employee = { name: { contains: employeeQ, mode: 'insensitive' } }
  }

  if (dateQ) {
    const parts = dateQ.split('-').map(Number)
    if (parts.length === 3 && parts.every(n => !isNaN(n))) {
      const [year, month, day] = parts
      const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
      const end = new Date(Date.UTC(year, month - 1, day + 1, 3, 59, 59, 999))
      where.assignedDate = { gte: start, lte: end }
    }
  }

  if (statusQ === 'ACTIVE') {
    where.status = 'ACTIVE'
  } else if (statusQ === 'RETURNED') {
    where.status = 'RETURNED'
  } else if (statusQ === 'EXPIRED') {
    where.status = 'ACTIVE'
    where.expirationDate = { lt: new Date() }
  }

  const [assignments, allStats] = await Promise.all([
    prisma.assignment.findMany({
      where,
      orderBy: { assignedDate: 'desc' },
      include: {
        employee: true,
        equipment: true
      }
    }),
    prisma.assignment.groupBy({
      by: ['status'],
      _count: { id: true }
    })
  ])

  const totalActive = allStats.find(s => s.status === 'ACTIVE')?._count.id || 0
  const totalReturned = allStats.find(s => s.status === 'RETURNED')?._count.id || 0
  const totalAll = totalActive + totalReturned

  return (
    <>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>Entregas e Devoluções</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Histórico completo de entregas de EPIs e registro de devoluções com retorno ao estoque.
          </p>
        </div>

        <Link href="/assignments/new" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ClipboardCheck size={20} /> Registrar Entrega
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid-3" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
        <Link
          href={`/assignments?${new URLSearchParams({ ...(employeeQ ? { employee: employeeQ } : {}), ...(dateQ ? { date: dateQ } : {}), status: 'ALL' }).toString()}`}
          className="card metric-card"
          style={{
            padding: '1rem 1.25rem',
            border: statusQ === 'ALL' ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="title" style={{ fontSize: '0.78rem' }}>Total de Entregas</span>
            <ShieldCheck size={18} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="value" style={{ fontSize: '1.75rem', margin: '0.2rem 0' }}>{totalAll}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Todas as movimentações registradas</span>
        </Link>

        <Link
          href={`/assignments?${new URLSearchParams({ ...(employeeQ ? { employee: employeeQ } : {}), ...(dateQ ? { date: dateQ } : {}), status: 'ACTIVE' }).toString()}`}
          className="card metric-card"
          style={{
            padding: '1rem 1.25rem',
            border: statusQ === 'ACTIVE' ? '1px solid var(--accent-warning)' : '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="title" style={{ fontSize: '0.78rem' }}>Ativos em Posse</span>
            <Clock size={18} style={{ color: 'var(--accent-warning)' }} />
          </div>
          <div className="value" style={{ fontSize: '1.75rem', margin: '0.2rem 0', color: 'var(--accent-warning)' }}>{totalActive}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>EPIs atualmente em uso com colaboradores</span>
        </Link>

        <Link
          href={`/assignments?${new URLSearchParams({ ...(employeeQ ? { employee: employeeQ } : {}), ...(dateQ ? { date: dateQ } : {}), status: 'RETURNED' }).toString()}`}
          className="card metric-card"
          style={{
            padding: '1rem 1.25rem',
            border: statusQ === 'RETURNED' ? '1px solid var(--accent-success)' : '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="title" style={{ fontSize: '0.78rem' }}>Devolvidos ao Estoque</span>
            <RotateCcw size={18} style={{ color: 'var(--accent-success)' }} />
          </div>
          <div className="value" style={{ fontSize: '1.75rem', margin: '0.2rem 0', color: 'var(--accent-success)' }}>{totalReturned}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Itens recolhidos ou trocados</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <form style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }} method="GET">
          <input type="hidden" name="status" value={statusQ} />
          <div style={{ flex: '1 1 250px', position: 'relative' }}>
            <input
              type="text"
              name="employee"
              placeholder="Buscar por colaborador..."
              defaultValue={employeeQ}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <div style={{ flex: '0 1 180px' }}>
            <input
              type="date"
              name="date"
              defaultValue={dateQ}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <button type="submit" className="btn-secondary" style={{ padding: '0.55rem 1rem' }}>
            <Search size={16} /> Filtrar
          </button>
          {(employeeQ || dateQ || statusQ !== 'ALL') && (
            <Link href="/assignments" className="btn-secondary" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Limpar filtros
            </Link>
          )}
        </form>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Data da Retirada</th>
                <th>Colaborador</th>
                <th>EPI / Equipamento</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Motivo / Informações de Devolução</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(assignment => {
                const isExpired = assignment.expirationDate < new Date() && assignment.status === 'ACTIVE'
                const isReturned = assignment.status === 'RETURNED'

                return (
                  <tr key={assignment.id}>
                    <td style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                      {assignment.assignedDate.toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {assignment.employee ? (
                          <Link href={`/employees/${assignment.employee.id}`} style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                            {assignment.employee.name}
                          </Link>
                        ) : (
                          <span>Colaborador não encontrado</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {assignment.employee ? `${assignment.employee.department} · ${assignment.employee.role}` : '—'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{assignment.equipment?.description || 'EPI não identificado'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {assignment.equipment?.ca ? `CA: ${assignment.equipment.ca}` : (assignment.equipment?.type || 'EPI')}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: isExpired ? 'var(--accent-danger)' : 'inherit', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isExpired && <AlertTriangle size={14} style={{ color: 'var(--accent-danger)' }} />}
                        {assignment.expirationDate.toLocaleDateString('pt-BR')}
                      </div>
                      {isExpired && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-danger)', fontWeight: 600 }}>
                          VENCIDO
                        </div>
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
                      ) : isExpired ? (
                        <span className="badge badge-danger">ATIVO (VENCIDO)</span>
                      ) : (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(251, 191, 36, 0.15)',
                            color: 'var(--accent-warning)',
                            border: '1px solid rgba(251, 191, 36, 0.3)'
                          }}
                        >
                          EM USO
                        </span>
                      )}
                    </td>
                    <td>
                      {isReturned ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {assignment.returnReason || 'Devolução ao estoque'}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
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
                          employeeName={assignment.employee.name}
                          equipmentDescription={assignment.equipment.description}
                          equipmentCa={assignment.equipment.ca}
                          currentStock={assignment.equipment.currentStock}
                          assignedDate={assignment.assignedDate.toLocaleDateString('pt-BR')}
                          buttonLabel="Devolver"
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
                          title="Item já foi devolvido e reincorporado ao estoque"
                        >
                          <CheckCircle2 size={13} /> Retornado ao Estoque
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}

              {assignments.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Nenhuma entrega encontrada para os filtros aplicados.
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
