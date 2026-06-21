"use client"
import Link from 'next/link'

export default function ChatPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 51px)', margin: '-20px' }}>
      {/* CHAT INTERFACE PLACEHOLDER */}
      <div style={{ flex: 1, background: '#fff', display: 'flex', overflow: 'hidden' }}>
        
        {/* Sidebar Kontak */}
        <div style={{ width: '280px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                <input type="text" placeholder="Cari pesan..." className="input" style={{ width: '100%', fontSize: '0.8rem', padding: '8px 12px' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <i className="fas fa-inbox" style={{ fontSize: '2rem', marginBottom: '12px', color: '#cbd5e1' }}></i>
                    <div>Belum ada pesan masuk</div>
                </div>
            </div>
        </div>

        {/* Area Percakapan */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <i className="far fa-comments" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}></i>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '8px' }}>Mulai Percakapan</h3>
                <p style={{ fontSize: '0.8rem', maxWidth: '300px', margin: '0 auto' }}>Pilih pesan di samping kiri untuk mulai membalas chat pelanggan.</p>
            </div>
        </div>
        
      </div>
    </div>
  )
}
