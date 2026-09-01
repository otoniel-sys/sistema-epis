import { Bell } from 'lucide-react'

export function Topbar() {
  return (
    <header className="topbar">
      <div style={{ flex: 1 }}></div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button style={{ color: 'var(--text-secondary)' }}>
          <Bell size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            TS
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Técnico Seg.</span>
        </div>
      </div>
    </header>
  )
}
