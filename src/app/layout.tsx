import type { Metadata } from 'next'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dissobel - Controle de EPIs',
  description: 'Sistema de gestão de estoque e entrega de EPIs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            <Topbar />
            <div className="page-container">
              {children}
            </div>
          </main>
          <div className="watermark">
            Desenvolvido por <span className="watermark-brand">TI Dissobel</span>
          </div>
        </div>
      </body>
    </html>
  )
}
