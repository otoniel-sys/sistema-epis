import { createEmployee } from '@/app/actions'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewEmployeePage() {
  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/employees" className="btn-secondary" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1>Novo Colaborador</h1>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <form action={createEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="name">Nome Completo</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div className="form-group">
            <label htmlFor="role">Cargo</label>
            <input type="text" id="role" name="role" required />
          </div>
          <div className="form-group">
            <label htmlFor="department">Setor Organizacional</label>
            <input type="text" id="department" name="department" required />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary">
              <Save size={20} /> Salvar Colaborador
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
