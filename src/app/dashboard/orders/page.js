"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function OrdersPage() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('Semua')
    const [searchQuery, setSearchQuery] = useState('')

    const supabase = createClient()

    useEffect(() => {
        fetchOrders()
    }, [])

    async function fetchOrders() {
        setLoading(true)
        // Adding try-catch in case orders table isn't created yet or has schema issues during dev
        try {
            const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
            if (data) setOrders(data)
        } catch (e) {
            console.error("Failed to fetch orders", e)
        }
        setLoading(false)
    }

    const filteredOrders = orders.filter(o => {
        const matchStatus = filterStatus === 'Semua' || o.status === filterStatus
        const searchStr = searchQuery.toLowerCase()
        const matchSearch = o.id?.toLowerCase().includes(searchStr) || o.buyer_name?.toLowerCase().includes(searchStr)
        return matchStatus && matchSearch
    })

    function formatRupiah(n) {
        if (!n) return "Rp 0"
        return "Rp " + Number(n).toLocaleString('id-ID')
    }

    async function updateOrderStatus(id, newStatus) {
        await supabase.from('orders').update({ status: newStatus }).eq('id', id)
        fetchOrders()
    }

    function getStatusBadge(status) {
        switch(status) {
            case 'Selesai':
            case 'Dikirim':
                return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', fontSize: '0.7rem', fontWeight: 700 }}>{status}</span>
            case 'Dibatalkan':
            case 'Pengembalian Barang':
                return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', fontSize: '0.7rem', fontWeight: 700 }}>{status}</span>
            case 'Sedang Dikemas':
                return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', fontSize: '0.7rem', fontWeight: 700 }}>{status}</span>
            default:
                // Belum Bayar
                return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', fontSize: '0.7rem', fontWeight: 700 }}>{status || 'Belum Bayar'}</span>
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
            {/* Controls Row */}
            <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '400px' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                    <input 
                        type="text" 
                        placeholder="Cari No. Invoice / Nama..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#f8fafc' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {['Semua', 'Belum Bayar', 'Sedang Dikemas', 'Dikirim', 'Selesai', 'Dibatalkan', 'Pengembalian Barang'].map(stat => (
                        <button 
                            key={stat}
                            onClick={() => setFilterStatus(stat)}
                            style={{ 
                                padding: '8px 16px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', border: 'none', transition: 'all 0.2s',
                                background: filterStatus === stat ? 'rgba(3,172,14,0.1)' : '#f1f5f9',
                                color: filterStatus === stat ? 'var(--primary)' : '#64748b',
                                boxShadow: filterStatus === stat ? 'inset 0 0 0 1px var(--primary)' : 'none'
                            }}
                        >
                            {stat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Card */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Invoice & Tanggal</th>
                                <th style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Pelanggan</th>
                                <th style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Nominal</th>
                                <th style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '14px 20px', textAlign: 'right', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '10px' }}></i>
                                        <div>Memuat pesanan...</div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                                        <i className="fas fa-file-invoice-dollar" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '16px' }}></i>
                                        <h3 style={{ margin: '0 0 8px', color: '#64748b' }}>Tidak ada pesanan</h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem' }}>Pilih filter lain atau tunggu pesanan baru masuk.</p>
                                    </td>
                                </tr>
                            ) : filteredOrders.map(order => (
                                <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9', ':hover': { background: '#f8fafc' } }}>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>{order.id?.split('-')[0] || 'INV-XXX'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>
                                            {order.created_at ? new Date(order.created_at).toLocaleString('id-ID') : '-'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--dark)', fontSize: '0.9rem' }}>{order.buyer_name || 'Pelanggan Umum'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{order.customer_email || order.customer_phone || '-'}</div>
                                    </td>
                                    <td style={{ padding: '16px 20px', fontWeight: 800, color: 'var(--dark)', fontSize: '0.95rem' }}>
                                        {formatRupiah(order.total_amount)}
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        {getStatusBadge(order.status)}
                                    </td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        <select 
                                            value={order.status || 'Belum Bayar'} 
                                            onChange={e => updateOrderStatus(order.id, e.target.value)}
                                            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.75rem', fontWeight: 700, background: '#f8fafc', color: '#475569', cursor: 'pointer' }}
                                        >
                                            <option value="Belum Bayar">Belum Bayar</option>
                                            <option value="Sedang Dikemas">Sedang Dikemas</option>
                                            <option value="Dikirim">Tandai Dikirim</option>
                                            <option value="Selesai">Tandai Selesai</option>
                                            <option value="Dibatalkan">Batalkan Pesanan</option>
                                            <option value="Pengembalian Barang">Pengembalian Barang</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
