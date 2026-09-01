import prisma from '@/lib/prisma'
import { PackageX, TrendingUp } from 'lucide-react'

export const revalidate = 0;

export default async function Dashboard() {
  const equipments = await prisma.equipment.findMany()
  const assignments = await prisma.assignment.findMany({
    where: { status: 'ACTIVE' },
    include: { employee: true, equipment: true }
  })

  let totalValue = 0
  let zeroedItems = 0

  equipments.forEach(eq => {
    totalValue += (eq.currentStock * eq.unitValue)
    if (eq.currentStock <= 0) zeroedItems++
  })

  // Calculate expiring assignments (next 30 days)
  const today = new Date()
  const next30Days = new Date()
  next30Days.setDate(today.getDate() + 30)

  const expiring = assignments.filter(a => {
    return a.expirationDate <= next30Days
  }).sort((a, b) => a.expirationDate.getTime() - b.expirationDate.getTime())

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="grid-3">
        <div className="card metric-card">
          <span className="title">Valor Total Estoque</span>
          <span className="value" style={{ color: 'var(--accent-success)' }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
          </span>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <TrendingUp size={16} /> Atualizado agora
          </div>
        </div>

        <div className="card metric-card">
          <span className="title">Itens Zerados</span>
          <span className="value" style={{ color: zeroedItems > 0 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
            {zeroedItems}
          </span>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <PackageX size={16} /> Necessitam de compra
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: '3rem', marginBottom: '1rem' }}>Alertas de Vencimento (Próximos 30 dias)</h2>
      <div className="card" style={{ padding: 0 }}>
        {expiring.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Nenhum EPI vencendo nos próximos 30 dias.
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>EPI</th>
                  <th>Data Entrega</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {expiring.map(a => {
                  const isExpired = a.expirationDate < today
                  return (
                    <tr key={a.id}>
                      <td>{a.employee.name}</td>
                      <td>{a.equipment.description}</td>
                      <td>{a.assignedDate.toLocaleDateString('pt-BR')}</td>
                      <td style={{ color: isExpired ? 'var(--accent-danger)' : 'var(--accent-warning)', fontWeight: 'bold' }}>
                        {a.expirationDate.toLocaleDateString('pt-BR')}
                      </td>
                      <td>
                        <span className={`badge ${isExpired ? 'badge-danger' : 'badge-warning'}`}>
                          {isExpired ? 'Vencido' : 'Vencendo'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
