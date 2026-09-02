'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';

export function InventoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');

  // Debounce para evitar buscar a cada tecla digitada
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      router.push(`?${params.toString()}`);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [q, status, router]);

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '300px', justifyContent: 'flex-end' }}>
      <select 
        value={status} 
        onChange={(e) => setStatus(e.target.value)}
        style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        <option value="">Todos os status</option>
        <option value="zerado">Zerados</option>
        <option value="comprar">Precisam de compra</option>
        <option value="ok">Estoque OK</option>
      </select>
      
      <div style={{ position: 'relative', flex: 1, maxWidth: '250px' }}>
        <input 
          type="text" 
          placeholder="Buscar EPI..." 
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', paddingRight: '2.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
        />
        <Search size={18} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
      </div>
    </div>
  );
}
