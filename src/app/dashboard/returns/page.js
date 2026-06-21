"use client"
import { useState } from 'react'

export default function ReturnsPage() {
    // Dummy data since returns table might not be in DB yet
    const [returns, setReturns] = useState([
        { id: 'RET-001', customer: 'Budi Santoso', product: 'Beras Ramos 5kg', reason: 'Kemasan sobek saat diterima', status: 'Pengajuan', date: '2026-06-19', img: 'https://via.placeholder.com/50' },
        { id: 'RET-002', customer: 'Siti Aminah', product: 'Minyak Goreng Bimoli 2L', reason: 'Bocor dari bawah', status: 'Dikonfirmasi', date: '2026-06-18', img: 'https://via.placeholder.com/50' }
    ])

    const [searchQuery, setSearchQuery] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [selectedReturn, setSelectedReturn] = useState(null)

    const filteredReturns = returns.filter(r => r.id.toLowerCase().includes(searchQuery.toLowerCase()) || r.customer.toLowerCase().includes(searchQuery.toLowerCase()))

    function handleStatusUpdate(id, newStatus) {
        setReturns(returns.map(r => r.id === id ? { ...r, status: newStatus } : r))
        setShowModal(false)
    }

    function getStatusBadge(status) {
        switch(status) {
            case 'Selesai':
                return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', fontSize: '0.7rem', fontWeight: 700 }}>{status}</span>
            case 'Ditolak':
                return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', fontSize: '0.7rem', fontWeight: 700 }}>{status}</span>
            case 'Dikonfirmasi':
            case 'Dikirim Pengganti':
                return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', fontSize: '0.7rem', fontWeight: 700 }}>{status}</span>
            default:
                return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: '#fff7ed', color: '#f97316', border: '1px solid #fed7aa', fontSize: '0.7rem', fontWeight: 700 }}>{status}</span>
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
            {/* Rules / Info Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <i className="fas fa-box-open" style={{ width: '40px', height: '40px', background: 'rgba(3,172,14,0.1)', color: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: '12px' }}></i>
                    <div style={{ fontWeight: 800, color: 'var(--dark)' }}>Retur Terbuka</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>Ada 1 pengajuan baru yang butuh evaluasi segera.</div>
                </div>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <i className="fas fa-truck-loading" style={{ width: '40px', height: '40px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: '12px' }}></i>
                    <div style={{ fontWeight: 800, color: 'var(--dark)' }}>Proses Penggantian</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>Kirimkan barang pengganti jika retur disetujui.</div>
                </div>
            </div>

            {/* Controls Row */}
            <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                    <input 
                        type="text" 
                        placeholder="Cari ID Retur / Nama..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#f8fafc' }}
                    />
                </div>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>ID & Tanggal</th>
                                <th style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Pelanggan</th>
                                <th style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Barang Bermasalah</th>
                                <th style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '14px 20px', textAlign: 'right', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReturns.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', ':hover': { background: '#f8fafc' } }}>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>{r.id}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>{r.date}</div>
                                    </td>
                                    <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--dark)', fontSize: '0.85rem' }}>{r.customer}</td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <img src={r.img} alt={r.product} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                                            <div>
                                                <div style={{ fontWeight: 700, color: 'var(--dark)', fontSize: '0.85rem' }}>{r.product}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>"{r.reason}"</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>{getStatusBadge(r.status)}</td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        <button onClick={() => { setSelectedReturn(r); setShowModal(true); }} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                                            Evaluasi <i className="fas fa-chevron-right" style={{ marginLeft: '4px' }}></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredReturns.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Tidak ada data retur.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Eval Modal */}
            {showModal && selectedReturn && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 24px 50px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Evaluasi Retur {selectedReturn.id}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '4px' }}>Alasan Retur dari Pelanggan:</div>
                                <div style={{ fontWeight: 700, color: 'var(--dark)' }}>"{selectedReturn.reason}"</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Ubah Status:</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <button onClick={() => handleStatusUpdate(selectedReturn.id, 'Dikonfirmasi')} style={{ padding: '10px', borderRadius: '10px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', fontWeight: 700, cursor: 'pointer' }}>Setujui Retur</button>
                                    <button onClick={() => handleStatusUpdate(selectedReturn.id, 'Ditolak')} style={{ padding: '10px', borderRadius: '10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', fontWeight: 700, cursor: 'pointer' }}>Tolak Retur</button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginTop: '10px' }}>
                                    <button onClick={() => handleStatusUpdate(selectedReturn.id, 'Dikirim Pengganti')} style={{ padding: '10px', borderRadius: '10px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', fontWeight: 700, cursor: 'pointer' }}>Barang Pengganti Sedang Dikirim</button>
                                    <button onClick={() => handleStatusUpdate(selectedReturn.id, 'Selesai')} style={{ padding: '10px', borderRadius: '10px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Tandai Selesai</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
