'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

interface Props {
  currentMonth: number // 1 to 12
  currentYear: number
}

export function MonthPicker({ currentMonth, currentYear }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigateTo = (m: number, y: number) => {
    let newM = m
    let newY = y
    if (newM < 1) {
      newM = 12
      newY -= 1
    } else if (newM > 12) {
      newM = 1
      newY += 1
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', newM.toString())
    params.set('year', newY.toString())
    router.push(`/reports?${params.toString()}`)
  }

  const handleSelectChange = (m: number, y: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', m.toString())
    params.set('year', y.toString())
    router.push(`/reports?${params.toString()}`)
  }

  const today = new Date()
  const todayMonth = today.getMonth() + 1
  const todayYear = today.getFullYear()
  const isCurrentMonth = currentMonth === todayMonth && currentYear === todayYear

  const years = [todayYear - 2, todayYear - 1, todayYear, todayYear + 1]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--plane)',
        border: 'var(--bw) solid var(--stroke)',
        borderRadius: 'var(--radius)',
        padding: '4px'
      }}>
        <button
          type="button"
          onClick={() => navigateTo(currentMonth - 1, currentYear)}
          style={{
            padding: '6px 10px',
            color: 'var(--ink-2)',
            display: 'grid',
            placeItems: 'center',
            borderRadius: 'var(--radius)'
          }}
          title="Mês anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 8px' }}>
          <Calendar size={16} style={{ color: 'var(--acc)' }} />
          <select
            value={currentMonth}
            onChange={(e) => handleSelectChange(parseInt(e.target.value), currentYear)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink)',
              fontWeight: 700,
              fontSize: '14px',
              padding: '4px 2px',
              cursor: 'pointer'
            }}
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={currentYear}
            onChange={(e) => handleSelectChange(currentMonth, parseInt(e.target.value))}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink-2)',
              fontWeight: 600,
              fontSize: '14px',
              padding: '4px 2px',
              cursor: 'pointer'
            }}
          >
            {years.map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => navigateTo(currentMonth + 1, currentYear)}
          style={{
            padding: '6px 10px',
            color: 'var(--ink-2)',
            display: 'grid',
            placeItems: 'center',
            borderRadius: 'var(--radius)'
          }}
          title="Próximo mês"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {!isCurrentMonth && (
        <button
          type="button"
          onClick={() => handleSelectChange(todayMonth, todayYear)}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          Mês Atual
        </button>
      )}
    </div>
  )
}
