import prisma from '@/lib/prisma'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0;

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || '';

  const employees = await prisma.employee.findMany({
    where: q ? { name: { contains: q } } : undefined,
    orderBy: { name: 'asc' },
    include: {
      assignments: {
        where: { status: 'ACTIVE' }
      }
    }
  })

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', justifyContent: 'space-between' }}>
          <h1>Colaboradores</h1>
          
          <form style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }} method="GET">
            <input type="text" name="q" placeholder="Buscar por nome..." defaultValue={q} style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)' }} />
            <button type="submit" className="btn-secondary" style={{ padding: '0.5rem' }}>
              <Search size={20} />
            </button>
          </form>

          <Link href="/employees/new" className="btn-primary">
            <Plus size={20} /> Novo Colaborador
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Setor</th>
                <th>EPIs Ativos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: 500 }}>{emp.name}</td>
                  <td>{emp.role}</td>
                  <td>{emp.department}</td>
                  <td>
                    <span className="badge badge-success">
                      {emp.assignments.length} EPIs
                    </span>
                  </td>
                  <td>
                    <Link href={`/employees/${emp.id}`} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', display: 'inline-block' }}>
                      Ver Perfil
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
