import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { updateEquipment, deleteEquipment } from '@/app/actions'

export default async function EquipmentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const equipment = await prisma.equipment.findUnique({
    where: { id: resolvedParams.id },
    include: {
      _count: {
        select: { assignments: true }
      }
    }
  })

  if (!equipment) notFound()

  const hasHistory = equipment._count.assignments > 0

  // We bind the ID to the server action so it knows which equipment to update
  const updateEquipmentWithId = updateEquipment.bind(null, equipment.id)

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/inventory" className="btn-secondary" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1>Editar EPI: {equipment.description}</h1>
        </div>

        <form action={async () => {
          'use server';
          await deleteEquipment(equipment.id);
        }}>
          <button type="submit" className="btn-secondary" style={{ color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }} disabled={hasHistory} title={hasHistory ? 'EPI possui histórico' : 'Excluir EPI'}>
            <Trash2 size={20} /> Excluir EPI
          </button>
        </form>
      </div>

      {hasHistory && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <strong>Atenção:</strong> Não é possível excluir este EPI porque ele já possui histórico de {equipment._count.assignments} entrega(s) para colaboradores. Caso não use mais este item, altere o estoque ideal e atual para zero.
        </div>
      )}

      <div className="card" style={{ maxWidth: '800px' }}>
        <form action={updateEquipmentWithId} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="description">Descrição do EPI</label>
              <input type="text" id="description" name="description" defaultValue={equipment.description} required />
            </div>
            <div className="form-group">
              <label htmlFor="ca">CA (Certificado de Aprovação)</label>
              <input type="text" id="ca" name="ca" defaultValue={equipment.ca || ''} />
            </div>
          </div>
          
          <div className="grid-3">
            <div className="form-group">
              <label htmlFor="type">Tipo</label>
              <select id="type" name="type" defaultValue={equipment.type} required>
                <option value="EPI">EPI</option>
                <option value="UNIFORME">Uniforme</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="idealStock">Estoque Ideal</label>
              <input type="number" id="idealStock" name="idealStock" min="0" defaultValue={equipment.idealStock} required />
            </div>
            <div className="form-group">
              <label htmlFor="currentStock">Estoque Atual</label>
              <input type="number" id="currentStock" name="currentStock" min="0" defaultValue={equipment.currentStock} required />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="unitValue">Valor Unitário (R$)</label>
              <input type="number" step="0.01" id="unitValue" name="unitValue" min="0" defaultValue={equipment.unitValue} required />
            </div>
            <div className="form-group">
              <label htmlFor="lifespanMonths">Vida Útil (Meses)</label>
              <input type="number" id="lifespanMonths" name="lifespanMonths" min="1" defaultValue={equipment.lifespanMonths} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="replacementCriteria">Critério de Substituição</label>
            <input type="text" id="replacementCriteria" name="replacementCriteria" defaultValue={equipment.replacementCriteria || ''} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary">
              <Save size={20} /> Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
