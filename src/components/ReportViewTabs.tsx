'use client'

import { useState } from 'react'
import { Package, ArrowDownToLine, ArrowUpFromLine, Search } from 'lucide-react'
import { DeleteTransactionButton } from './DeleteTransactionButton'

export interface EpiSummaryItem {
  id: string
  description: string
  ca: string | null
  type: string
  currentStock: number
  entriesQty: number
  entriesValue: number
  exitsQty: number
  exitsValue: number
  netQty: number
  netValue: number
}

export interface EntryItem {
  id: string
  date: string
  equipmentDescription: string
  equipmentCa: string | null
  quantity: number
  unitValue: number
  totalValue: number
}

export interface ExitItem {
  id: string
  date: string
  equipmentDescription: string
  equipmentCa: string | null
  employeeName: string
  employeeRole: string
  employeeDept: string
  unitValue: number
  expirationDate: string
  status: string
}

interface Props {
  epiSummaries: EpiSummaryItem[]
  entries: EntryItem[]
  exits: ExitItem[]
  monthName: string
  year: number
}

export function ReportViewTabs({ epiSummaries, entries, exits, monthName, year }: Props) {
  const [activeTab, setActiveTab] = useState<'balance' | 'entries' | 'exits'>('balance')
  const [search, setSearch] = useState('')

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const filteredEpiSummaries = epiSummaries.filter(item => {
    if (!search) return true
    const term = search.toLowerCase()
    return item.description.toLowerCase().includes(term) || (item.ca && item.ca.toLowerCase().includes(term))
  })

  const filteredEntries = entries.filter(item => {
    if (!search) return true
    const term = search.toLowerCase()
    return item.equipmentDescription.toLowerCase().includes(term) || (item.equipmentCa && item.equipmentCa.toLowerCase().includes(term))
  })

  const filteredExits = exits.filter(item => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      item.equipmentDescription.toLowerCase().includes(term) ||
      item.employeeName.toLowerCase().includes(term) ||
      item.employeeDept.toLowerCase().includes(term)
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Tab Nav & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--plane-2)', padding: '4px', borderRadius: 'var(--radius)', border: 'var(--bw) solid var(--stroke)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('balance')}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'balance' ? 'var(--plane)' : 'transparent',
              color: activeTab === 'balance' ? 'var(--ink)' : 'var(--muted)',
              border: activeTab === 'balance' ? '1px solid var(--stroke)' : '1px solid transparent',
              transition: 'all 0.15s'
            }}
          >
            <Package size={16} /> Balanço por EPI ({epiSummaries.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('entries')}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'entries' ? 'var(--good-bg)' : 'transparent',
              color: activeTab === 'entries' ? 'var(--good)' : 'var(--muted)',
              border: activeTab === 'entries' ? '1px solid var(--good)' : '1px solid transparent',
              transition: 'all 0.15s'
            }}
          >
            <ArrowDownToLine size={16} /> Entradas / Compras ({entries.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exits')}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'exits' ? 'var(--bad-bg)' : 'transparent',
              color: activeTab === 'exits' ? 'var(--bad)' : 'var(--muted)',
              border: activeTab === 'exits' ? '1px solid var(--bad)' : '1px solid transparent',
              transition: 'all 0.15s'
            }}
          >
            <ArrowUpFromLine size={16} /> Saídas / Entregas ({exits.length})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Filtrar tabela..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '32px', height: '38px', fontSize: '13px', width: '220px' }}
          />
        </div>
      </div>

      {/* TAB 1: Balanço por EPI */}
      {activeTab === 'balance' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>EPI / Descrição</th>
                  <th>CA</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: 'right' }}>Entradas (Qtd)</th>
                  <th style={{ textAlign: 'right' }}>Entradas (R$)</th>
                  <th style={{ textAlign: 'right' }}>Saídas (Qtd)</th>
                  <th style={{ textAlign: 'right' }}>Saídas (R$)</th>
                  <th style={{ textAlign: 'right' }}>Saldo Líq. (R$)</th>
                  <th style={{ textAlign: 'right' }}>Estoque Atual</th>
                </tr>
              </thead>
              <tbody>
                {filteredEpiSummaries.map((item) => {
                  const hasMovement = item.entriesQty > 0 || item.exitsQty > 0
                  return (
                    <tr
                      key={item.id}
                      style={{
                        background: hasMovement ? 'rgba(139, 92, 246, 0.03)' : undefined
                      }}
                    >
                      <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.description}</td>
                      <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{item.ca || '-'}</td>
                      <td>
                        <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'var(--plane-2)', border: '1px solid var(--stroke)', color: 'var(--ink-2)' }}>
                          {item.type}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: item.entriesQty > 0 ? 'var(--good)' : 'var(--muted)' }}>
                        {item.entriesQty > 0 ? `+${item.entriesQty}` : '0'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: item.entriesValue > 0 ? 'var(--good)' : 'var(--muted)' }}>
                        {formatCurrency(item.entriesValue)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: item.exitsQty > 0 ? 'var(--bad)' : 'var(--muted)' }}>
                        {item.exitsQty > 0 ? `-${item.exitsQty}` : '0'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: item.exitsValue > 0 ? 'var(--bad)' : 'var(--muted)' }}>
                        {formatCurrency(item.exitsValue)}
                      </td>
                      <td style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: item.netValue > 0 ? 'var(--good)' : item.netValue < 0 ? 'var(--bad)' : 'var(--muted)'
                      }}>
                        {item.netValue > 0 ? `+${formatCurrency(item.netValue)}` : formatCurrency(item.netValue)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--ink)' }}>
                        {item.currentStock} un.
                      </td>
                    </tr>
                  )
                })}
                {filteredEpiSummaries.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                      Nenhum EPI encontrado com os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Extrato de Entradas */}
      {activeTab === 'entries' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>EPI / Descrição</th>
                  <th>CA</th>
                  <th style={{ textAlign: 'right' }}>Quantidade</th>
                  <th style={{ textAlign: 'right' }}>Valor Unitário</th>
                  <th style={{ textAlign: 'right' }}>Valor Total</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ fontSize: '13px', color: 'var(--ink)' }}>{entry.date}</td>
                    <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{entry.equipmentDescription}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{entry.equipmentCa || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--good)' }}>
                      +{entry.quantity} un.
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--ink-2)' }}>
                      {formatCurrency(entry.unitValue)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--good)' }}>
                      {formatCurrency(entry.totalValue)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <DeleteTransactionButton id={entry.id} />
                    </td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                      Nenhuma entrada de estoque registrada em {monthName} de {year}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Extrato de Saídas / Entregas */}
      {activeTab === 'exits' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Data da Retirada</th>
                  <th>EPI / Descrição</th>
                  <th>Colaborador</th>
                  <th>Setor / Cargo</th>
                  <th style={{ textAlign: 'right' }}>Qtd</th>
                  <th style={{ textAlign: 'right' }}>Valor do EPI</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredExits.map((exit) => (
                  <tr key={exit.id}>
                    <td style={{ fontSize: '13px', color: 'var(--ink)' }}>{exit.date}</td>
                    <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{exit.equipmentDescription}</td>
                    <td style={{ fontWeight: 500, color: 'var(--ink)' }}>{exit.employeeName}</td>
                    <td style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                      {exit.employeeDept} · {exit.employeeRole}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--bad)' }}>
                      -1 un.
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--bad)' }}>
                      {formatCurrency(exit.unitValue)}
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--ink-2)' }}>{exit.expirationDate}</td>
                    <td>
                      <span className={`badge ${exit.status === 'ACTIVE' ? 'badge-warning' : 'badge-success'}`}>
                        {exit.status === 'ACTIVE' ? 'ATIVO' : 'DEVOLVIDO'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredExits.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                      Nenhuma entrega de EPI realizada em {monthName} de {year}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
