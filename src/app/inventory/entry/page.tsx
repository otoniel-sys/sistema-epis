import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { StockEntryForm } from '@/components/StockEntryForm'

export const revalidate = 0;

export default async function NewStockEntryPage({ searchParams }: { searchParams: Promise<{ equipmentId?: string }> }) {
  const resolvedParams = await searchParams;
  const equipmentId = resolvedParams.equipmentId;

  const equipments = await prisma.equipment.findMany({
    where: { isActive: true },
    select: {
      id: true,
      description: true,
      ca: true,
      type: true,
      currentStock: true,
      idealStock: true,
      unitValue: true
    },
    orderBy: { description: 'asc' }
  })

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/inventory" className="btn-secondary" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1>Registrar Entrada de Estoque</h1>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '2px' }}>
              Dê entrada em compras ou reposições de EPIs com quantidade e valor financeiro.
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '720px' }}>
        <StockEntryForm equipments={equipments} selectedEquipmentId={equipmentId} />
      </div>
    </>
  )
}
