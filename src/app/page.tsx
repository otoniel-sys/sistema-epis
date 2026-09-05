import prisma from '@/lib/prisma'
import { TrendingUp, ArrowDownToLine, ArrowUpFromLine, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { GaugeChart, LineChart } from '@/components/DashboardCharts'

export const revalidate = 0;

export default async function Dashboard() {
  const equipments = await prisma.equipment.findMany({
    where: { isActive: true }
  })
  
  // We include inactive equipment assignments too if they're still active status,
  // but let's just get all active assignments.
  const assignments = await prisma.assignment.findMany({
    where: { status: 'ACTIVE' },
    include: { employee: true, equipment: true }
  })

  // 1. Total Value & Health
  let totalValue = 0
  let healthyStockCount = 0
  
  equipments.forEach(eq => {
    totalValue += (eq.currentStock * eq.unitValue)
    if (eq.currentStock >= eq.idealStock && eq.currentStock > 0) healthyStockCount++
  })

  const stockHealthPercent = equipments.length > 0 ? Math.round((healthyStockCount / equipments.length) * 100) : 0

  // 2. Entregas (Line - Last 30 days)
  const today = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(today.getDate() - 29)
  
  const recentAssignments = await prisma.assignment.findMany({
    where: {
      assignedDate: { gte: thirtyDaysAgo }
    }
  })

  // 3. Movimentação do Mês Atual (Entradas vs Saídas)
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0)
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)

  const monthEntries = await prisma.stockTransaction.findMany({
    where: {
      type: 'ENTRADA',
      date: { gte: currentMonthStart, lte: currentMonthEnd }
    },
    include: { equipment: true }
  })

  const monthAssignments = await prisma.assignment.findMany({
    where: {
      assignedDate: { gte: currentMonthStart, lte: currentMonthEnd }
    },
    include: { equipment: true }
  })

  let monthEntriesQty = 0
  let monthEntriesVal = 0
  monthEntries.forEach(e => {
    monthEntriesQty += e.quantity
    monthEntriesVal += e.quantity * (e.unitValue ?? e.equipment?.unitValue ?? 0)
  })

  let monthExitsQty = monthAssignments.length
  let monthExitsVal = 0
  monthAssignments.forEach(a => {
    monthExitsVal += (a.equipment?.unitValue ?? 0)
  })

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const currentMonthName = monthNames[today.getMonth()]

  const lineLabels: string[] = []
  const lineData: number[] = []
  
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo)
    d.setDate(d.getDate() + i)
    const label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`
    lineLabels.push(label)
    
    const count = recentAssignments.filter(a => {
      return a.assignedDate.getDate() === d.getDate() && a.assignedDate.getMonth() === d.getMonth()
    }).length
    
    lineData.push(count)
  }

  // 4. Top Departamentos (Bar List)
  const deptsMap: Record<string, number> = {}
  assignments.forEach(a => {
    const dept = a.employee.department || 'Outros'
    deptsMap[dept] = (deptsMap[dept] || 0) + 1
  })
  
  const topDepts = Object.entries(deptsMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4)

  const totalActiveAssignments = assignments.length

  // Expiring (Tabela)
  const next30Days = new Date()
  next30Days.setDate(today.getDate() + 30)

  const expiring = assignments.filter(a => {
    return a.expirationDate <= next30Days
  }).sort((a, b) => a.expirationDate.getTime() - b.expirationDate.getTime())

  const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)
  const formattedEntriesVal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthEntriesVal)
  const formattedExitsVal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthExitsVal)

  return (
    <>
      <div className="topo">
        <div className="marca">
          <h1>Dashboard de EPIs</h1>
          <p>Visão geral do estoque e entregas · Tempo Real</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/reports" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            Ver Movimentações do Mês <ArrowRight size={14} />
          </Link>
          <span className="periodo">Últimos 30 dias</span>
        </div>
      </div>

      <div className="grade">
        {/* Card Valor Total Estoque */}
        <div style={{ gridColumn: 'span 6' }}>
          <section style={{ background: 'var(--plane)', border: 'var(--bw) solid var(--stroke)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
              <div><b style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>Valor Total em Estoque</b></div>
            </div>
            
            <div style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
              {formattedTotal}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 700, padding: '4px 8px', borderRadius: 'var(--radius)', color: 'var(--good)', background: 'var(--good-bg)' }}>
                {equipments.length} EPIs cadastrados
              </span>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                <TrendingUp size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> Saldo atualizado
              </span>
            </div>
          </section>
        </div>

        {/* Card Entradas no Mês */}
        <div style={{ gridColumn: 'span 3' }}>
          <section style={{ background: 'var(--plane)', border: 'var(--bw) solid var(--stroke)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--good)' }} />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <b style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Entradas em {currentMonthName}</b>
                <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--good-bg)', color: 'var(--good)', fontSize: '10.5px', fontWeight: 700 }}>
                  COMPRAS
                </span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--good)', fontVariantNumeric: 'tabular-nums' }}>
                {formattedEntriesVal}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--stroke)' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Peças recebidas:</span>
              <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>+{monthEntriesQty} un.</strong>
            </div>
          </section>
        </div>

        {/* Card Saídas no Mês */}
        <div style={{ gridColumn: 'span 3' }}>
          <section style={{ background: 'var(--plane)', border: 'var(--bw) solid var(--stroke)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--bad)' }} />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <b style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Saídas em {currentMonthName}</b>
                <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--bad-bg)', color: 'var(--bad)', fontSize: '10.5px', fontWeight: 700 }}>
                  ENTREGAS
                </span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--bad)', fontVariantNumeric: 'tabular-nums' }}>
                {formattedExitsVal}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--stroke)' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Peças entregues:</span>
              <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>-{monthExitsQty} un.</strong>
            </div>
          </section>
        </div>

        <div style={{ gridColumn: 'span 4' }}>
          <section style={{ background: 'var(--plane)', border: 'var(--bw) solid var(--stroke)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '20px 22px', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
              <div>
                <b style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>Saúde do Estoque</b>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>itens no nível ideal</div>
              </div>
            </div>
            <GaugeChart 
              percent={stockHealthPercent} 
              label={`${healthyStockCount} de ${equipments.length} itens`}
              detail={`${equipments.length - healthyStockCount} EPIs precisam de reposição`} 
            />
          </section>
        </div>

        <div style={{ gridColumn: 'span 4' }}>
          <section style={{ background: 'var(--plane)', border: 'var(--bw) solid var(--stroke)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '20px 22px', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
              <div>
                <b style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>Entregas Diárias</b>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>volume de saídas</div>
              </div>
            </div>
            <LineChart data={lineData} labels={lineLabels} />
          </section>
        </div>

        <div style={{ gridColumn: 'span 4' }}>
          <section style={{ background: 'var(--plane)', border: 'var(--bw) solid var(--stroke)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '20px 22px', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
              <div>
                <b style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>Setores por Consumo</b>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>entregas ativas por depto.</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              {topDepts.map((dept, idx) => {
                const max = topDepts[0]?.value || 1;
                const percentage = Math.max(5, (dept.value / max) * 100);
                return (
                  <div key={dept.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '9px', color: 'var(--ink-2)' }}>
                        <b style={{ width: '19px', height: '19px', borderRadius: 'var(--radius)', background: 'var(--plane-2)', border: 'var(--bw) solid var(--stroke)', display: 'grid', placeItems: 'center', fontSize: '10.5px', color: 'var(--ink-2)' }}>
                          {idx + 1}
                        </b>
                        {dept.name}
                      </span>
                      <b style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{dept.value} entregas</b>
                    </div>
                    <div style={{ height: '8px', borderRadius: 'var(--radius)', background: 'var(--track)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percentage}%`, background: 'var(--acc)', borderRadius: 'var(--radius)' }}></div>
                    </div>
                  </div>
                )
              })}
              {topDepts.length === 0 && <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Nenhum dado disponível.</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '18px', paddingTop: '14px', borderTop: '2px solid var(--stroke)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-2)' }}>Total Ativo</span>
              <b style={{ fontSize: '21px', letterSpacing: '-.6px', color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{totalActiveAssignments}</b>
            </div>
          </section>
        </div>

        <div style={{ gridColumn: 'span 12' }}>
          <section style={{ background: 'var(--plane)', border: 'var(--bw) solid var(--stroke)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '20px 22px', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
              <div>
                <b style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>Alertas de Vencimento</b>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>próximos 30 dias</div>
              </div>
            </div>
            
            {expiring.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                Nenhum EPI vencendo nos próximos 30 dias.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '350px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--plane)', zIndex: 1 }}>
                    <tr>
                      <th style={{ textAlign: 'left', fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', padding: '10px 8px 10px 0', borderBottom: 'var(--bw) solid var(--stroke)' }}>Colaborador</th>
                      <th style={{ textAlign: 'left', fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', padding: '10px 8px 10px 0', borderBottom: 'var(--bw) solid var(--stroke)' }}>EPI</th>
                      <th style={{ textAlign: 'left', fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', padding: '10px 8px 10px 0', borderBottom: 'var(--bw) solid var(--stroke)' }}>Entrega</th>
                      <th style={{ textAlign: 'right', fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', padding: '10px 8px 10px 0', borderBottom: 'var(--bw) solid var(--stroke)' }}>Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiring.map(a => {
                      const isExpired = a.expirationDate < today
                      return (
                        <tr key={a.id}>
                          <td style={{ padding: '11px 8px 11px 0', borderBottom: 'var(--bw) solid var(--stroke)', fontSize: '13.5px', color: 'var(--ink)' }}>{a.employee.name}</td>
                          <td style={{ padding: '11px 8px 11px 0', borderBottom: 'var(--bw) solid var(--stroke)', fontSize: '13.5px', color: 'var(--ink-2)' }}>{a.equipment.description}</td>
                          <td style={{ padding: '11px 8px 11px 0', borderBottom: 'var(--bw) solid var(--stroke)', fontSize: '13px', color: 'var(--muted)' }}>{a.assignedDate.toLocaleDateString('pt-BR')}</td>
                          <td style={{ padding: '11px 8px 11px 0', borderBottom: 'var(--bw) solid var(--stroke)', fontSize: '13.5px', color: 'var(--ink)', textAlign: 'right' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius)', color: isExpired ? 'var(--bad)' : 'var(--warn)', background: isExpired ? 'var(--bad-bg)' : 'var(--warn-bg)' }}>
                              {a.expirationDate.toLocaleDateString('pt-BR')}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

      </div>
    </>
  )
}
