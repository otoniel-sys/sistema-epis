import prisma from '@/lib/prisma'
import { TrendingUp } from 'lucide-react'
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

  // 3. Top Departamentos (Bar List)
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

  return (
    <>
      <div className="topo">
        <div className="marca">
          <h1>Dashboard de EPIs</h1>
          <p>Visão geral do estoque e entregas · Tempo Real</p>
        </div>
        <span className="periodo">Últimos 30 dias</span>
      </div>

      <div className="grade">
        <div style={{ gridColumn: 'span 12' }}>
          <section style={{ background: 'var(--plane)', border: 'var(--bw) solid var(--stroke)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
              <div><b style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>Valor Total em Estoque</b></div>
            </div>
            
            <div style={{ fontSize: '46px', fontWeight: 800, letterSpacing: '-1.8px', lineHeight: 1, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
              {formattedTotal}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, padding: '5px 10px', borderRadius: 'var(--radius)', color: 'var(--good)', background: 'var(--good-bg)' }}>
                {equipments.length} EPIs cadastrados
              </span>
              <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                <TrendingUp size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> Atualizado agora
              </span>
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
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', padding: '0 8px 10px 0', borderBottom: 'var(--bw) solid var(--stroke)' }}>Colaborador</th>
                      <th style={{ textAlign: 'left', fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', padding: '0 8px 10px 0', borderBottom: 'var(--bw) solid var(--stroke)' }}>EPI</th>
                      <th style={{ textAlign: 'left', fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', padding: '0 8px 10px 0', borderBottom: 'var(--bw) solid var(--stroke)' }}>Entrega</th>
                      <th style={{ textAlign: 'right', fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', padding: '0 8px 10px 0', borderBottom: 'var(--bw) solid var(--stroke)' }}>Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiring.slice(0, 5).map(a => {
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
