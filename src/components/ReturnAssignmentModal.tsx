'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { RotateCcw, X, AlertCircle, PackageCheck } from 'lucide-react'
import { returnAssignment } from '@/app/actions'

interface ReturnAssignmentModalProps {
  assignmentId: string
  employeeName: string
  equipmentDescription: string
  equipmentCa?: string | null
  currentStock: number
  assignedDate: string
  buttonLabel?: string
  buttonSize?: 'sm' | 'md'
}

const COMMON_REASONS = [
  'Entrega incorreta / EPI entregue errado',
  'Tamanho ou numeração incorreta',
  'Defeito ou avaria no equipamento',
  'Colaborador desligado / Saída da empresa',
  'Troca de função / Não necessita mais',
  'Outro motivo'
]

export function ReturnAssignmentModal({
  assignmentId,
  employeeName,
  equipmentDescription,
  equipmentCa,
  currentStock,
  assignedDate,
  buttonLabel = 'Devolver',
  buttonSize = 'sm'
}: ReturnAssignmentModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>(COMMON_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleOpen = () => {
    setIsOpen(true)
    setError(null)
    setSelectedPreset(COMMON_REASONS[0])
    setCustomReason('')
    setNotes('')
  }

  const handleClose = () => {
    if (loading) return
    setIsOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const finalReason = selectedPreset === 'Outro motivo'
      ? customReason.trim()
      : selectedPreset

    if (!finalReason) {
      setError('Por favor, informe ou selecione o motivo da devolução.')
      return
    }

    setLoading(true)

    try {
      await returnAssignment(assignmentId, finalReason, notes.trim())
      setIsOpen(false)
    } catch (err: any) {
      setError(err?.message || 'Erro ao registrar devolução.')
      setLoading(false)
    }
  }

  const modalContent = isOpen && mounted ? (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        textAlign: 'left',
        whiteSpace: 'normal',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: '#0e0f1a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'left',
          whiteSpace: 'normal',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.06) 0%, rgba(255, 255, 255, 0) 100%)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(251, 191, 36, 0.15)',
                color: 'var(--accent-warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                flexShrink: 0
              }}
            >
              <RotateCcw size={20} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, textAlign: 'left' }}>
                Devolver Entrega de EPI
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0', textAlign: 'left' }}>
                O item será reincorporado ao estoque da empresa.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            style={{
              color: 'var(--text-secondary)',
              padding: '4px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          {/* Delivery info summary box */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              padding: '0.9rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              fontSize: '0.85rem',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Colaborador:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>{employeeName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>EPI:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>
                {equipmentDescription} {equipmentCa ? `(CA ${equipmentCa})` : ''}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Data da Entrega:</span>
              <span style={{ color: 'var(--text-primary)', textAlign: 'right' }}>{assignedDate}</span>
            </div>
          </div>

          {/* Stock Return Feedback Callout */}
          <div
            style={{
              background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              borderRadius: '10px',
              padding: '0.8rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              color: 'var(--accent-success)',
              fontSize: '0.84rem',
              textAlign: 'left',
              whiteSpace: 'normal',
              boxSizing: 'border-box'
            }}
          >
            <PackageCheck size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left', whiteSpace: 'normal', wordBreak: 'break-word' }}>
              <div style={{ lineHeight: 1.45, textAlign: 'left' }}>
                <strong>Retorno ao Estoque:</strong> Ao confirmar, <strong>+1 unidade</strong> retornará ao estoque deste EPI.
              </div>
              <div style={{ fontSize: '0.78rem', opacity: 0.9, marginTop: '4px', textAlign: 'left' }}>
                Estoque atual: <strong>{currentStock}</strong> ➔ Novo estoque: <strong>{currentStock + 1}</strong>
              </div>
            </div>
          </div>

          {/* Motivo da Devolução */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left' }}>
              Motivo da Devolução <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: '#161726',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                textAlign: 'left'
              }}
              required
            >
              {COMMON_REASONS.map((reason) => (
                <option key={reason} value={reason} style={{ textAlign: 'left' }}>
                  {reason}
                </option>
              ))}
            </select>

            {selectedPreset === 'Outro motivo' && (
              <input
                type="text"
                placeholder="Descreva o motivo específico..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                disabled={loading}
                required
                style={{
                  marginTop: '0.35rem',
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--accent-warning)',
                  backgroundColor: '#161726',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  textAlign: 'left'
                }}
                autoFocus
              />
            )}
          </div>

          {/* Observações adicionais */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'left' }}>
              Observações adicionais (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Item foi devolvido sem uso, entregue tamanho incorreto por engano."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: '#161726',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                textAlign: 'left'
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--accent-danger)',
                borderRadius: '8px',
                color: 'var(--accent-danger)',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textAlign: 'left'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.5rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn-secondary"
              style={{
                padding: '0.55rem 1rem',
                fontSize: '0.875rem',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                padding: '0.55rem 1.15rem',
                fontSize: '0.875rem',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-warning)',
                color: '#000',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              <RotateCcw size={16} className={loading ? 'spin' : ''} />
              {loading ? 'Devolvendo...' : 'Confirmar Devolução'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="btn-secondary"
        style={{
          padding: buttonSize === 'sm' ? '0.25rem 0.6rem' : '0.45rem 0.85rem',
          fontSize: buttonSize === 'sm' ? '0.78rem' : '0.875rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          color: 'var(--accent-warning)',
          borderColor: 'rgba(251, 191, 36, 0.4)',
          background: 'rgba(251, 191, 36, 0.08)',
          borderRadius: '8px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        title="Devolver EPI e retornar unidade ao estoque"
      >
        <RotateCcw size={buttonSize === 'sm' ? 13 : 15} />
        {buttonLabel}
      </button>

      {modalContent && createPortal(modalContent, document.body)}
    </>
  )
}
