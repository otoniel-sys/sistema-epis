'use client'

import { useState } from 'react'
import { createStockEntry } from '@/app/actions'
import { Save } from 'lucide-react'

interface EquipmentOption {
  id: string
  description: string
  ca: string | null
  type: string
  currentStock: number
  idealStock: number
  unitValue: number
}

interface Props {
  equipments: EquipmentOption[]
  selectedEquipmentId?: string
}

export function StockEntryForm({ equipments, selectedEquipmentId }: Props) {
  const [equipmentId, setEquipmentId] = useState(selectedEquipmentId || '')
  const selectedEquipment = equipments.find(e => e.id === equipmentId)

  const [quantity, setQuantity] = useState<number | ''>(1)
  const [unitValue, setUnitValue] = useState<number | ''>(
    selectedEquipment ? selectedEquipment.unitValue : ''
  )
  const todayStr = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(todayStr)

  const handleEquipmentChange = (id: string) => {
    setEquipmentId(id)
    const eq = equipments.find(e => e.id === id)
    if (eq) {
      setUnitValue(eq.unitValue)
    }
  }

  const numQty = typeof quantity === 'number' ? quantity : 0
  const numVal = typeof unitValue === 'number' ? unitValue : 0
  const totalCost = numQty * numVal
  const projectedStock = (selectedEquipment?.currentStock || 0) + numQty

  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(totalCost)

  return (
    <form action={createStockEntry} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group">
        <label htmlFor="equipmentId">EPI / Uniforme *</label>
        <select
          id="equipmentId"
          name="equipmentId"
          value={equipmentId}
          onChange={(e) => handleEquipmentChange(e.target.value)}
          required
        >
          <option value="">Selecione um EPI para repor estoque...</option>
          {equipments.map(eq => (
            <option key={eq.id} value={eq.id}>
              {eq.description} {eq.ca ? `(CA: ${eq.ca})` : ''} - Estoque Atual: {eq.currentStock}
            </option>
          ))}
        </select>
      </div>

      {selectedEquipment && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          padding: '12px 16px',
          background: 'var(--plane-2)',
          border: '1px solid var(--stroke)',
          borderRadius: 'var(--radius)'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Saldo Atual</span>
            <strong style={{ fontSize: '16px', color: 'var(--ink)' }}>{selectedEquipment.currentStock} un.</strong>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Estoque Ideal</span>
            <strong style={{ fontSize: '16px', color: 'var(--ink)' }}>{selectedEquipment.idealStock} un.</strong>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Novo Saldo Estimado</span>
            <strong style={{ fontSize: '16px', color: 'var(--good)' }}>{projectedStock} un.</strong>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="form-group">
          <label htmlFor="quantity">Quantidade Recebida (Entrada) *</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
            required
            placeholder="Ex: 10"
          />
        </div>

        <div className="form-group">
          <label htmlFor="unitValue">Valor Unitário da Compra (R$) *</label>
          <input
            type="number"
            step="0.01"
            id="unitValue"
            name="unitValue"
            min="0"
            value={unitValue}
            onChange={(e) => setUnitValue(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
            required
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label htmlFor="date">Data da Entrada *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Valor Total da Entrada</label>
          <div style={{
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            borderRadius: 'var(--border-radius)',
            background: 'var(--good-bg)',
            border: '1px solid var(--good)',
            color: 'var(--good)',
            fontWeight: 700,
            fontSize: '16px'
          }}>
            {formattedTotal}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button type="submit" className="btn-primary" disabled={!equipmentId || numQty <= 0}>
          <Save size={18} /> Registrar Entrada no Estoque
        </button>
      </div>
    </form>
  )
}
