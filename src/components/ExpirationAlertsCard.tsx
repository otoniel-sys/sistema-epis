'use client'

import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { ReturnAssignmentModal } from './ReturnAssignmentModal'

export interface ExpiringAssignment {
  id: string
  assignedDate: string
  expirationDate: string
  expirationTimestamp: number
  status: string
  employee: {
    id: string
    name: string
    role: string
    department: string
  }
  equipment: {
    id: string
    description: string
    ca: string | null
    type: string
    currentStock: number
    lifespanMonths: number
  }
}

interface ExpirationAlertsCardProps {
  assignments: ExpiringAssignment[]
}

type PeriodFilter = 'expired' | '30d' | '60d' | '90d' | 'all'

export function ExpirationAlertsCard({ assignments }: ExpirationAlertsCardProps) {
  const [filter, setFilter] = useState<PeriodFilter>('30d')
  const [searchTerm, setSearchTerm] = useState('')

  const now = useMemo(() => new Date(), [])
  const nowTimestamp = now.getTime()

  // Calculate categorized groups
  const { expired, in30Days, in60Days, in90Days, nextUpcoming } = useMemo(() => {
    const expiredArr: ExpiringAssignment[] = []
    const in30Arr: ExpiringAssignment[] = []
    const in60Arr: ExpiringAssignment[] = []
    const in90Arr: ExpiringAssignment[] = []

    const ts30 = nowTimestamp + 30 * 24 * 60 * 60 * 1000
    const ts60 = nowTimestamp + 60 * 24 * 60 * 60 * 1000
    const ts90 = nowTimestamp + 90 * 24 * 60 * 60 * 1000

    assignments.forEach((a) => {
      const isPast = a.expirationTimestamp < nowTimestamp
      if (isPast) {
        expiredArr.push(a)
      } else {
        if (a.expirationTimestamp <= ts30) in30Arr.push(a)
        if (a.expirationTimestamp <= ts60) in60Arr.push(a)
        if (a.expirationTimestamp <= ts90) in90Arr.push(a)
      }
    })

    // Sort by nearest expiration first
    const sortedActive = [...assignments]
      .filter(a => a.expirationTimestamp >= nowTimestamp)
      .sort((a, b) => a.expirationTimestamp - b.expirationTimestamp)

    return {
      expired: expiredArr.sort((a, b) => a.expirationTimestamp - b.expirationTimestamp),
      in30Days: in30Arr.sort((a, b) => a.expirationTimestamp - b.expirationTimestamp),
      in60Days: in60Arr.sort((a, b) => a.expirationTimestamp - b.expirationTimestamp),
      in90Days: in90Arr.sort((a, b) => a.expirationTimestamp - b.expirationTimestamp),
      nextUpcoming: sortedActive[0] || null
    }
  }, [assignments, nowTimestamp])

  // Filter current list based on active tab
  const currentList = useMemo(() => {
    let list: ExpiringAssignment[] = []

    if (filter === 'expired') list = expired
    else if (filter === '30d') list = in30Days
    else if (filter === '60d') list = in60Days
    else if (filter === '90d') list = in90Days
    else list = assignments

    if (!searchTerm.trim()) return list

    const term = searchTerm.toLowerCase()
    return list.filter((a) =>
      a.employee.name.toLowerCase().includes(term) ||
      a.employee.department.toLowerCase().includes(term) ||
      a.equipment.description.toLowerCase().includes(term) ||
      (a.equipment.ca && a.equipment.ca.toLowerCase().includes(term))
    )
  }, [filter, expired, in30Days, in60Days, in90Days, assignments, searchTerm])

  const formatDaysRemaining = (expTimestamp: number) => {
    const diffMs = expTimestamp - nowTimestamp
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      const pastDays = Math.abs(diffDays)
      return {
        text: pastDays === 1 ? 'Vencido ontem' : `Vencido há ${pastDays} dias`,
        urgency: 'expired'
      }
    }
    if (diffDays === 0) {
      return { text: 'Vence hoje!', urgency: 'critical' }
    }
    if (diffDays <= 15) {
      return { text: `Vence em ${diffDays} dias`, urgency: 'critical' }
    }
    if (diffDays <= 30) {
      return { text: `Vence em ${diffDays} dias`, urgency: 'warning' }
    }
    return { text: `Vence em ${diffDays} dias`, urgency: 'normal' }
  }

  return (
    <section
      style={{
        background: 'var(--plane)',
        border: 'var(--bw) solid var(--stroke)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <b style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
              Alertas de Vencimento de EPIs
            </b>
            {expired.length > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'var(--bad-bg)',
                  color: 'var(--bad)',
                  border: '1px solid rgba(251, 113, 133, 0.3)'
                }}
              >
                {expired.length} {expired.length === 1 ? 'EPI Vencido' : 'EPIs Vencidos'}
              </span>
            )}
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
            Acompanhamento preventivo da vida útil de EPIs em posse dos colaboradores
          </p>
        </div>

        {/* Search inside alerts */}
        <div style={{ position: 'relative', width: '220px' }}>
          <input
            type="text"
            placeholder="Filtrar colaborador ou EPI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 28px',
              fontSize: '12px',
              borderRadius: '8px',
              border: '1px solid var(--stroke)',
              background: 'var(--plane-2)',
              color: 'var(--ink)'
            }}
          />
          <Search size={14} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid var(--stroke)', paddingBottom: '10px' }}>
        {expired.length > 0 && (
          <button
            type="button"
            onClick={() => setFilter('expired')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: filter === 'expired' ? 'var(--bad-bg)' : 'transparent',
              color: filter === 'expired' ? 'var(--bad)' : 'var(--muted)',
              border: filter === 'expired' ? '1px solid rgba(251, 113, 133, 0.4)' : '1px solid transparent'
            }}
          >
            <ShieldAlert size={14} /> Vencidos ({expired.length})
          </button>
        )}

        <button
          type="button"
          onClick={() => setFilter('30d')}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: filter === '30d' ? 'var(--warn-bg)' : 'transparent',
            color: filter === '30d' ? 'var(--warn)' : 'var(--muted)',
            border: filter === '30d' ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid transparent'
          }}
        >
          <Clock size={14} /> Próximos 30 dias ({in30Days.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('60d')}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            background: filter === '60d' ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: filter === '60d' ? 'var(--ink)' : 'var(--muted)',
            border: filter === '60d' ? '1px solid var(--stroke)' : '1px solid transparent'
          }}
        >
          Próximos 60 dias ({in60Days.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('90d')}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            background: filter === '90d' ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: filter === '90d' ? 'var(--ink)' : 'var(--muted)',
            border: filter === '90d' ? '1px solid var(--stroke)' : '1px solid transparent'
          }}
        >
          Próximos 90 dias ({in90Days.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('all')}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            background: filter === 'all' ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: filter === 'all' ? 'var(--ink)' : 'var(--muted)',
            border: filter === 'all' ? '1px solid var(--stroke)' : '1px solid transparent'
          }}
        >
          Todos os Ativos ({assignments.length})
        </button>
      </div>

      {/* Main Content Area */}
      {currentList.length === 0 ? (
        <div
          style={{
            padding: '2rem 1.5rem',
            textAlign: 'center',
            background: 'var(--plane-2)',
            borderRadius: '12px',
            border: '1px dashed var(--stroke)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(52, 211, 153, 0.12)',
              color: 'var(--good)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheck size={24} />
          </div>

          <div>
            <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>
              {filter === 'expired'
                ? 'Nenhum EPI vencido no momento!'
                : filter === '30d'
                ? 'Nenhum EPI vencendo nos próximos 30 dias!'
                : filter === '60d'
                ? 'Nenhum EPI vencendo nos próximos 60 dias!'
                : 'Nenhum EPI encontrado para este período.'}
            </strong>

            {nextUpcoming && filter !== 'all' && (
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px', maxWidth: '520px' }}>
                Todos os colaboradores estão com EPIs dentro do prazo regular.
                O próximo vencimento previsto no sistema é em{' '}
                <strong style={{ color: 'var(--ink)' }}>{nextUpcoming.expirationDate}</strong>{' '}
                para <strong style={{ color: 'var(--ink)' }}>{nextUpcoming.employee.name}</strong> ({nextUpcoming.equipment.description}).
              </p>
            )}
          </div>

          {nextUpcoming && filter === '30d' && (
            <button
              type="button"
              onClick={() => setFilter('90d')}
              className="btn-secondary"
              style={{
                marginTop: '6px',
                fontSize: '12px',
                padding: '6px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--acc)'
              }}
            >
              Ver próximos vencimentos (90 dias) <ChevronRight size={14} />
            </button>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '380px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--plane)', zIndex: 2 }}>
              <tr>
                <th style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', padding: '10px 8px', borderBottom: 'var(--bw) solid var(--stroke)' }}>
                  Status / Prazo
                </th>
                <th style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', padding: '10px 8px', borderBottom: 'var(--bw) solid var(--stroke)' }}>
                  Colaborador
                </th>
                <th style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', padding: '10px 8px', borderBottom: 'var(--bw) solid var(--stroke)' }}>
                  EPI / Descrição
                </th>
                <th style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', padding: '10px 8px', borderBottom: 'var(--bw) solid var(--stroke)' }}>
                  Entrega
                </th>
                <th style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', padding: '10px 8px', borderBottom: 'var(--bw) solid var(--stroke)' }}>
                  Data de Vencimento
                </th>
                <th style={{ textAlign: 'right', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', padding: '10px 8px', borderBottom: 'var(--bw) solid var(--stroke)' }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {currentList.map((a) => {
                const countdown = formatDaysRemaining(a.expirationTimestamp)
                const isPast = a.expirationTimestamp < nowTimestamp

                let badgeColor = 'var(--muted)'
                let badgeBg = 'var(--plane-2)'

                if (countdown.urgency === 'expired') {
                  badgeColor = 'var(--bad)'
                  badgeBg = 'var(--bad-bg)'
                } else if (countdown.urgency === 'critical') {
                  badgeColor = 'var(--bad)'
                  badgeBg = 'var(--bad-bg)'
                } else if (countdown.urgency === 'warning') {
                  badgeColor = 'var(--warn)'
                  badgeBg = 'var(--warn-bg)'
                } else {
                  badgeColor = 'var(--acc)'
                  badgeBg = 'rgba(139, 92, 246, 0.12)'
                }

                return (
                  <tr key={a.id} style={{ borderBottom: 'var(--bw) solid var(--stroke)' }}>
                    <td style={{ padding: '10px 8px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          color: badgeColor,
                          background: badgeBg,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {isPast && <AlertTriangle size={12} />}
                        {countdown.text}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', verticalAlign: 'middle' }}>
                      <Link
                        href={`/employees/${a.employee.id}`}
                        style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                      >
                        {a.employee.name}
                      </Link>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                        {a.employee.department} · {a.employee.role}
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--ink-2)' }}>
                        {a.equipment.description}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {a.equipment.ca ? `CA: ${a.equipment.ca}` : a.equipment.type} · Vida útil: {a.equipment.lifespanMonths} meses
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px', verticalAlign: 'middle', fontSize: '12.5px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {a.assignedDate}
                    </td>
                    <td style={{ padding: '10px 8px', verticalAlign: 'middle', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                      {a.expirationDate}
                    </td>
                    <td style={{ padding: '10px 8px', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <ReturnAssignmentModal
                        assignmentId={a.id}
                        employeeName={a.employee.name}
                        equipmentDescription={a.equipment.description}
                        equipmentCa={a.equipment.ca}
                        currentStock={a.equipment.currentStock}
                        assignedDate={a.assignedDate}
                        buttonLabel="Devolver / Trocar"
                        buttonSize="sm"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
