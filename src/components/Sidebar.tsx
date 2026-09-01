'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Users, ClipboardList } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'EPIs & Estoque', href: '/inventory', icon: Package },
    { name: 'Colaboradores', href: '/employees', icon: Users },
    { name: 'Entregas', href: '/assignments', icon: ClipboardList },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        Dissobel EPIs
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
