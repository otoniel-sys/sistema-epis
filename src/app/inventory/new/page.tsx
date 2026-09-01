import { createEquipment } from '@/app/actions'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewEquipmentPage() {
  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/inventory" className="btn-secondary" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1>Cadastrar Novo EPI</h1>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <form action={createEquipment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="description">Descrição do EPI</label>
              <input type="text" id="description" name="description" required />
            </div>
            <div className="form-group">
              <label htmlFor="ca">CA (Certificado de Aprovação)</label>
              <input type="text" id="ca" name="ca" />
            </div>
          </div>
          
          <div className="grid-3">
            <div className="form-group">
              <label htmlFor="type">Tipo</label>
              <select id="type" name="type" required>
                <option value="EPI">EPI</option>
                <option value="UNIFORME">Uniforme</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="idealStock">Estoque Ideal</label>
              <input type="number" id="idealStock" name="idealStock" min="0" required />
            </div>
            <div className="form-group">
              <label htmlFor="currentStock">Estoque Inicial (Atual)</label>
              <input type="number" id="currentStock" name="currentStock" min="0" required />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="unitValue">Valor Unitário (R$)</label>
              <input type="number" step="0.01" id="unitValue" name="unitValue" min="0" required />
            </div>
            <div className="form-group">
              <label htmlFor="lifespanMonths">Vida Útil (Meses)</label>
              <input type="number" id="lifespanMonths" name="lifespanMonths" min="1" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="replacementCriteria">Critério de Substituição</label>
            <input type="text" id="replacementCriteria" name="replacementCriteria" />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary">
              <Save size={20} /> Cadastrar EPI
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
