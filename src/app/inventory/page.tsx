import prisma from '@/lib/prisma'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0;

export default async function InventoryPage() {
  const equipments = await prisma.equipment.findMany({
    orderBy: { description: 'asc' }
  })

  return (
    <>
      <div className="page-header">
        <h1>EPIs & Estoque</h1>
        <Link href="/inventory/new" className="btn-primary">
          <Plus size={20} /> Novo EPI
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Descrição do EPI</th>
                <th>CA</th>
                <th>Tipo</th>
                <th>Estoque Ideal</th>
                <th>Saldo Atual</th>
                <th>Comprar?</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {equipments.map(eq => {
                const isZero = eq.currentStock <= 0;
                const needToBuy = eq.currentStock < eq.idealStock;
                
                return (
                  <tr key={eq.id}>
                    <td>
                      <span className={`badge ${isZero ? 'badge-danger' : 'badge-success'}`}>
                        {isZero ? 'ZERADO' : 'ATIVO'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{eq.description}</td>
                    <td>{eq.ca || 'N/A'}</td>
                    <td>{eq.type}</td>
                    <td>{eq.idealStock}</td>
                    <td style={{ fontWeight: 'bold', color: isZero ? 'var(--accent-danger)' : 'inherit' }}>
                      {eq.currentStock}
                    </td>
                    <td>
                      {needToBuy ? (
                        <span style={{ color: 'var(--accent-warning)', fontWeight: 600 }}>SIM</span>
                      ) : (
                        <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>NÃO</span>
                      )}
                    </td>
                    <td>
                      <Link href={`/inventory/${eq.id}`} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', display: 'inline-block' }}>
                        Editar
                      </Link>
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
