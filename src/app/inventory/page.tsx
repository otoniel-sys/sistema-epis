import prisma from '@/lib/prisma'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0;

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ q?: string, status?: string }> }) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || '';
  const status = resolvedParams.status || '';

  const equipments = await prisma.equipment.findMany({
    where: { 
      isActive: true,
      description: q ? { contains: q, mode: 'insensitive' } : undefined
    },
    orderBy: { description: 'asc' }
  })

  const filteredEquipments = equipments.filter(eq => {
    if (status === 'zerado') return eq.currentStock <= 0;
    if (status === 'comprar') return eq.currentStock < eq.idealStock;
    if (status === 'ok') return eq.currentStock >= eq.idealStock && eq.currentStock > 0;
    return true;
  });

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <h1>EPIs & Estoque</h1>
          
          <form style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '300px', justifyContent: 'flex-end' }} method="GET">
            <select name="status" defaultValue={status} style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)' }}>
              <option value="">Todos os status</option>
              <option value="zerado">Zerados</option>
              <option value="comprar">Precisam de compra</option>
              <option value="ok">Estoque OK</option>
            </select>
            
            <input type="text" name="q" placeholder="Buscar EPI..." defaultValue={q} style={{ flex: 1, maxWidth: '250px', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)' }} />
            
            <button type="submit" className="btn-secondary" style={{ padding: '0.5rem' }} title="Buscar">
              <Search size={20} />
            </button>
          </form>

          <Link href="/inventory/new" className="btn-primary">
            <Plus size={20} /> Novo EPI
          </Link>
        </div>
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
              {filteredEquipments.map(eq => {
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
              {filteredEquipments.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Nenhum EPI encontrado com esses filtros.
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
