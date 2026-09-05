'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteStockTransaction } from '@/app/actions'

export function DeleteTransactionButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm('Tem certeza que deseja estornar/excluir esta entrada de estoque? O saldo será revertido automaticamente.')) {
          startTransition(async () => {
            await deleteStockTransaction(id)
          })
        }
      }}
      className="btn-secondary"
      style={{
        padding: '3px 8px',
        color: 'var(--bad)',
        borderColor: 'rgba(251, 113, 133, 0.4)',
        background: 'var(--bad-bg)',
        fontSize: '11px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        borderRadius: 'var(--radius)'
      }}
      title="Estornar entrada"
    >
      <Trash2 size={12} /> {isPending ? 'Estornando...' : 'Estornar'}
    </button>
  )
}
