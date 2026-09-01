import prisma from '@/lib/prisma'
import { ClipboardCheck, Search } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0;

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ employee?: string, date?: string }> }) {
  const resolvedParams = await searchParams;
  const employeeQ = resolvedParams.employee || '';
  const dateQ = resolvedParams.date || '';

  const where: any = {}

  if (employeeQ) {
    where.employee = { name: { contains: employeeQ } }
  }

  if (dateQ) {
    const start = new Date(`${dateQ}T00:00:00.000Z`)
    const end = new Date(`${dateQ}T23:59:59.999Z`)
    where.assignedDate = { gte: start, lte: end }
  }

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy: { assignedDate: 'desc' },
    include: {
      employee: true,
      equipment: true
    }
  })

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', justifyContent: 'space-between' }}>
          <h1>Entregas e Devoluções</h1>

          <form style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '500px' }} method="GET">
            <input type="text" name="employee" placeholder="Filtrar colaborador..." defaultValue={employeeQ} style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)' }} />
            <input type="date" name="date" defaultValue={dateQ} style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)' }} />
            <button type="submit" className="btn-secondary" style={{ padding: '0.5rem' }}>
              <Search size={20} />
            </button>
          </form>

          <Link href="/assignments/new" className="btn-primary">
            <ClipboardCheck size={20} /> Registrar Entrega
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Data da Retirada</th>
                <th>Colaborador</th>
                <th>EPI</th>
                <th>Vencimento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(assignment => {
                const isExpired = assignment.expirationDate < new Date() && assignment.status === 'ACTIVE'
                return (
                  <tr key={assignment.id}>
                    <td>{assignment.assignedDate.toLocaleDateString('pt-BR')}</td>
                    <td style={{ fontWeight: 500 }}>{assignment.employee.name}</td>
                    <td>{assignment.equipment.description}</td>
                    <td style={{ color: isExpired ? 'var(--accent-danger)' : 'inherit' }}>
                      {assignment.expirationDate.toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <span className={`badge ${assignment.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                        {assignment.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
