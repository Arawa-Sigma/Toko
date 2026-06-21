"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function DashboardPage() {
    const [products, setProducts] = useState([])
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadDashboardData() {
            const supabase = createClient()
            
            const { data: prodData } = await supabase.from('products').select('*')
            if (prodData) setProducts(prodData)

            try {
                const { data: ordData, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
                if (ordData) {
                    setOrders(ordData)
                }
            } catch (err) {
                console.log("Orders table not yet created")
            }
            
            setLoading(false)
        }
        loadDashboardData()
    }, [])

    const stokKritis = products.filter(p => Number(p.stock || 0) <= 5).sort((a,b) => Number(a.stock) - Number(b.stock))
    const pesananTertunda = orders.filter(o => o.status === 'Menunggu' || o.status === 'Pending')
    
    const today = new Date().toISOString().split('T')[0]
    const pendapatanHariIni = orders
        .filter(o => o.created_at?.startsWith(today) && o.status !== 'Dibatalkan')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0)

    function formatRupiah(n) {
        if (!n) return "Rp 0"
        return "Rp " + Number(n).toLocaleString('id-ID')
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontWeight: 800, color: 'var(--muted)' }}>Memuat Data Dashboard...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* TOP GRID: Actions & Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        
        {/* Actions Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', overflow: 'hidden', height: '70px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } }}>
                <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--dark)', marginBottom: '2px' }}>Buat Pesanan</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Cari produk & buat pesanan baru</div>
                </div>
                <div style={{ width: '50px', background: 'var(--info)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    <i className="fas fa-shopping-cart"></i>
                </div>
            </div>
            
            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', overflow: 'hidden', height: '70px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer' }}>
                <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--dark)', marginBottom: '2px' }}>Catat Pengeluaran</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Input biaya operasional toko</div>
                </div>
                <div style={{ width: '50px', background: '#0f766e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    <i className="fas fa-credit-card"></i>
                </div>
            </div>
        </div>

        {/* Stat Card 1 */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '4px', background: 'var(--warn)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', marginBottom: '16px' }}>
                <i className="fas fa-exclamation-circle" style={{ fontSize: '0.9rem' }}></i>
                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>Pesanan Tertunda</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark)' }}>{pesananTertunda.length}</div>
            <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '6px', fontWeight: 600 }}>Butuh diproses segera</div>
        </div>

        {/* Stat Card 2 */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '4px', background: '#3b82f6' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', marginBottom: '16px' }}>
                <i className="fas fa-box-open" style={{ fontSize: '0.9rem' }}></i>
                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>Stok Kritis</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark)' }}>{stokKritis.length}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '6px' }}>Barang sisa di bawah 5</div>
        </div>

        {/* Stat Card 3 */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '4px', background: 'var(--primary)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', marginBottom: '16px' }}>
                <i className="fas fa-chart-line" style={{ fontSize: '0.9rem' }}></i>
                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>Pendapatan Hari Ini</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark)' }}>{formatRupiah(pendapatanHariIni)}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '6px', fontWeight: 600 }}>Cek rincian di Keuangan</div>
        </div>

      </div>

      {/* BOTTOM GRID: Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '12px' }}>
        
        {/* Table 1 */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark)', margin: 0 }}>Pesanan Terakhir</h3>
                <div style={{ width: '24px', height: '24px', background: 'var(--info)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '0.7rem' }}>
                    <i className="fas fa-file-invoice"></i>
                </div>
            </div>
            <div style={{ padding: '0 14px' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '8px 0', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    <div style={{ flex: 1 }}>No. Invoice</div>
                    <div style={{ flex: 1 }}>Tanggal</div>
                    <div style={{ flex: 1 }}>Status</div>
                    <div style={{ width: '16px' }}></div>
                </div>
                {[...orders].slice(0, 5).map((o, i) => (
                    <div key={o.id || i} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '10px 0', fontSize: '0.75rem', color: '#475569', alignItems: 'center' }}>
                        <div style={{ flex: 1, color: 'var(--info)', fontWeight: 600, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '10px' }}>
                            {o.id ? o.id.split('-')[0] : `INV-00${i}`}
                        </div>
                        <div style={{ flex: 1 }}>{o.created_at ? new Date(o.created_at).toLocaleDateString('id-ID') : 'Hari ini'}</div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: o.status === 'Dikirim' || o.status === 'Selesai' ? 'var(--primary)' : 'var(--warn)' }}></span>
                            {o.status || 'Menunggu'}
                        </div>
                        <div style={{ width: '16px', cursor: 'pointer', color: '#94a3b8', fontSize: '0.7rem' }}><i className="fas fa-ellipsis-v"></i></div>
                    </div>
                ))}
                {orders.length === 0 && (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>Belum ada pesanan masuk.</div>
                )}
            </div>
        </div>

        {/* Table 2 */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark)', margin: 0 }}>Stok Kritis</h3>
                <div style={{ width: '24px', height: '24px', background: 'var(--warn)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '0.7rem' }}>
                    <i className="fas fa-exclamation-triangle"></i>
                </div>
            </div>
            <div style={{ padding: '0 14px' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '8px 0', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    <div style={{ flex: 2 }}>Nama Produk</div>
                    <div style={{ flex: 1 }}>Sisa</div>
                    <div style={{ flex: 1 }}>Status</div>
                    <div style={{ width: '16px' }}></div>
                </div>
                {stokKritis.slice(0, 5).map((prod, idx) => (
                    <div key={prod.id || idx} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '10px 0', fontSize: '0.75rem', color: '#475569', alignItems: 'center' }}>
                        <div style={{ flex: 2, color: 'var(--info)', fontWeight: 600, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '10px' }}>{prod.name}</div>
                        <div style={{ flex: 1, fontWeight: 800, color: Number(prod.stock) <= 0 ? 'var(--danger)' : 'var(--warn)' }}>{prod.stock}</div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: Number(prod.stock) <= 0 ? 'var(--danger)' : 'var(--warn)' }}></span>
                            {Number(prod.stock) <= 0 ? 'Habis' : 'Menipis'}
                        </div>
                        <div style={{ width: '16px', cursor: 'pointer', color: '#94a3b8', fontSize: '0.7rem' }}><i className="fas fa-ellipsis-v"></i></div>
                    </div>
                ))}
                {stokKritis.length === 0 && (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>Semua stok aman!</div>
                )}
            </div>
        </div>

        {/* Table 3 */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark)', margin: 0 }}>Transaksi Terakhir</h3>
                <div style={{ width: '24px', height: '24px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '0.7rem' }}>
                    <i className="fas fa-money-bill-wave"></i>
                </div>
            </div>
            <div style={{ padding: '0 14px' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '8px 0', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    <div style={{ flex: 1 }}>No. Invoice</div>
                    <div style={{ flex: 1 }}>Tanggal</div>
                    <div style={{ flex: 1 }}>Nominal</div>
                    <div style={{ width: '16px' }}></div>
                </div>
                {[...orders].filter(o => o.status !== 'Dibatalkan').slice(0, 5).map((tx, idx) => (
                    <div key={tx.id || idx} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '10px 0', fontSize: '0.75rem', color: '#475569', alignItems: 'center' }}>
                        <div style={{ flex: 1, color: 'var(--info)', fontWeight: 600, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '10px' }}>
                            {tx.id ? tx.id.split('-')[0] : `INV-00${idx}`}
                        </div>
                        <div style={{ flex: 1 }}>{tx.created_at ? new Date(tx.created_at).toLocaleDateString('id-ID') : 'Hari ini'}</div>
                        <div style={{ flex: 1, fontWeight: 700, color: 'var(--dark)' }}>{formatRupiah(tx.total_amount)}</div>
                        <div style={{ width: '16px', cursor: 'pointer', color: '#94a3b8', fontSize: '0.7rem' }}><i className="fas fa-ellipsis-v"></i></div>
                    </div>
                ))}
                {orders.length === 0 && (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>Belum ada transaksi.</div>
                )}
            </div>
        </div>

      </div>

    </div>
  )
}
