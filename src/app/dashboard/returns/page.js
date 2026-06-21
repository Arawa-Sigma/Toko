"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function ReturnsPage() {
    const [returns, setReturns] = useState([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchReturns()
    }, [])

    async function fetchReturns() {
        setLoading(true)
        try {
            // Kita juga mem-fetch order_id dan order details
            const { data, error } = await supabase
                .from('returns')
                .select('*, orders(*)')
                .order('created_at', { ascending: false })
            
            if (error) throw error
            if (data) setReturns(data)
        } catch (e) {
            console.error("Gagal mengambil data retur", e)
        }
        setLoading(false)
    }

    async function handleApprove(returnId, orderId) {
        if (!confirm("Setujui retur ini? Saldo pelanggan mungkin harus dikembalikan secara manual di luar sistem jika menggunakan transfer.")) return
        
        try {
            // Update returns table
            await supabase.from('returns').update({ status: 'Disetujui' }).eq('id', returnId)
            
            // Update orders table
            await supabase.from('orders').update({ status: 'Dikembalikan (Retur)' }).eq('id', orderId)
            
            setReturns(prev => prev.map(r => r.id === returnId ? { ...r, status: 'Disetujui' } : r))
            alert("Retur disetujui.")
        } catch (e) {
            console.error(e)
            alert("Terjadi kesalahan")
        }
    }

    async function handleReject(returnId, orderId) {
        if (!confirm("Tolak permintaan retur ini?")) return
        
        try {
            // Update returns table
            await supabase.from('returns').update({ status: 'Ditolak' }).eq('id', returnId)
            
            // Update orders table back to 'Selesai'
            await supabase.from('orders').update({ status: 'Selesai' }).eq('id', orderId)
            
            setReturns(prev => prev.map(r => r.id === returnId ? { ...r, status: 'Ditolak' } : r))
            alert("Retur ditolak.")
        } catch (e) {
            console.error(e)
        }
    }

    function formatRupiah(n) {
        if (!n) return "Rp 0"
        return "Rp " + Number(n).toLocaleString('id-ID')
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark)', margin: '0 0 8px' }}>Pengembalian Barang</h1>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Kelola permintaan retur dan keluhan dari pelanggan.</p>
            </div>

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                    <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', marginBottom: '16px' }}></i>
                    <div>Memuat data retur...</div>
                </div>
            ) : returns.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <i className="fas fa-box-open" style={{ fontSize: '3rem', marginBottom: '16px', color: '#e2e8f0' }}></i>
                    <h3 style={{ margin: '0 0 8px', color: '#64748b', fontSize: '1.1rem' }}>Belum ada pengajuan retur</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Semua pesanan berjalan dengan baik dan lancar.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {returns.map((ret, idx) => {
                        const order = ret.orders || {}
                        return (
                            <div key={ret.id || idx} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', position: 'relative' }}>
                                {/* Top Banner indicator */}
                                <div style={{ height: '4px', width: '100%', background: ret.status === 'Pending' ? '#f59e0b' : ret.status === 'Disetujui' ? '#10b981' : '#ef4444' }}></div>
                                
                                <div style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Pelanggan</div>
                                            <div style={{ fontWeight: 800, color: 'var(--dark)', fontSize: '1.1rem' }}>{ret.user_name || 'Anonim'}</div>
                                        </div>
                                        <div style={{ 
                                            fontSize: '0.75rem', 
                                            fontWeight: 800, 
                                            padding: '4px 10px', 
                                            borderRadius: '999px', 
                                            background: ret.status === 'Pending' ? '#fef3c7' : ret.status === 'Disetujui' ? '#ecfdf5' : '#fef2f2',
                                            color: ret.status === 'Pending' ? '#d97706' : ret.status === 'Disetujui' ? '#10b981' : '#ef4444'
                                        }}>
                                            {ret.status}
                                        </div>
                                    </div>

                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '16px' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>Alasan Retur:</div>
                                        <div style={{ color: 'var(--dark)', fontSize: '0.95rem', lineHeight: 1.5, fontStyle: 'italic' }}>"{ret.reason}"</div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#475569', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#94a3b8' }}>ID Pesanan</span>
                                            <span style={{ fontWeight: 600 }}>{ret.order_id?.split('-')[0] || ret.order_id}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#94a3b8' }}>Total Belanja</span>
                                            <span style={{ fontWeight: 600 }}>{formatRupiah(order.total_amount)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#94a3b8' }}>Tanggal Pengajuan</span>
                                            <span style={{ fontWeight: 600 }}>{formatDate(ret.created_at)}</span>
                                        </div>
                                    </div>

                                    {ret.status === 'Pending' && (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                onClick={() => handleApprove(ret.id, ret.order_id)}
                                                style={{ flex: 1, padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                            >
                                                <i className="fas fa-check"></i> Setujui
                                            </button>
                                            <button 
                                                onClick={() => handleReject(ret.id, ret.order_id)}
                                                style={{ flex: 1, padding: '12px', background: '#fff', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                            >
                                                <i className="fas fa-times"></i> Tolak
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
