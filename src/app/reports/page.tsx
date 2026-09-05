import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowDownToLine, ClipboardCheck, TrendingUp, TrendingDown, Scale, DollarSign, Package } from 'lucide-react'
import { MonthPicker } from '@/components/MonthPicker'
import { ReportViewTabs, EpiSummaryItem, EntryItem, ExitItem } from '@/components/ReportViewTabs'

export const revalidate = 0;

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ month?: string, year?: string }> }) {
  const resolvedParams = await searchParams;
  const now = new Date()
  const month = parseInt(resolvedParams.month || '') || (now.getMonth() + 1)
  const year = parseInt(resolvedParams.year || '') || now.getFullYear()

  // Intervalo do mês selecionado (UTC)
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

  const monthName = MONTH_NAMES[month - 1]

  // Buscar todos os equipamentos ativos
  const equipments = await prisma.equipment.findMany({
    where: { isActive: true },
    orderBy: { description: 'asc' }
  })

  // Buscar todas as entradas no mês
  const entries = await prisma.stockTransaction.findMany({
    where: {
      type: 'ENTRADA',
      date: { gte: startDate, lte: endDate }
    },
    include: { equipment: true },
    orderBy: { date: 'desc' }
  })

  // Buscar todas as entregas (saídas) no mês
  const assignments = await prisma.assignment.findMany({
    where: {
      assignedDate: { gte: startDate, lte: endDate }
    },
    include: {
      equipment: true,
      employee: true
    },
    orderBy: { assignedDate: 'desc' }
  })

  // Cálculos de totais
  let totalEntriesQty = 0
  let totalEntriesValue = 0

  entries.forEach(e => {
    totalEntriesQty += e.quantity
    const unit = e.unitValue ?? e.equipment?.unitValue ?? 0
    totalEntriesValue += (e.quantity * unit)
  })

  let totalExitsQty = 0
  let totalExitsValue = 0

  assignments.forEach(a => {
    totalExitsQty += 1
    totalExitsValue += (a.equipment?.unitValue ?? 0)
  })

  const netQty = totalEntriesQty - totalExitsQty
  const netValue = totalEntriesValue - totalExitsValue
  const avgCostPerExit = totalExitsQty > 0 ? (totalExitsValue / totalExitsQty) : 0

  // Mapa consolidado por EPI
  const epiMap = new Map<string, EpiSummaryItem>()

  equipments.forEach(eq => {
    epiMap.set(eq.id, {
      id: eq.id,
      description: eq.description,
      ca: eq.ca,
      type: eq.type,
      currentStock: eq.currentStock,
      entriesQty: 0,
      entriesValue: 0,
      exitsQty: 0,
      exitsValue: 0,
      netQty: 0,
      netValue: 0
    })
  })

  entries.forEach(e => {
    let item = epiMap.get(e.equipmentId)
    if (!item && e.equipment) {
      item = {
        id: e.equipment.id,
        description: e.equipment.description,
        ca: e.equipment.ca,
        type: e.equipment.type,
        currentStock: e.equipment.currentStock,
        entriesQty: 0,
        entriesValue: 0,
        exitsQty: 0,
        exitsValue: 0,
        netQty: 0,
        netValue: 0
      }
      epiMap.set(e.equipmentId, item)
    }
    if (item) {
      const unit = e.unitValue ?? e.equipment?.unitValue ?? 0
      const val = e.quantity * unit
      item.entriesQty += e.quantity
      item.entriesValue += val
      item.netQty += e.quantity
      item.netValue += val
    }
  })

  assignments.forEach(a => {
    let item = epiMap.get(a.equipmentId)
    if (!item && a.equipment) {
      item = {
        id: a.equipment.id,
        description: a.equipment.description,
        ca: a.equipment.ca,
        type: a.equipment.type,
        currentStock: a.equipment.currentStock,
        entriesQty: 0,
        entriesValue: 0,
        exitsQty: 0,
        exitsValue: 0,
        netQty: 0,
        netValue: 0
      }
      epiMap.set(a.equipmentId, item)
    }
    if (item) {
      const unit = a.equipment?.unitValue ?? 0
      item.exitsQty += 1
      item.exitsValue += unit
      item.netQty -= 1
      item.netValue -= unit
    }
  })

  const epiSummaries = Array.from(epiMap.values()).sort((a, b) => {
    const movA = a.entriesQty + a.exitsQty
    const movB = b.entriesQty + b.exitsQty
    if (movB !== movA) return movB - movA
    return a.description.localeCompare(b.description)
  })

  // Formatar itens para abas
  const formattedEntries: EntryItem[] = entries.map(e => ({
    id: e.id,
    date: new Date(e.date).toLocaleDateString('pt-BR'),
    equipmentDescription: e.equipment?.description || 'EPI',
    equipmentCa: e.equipment?.ca || null,
    quantity: e.quantity,
    unitValue: e.unitValue ?? e.equipment?.unitValue ?? 0,
    totalValue: e.quantity * (e.unitValue ?? e.equipment?.unitValue ?? 0)
  }))

  const formattedExits: ExitItem[] = assignments.map(a => ({
    id: a.id,
    date: new Date(a.assignedDate).toLocaleDateString('pt-BR'),
    equipmentDescription: a.equipment?.description || 'EPI',
    equipmentCa: a.equipment?.ca || null,
    employeeName: a.employee?.name || 'Colaborador',
    employeeRole: a.employee?.role || '',
    employeeDept: a.employee?.department || '',
    unitValue: a.equipment?.unitValue || 0,
    expirationDate: new Date(a.expirationDate).toLocaleDateString('pt-BR'),
    status: a.status
  }))

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  return (
    <>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', width: '100%', flexWrap: 'wrap' }}>
          <div>
            <h1>Movimentações de EPIs</h1>
            <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '2px' }}>
              Contabilização de Entradas (compras) e Saídas (entregas) em quantidade e valor em dinheiro (R$).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <MonthPicker currentMonth={month} currentYear={year} />

            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/inventory/entry" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowDownToLine size={16} /> Nova Entrada
              </Link>
              <Link href="/assignments/new" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ClipboardCheck size={16} /> Nova Entrega
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grade" style={{ marginBottom: '24px' }}>
        {/* Card 1: Entradas */}
        <div style={{ gridColumn: 'span 3' }}>
          <section style={{
            background: 'var(--plane)',
            border: 'var(--bw) solid var(--stroke)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'var(--good)'
            }} />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-2)' }}>Entradas de EPIs</span>
                <span style={{ padding: '4px 8px', borderRadius: 'var(--radius)', background: 'var(--good-bg)', color: 'var(--good)', fontSize: '11px', fontWeight: 700 }}>
                  COMPRAS
                </span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--good)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(totalEntriesValue)}
              </div>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--stroke)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Volume recebido:</span>
              <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>+{totalEntriesQty} unidades</strong>
            </div>
          </section>
        </div>

        {/* Card 2: Saídas */}
        <div style={{ gridColumn: 'span 3' }}>
          <section style={{
            background: 'var(--plane)',
            border: 'var(--bw) solid var(--stroke)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'var(--bad)'
            }} />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-2)' }}>Saídas de EPIs</span>
                <span style={{ padding: '4px 8px', borderRadius: 'var(--radius)', background: 'var(--bad-bg)', color: 'var(--bad)', fontSize: '11px', fontWeight: 700 }}>
                  ENTREGAS
                </span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--bad)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(totalExitsValue)}
              </div>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--stroke)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Volume entregue:</span>
              <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>-{totalExitsQty} unidades</strong>
            </div>
          </section>
        </div>

        {/* Card 3: Balanço Líquido */}
        <div style={{ gridColumn: 'span 3' }}>
          <section style={{
            background: 'var(--plane)',
            border: 'var(--bw) solid var(--stroke)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: netValue >= 0 ? 'var(--good)' : 'var(--warn)'
            }} />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-2)' }}>Balanço Líquido (R$)</span>
                <span style={{ padding: '4px 8px', borderRadius: 'var(--radius)', background: 'var(--plane-2)', color: 'var(--ink-2)', fontSize: '11px', fontWeight: 700 }}>
                  {monthName.toUpperCase()}/{year}
                </span>
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 800,
                color: netValue >= 0 ? 'var(--good)' : 'var(--warn)',
                lineHeight: 1.1,
                fontVariantNumeric: 'tabular-nums'
              }}>
                {netValue >= 0 ? `+${formatCurrency(netValue)}` : formatCurrency(netValue)}
              </div>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--stroke)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Variação de estoque:</span>
              <strong style={{ fontSize: '14px', color: netQty >= 0 ? 'var(--good)' : 'var(--warn)' }}>
                {netQty >= 0 ? `+${netQty}` : netQty} unidades
              </strong>
            </div>
          </section>
        </div>

        {/* Card 4: Custo Médio por Entrega */}
        <div style={{ gridColumn: 'span 3' }}>
          <section style={{
            background: 'var(--plane)',
            border: 'var(--bw) solid var(--stroke)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'var(--acc)'
            }} />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-2)' }}>Custo Médio / Entrega</span>
                <span style={{ padding: '4px 8px', borderRadius: 'var(--radius)', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--acc)', fontSize: '11px', fontWeight: 700 }}>
                  INDICADOR
                </span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(avgCostPerExit)}
              </div>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--stroke)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Total de entregas:</span>
              <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>{totalExitsQty} retiradas</strong>
            </div>
          </section>
        </div>
      </div>

      {/* Main Tabs Section */}
      <ReportViewTabs
        epiSummaries={epiSummaries}
        entries={formattedEntries}
        exits={formattedExits}
        monthName={monthName}
        year={year}
      />
    </>
  )
}
