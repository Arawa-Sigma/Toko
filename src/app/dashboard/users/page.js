"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function UsersPage() {
    const [activeTab, setActiveTab] = useState('users')
    const [users, setUsers] = useState([])
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            // 1. Ambil data semua pengguna menggunakan RPC yang kita buat
            const { data: usersData, error: usersErr } = await supabase.rpc('get_all_users')
            if (usersErr) {
                console.warn("Fungsi get_all_users belum dijalankan di SQL Supabase. Menggunakan data dasar profil...")
                // Fallback jika rpc belum ada
                const fallback = await supabase.from('profiles').select('*')
                if (fallback.data) setUsers(fallback.data)
            } else if (usersData) {
                setUsers(usersData)
            }

            // 2. Ambil data permintaan role
            const { data: reqData, error: reqErr } = await supabase
                .from('role_requests')
                .select('*')
                .order('created_at', { ascending: false })
            if (!reqErr && reqData) {
                setRequests(reqData)
            } else {
                console.warn("Gagal mengambil role_requests (Tabel mungkin belum ada):", reqErr)
            }
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    async function handleApprove(reqId, userId) {
        if (!confirm("Setujui pengguna ini menjadi Owner?")) return
        
        try {
            // Update status
            await supabase.from('role_requests').update({ status: 'Approved' }).eq('id', reqId)
            
            // Perbarui UI
            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Approved' } : r))
            
            // Kita juga bisa mengubah role di tabel profiles jika diperlukan
            await supabase.from('profiles').update({ role: 'Owner' }).eq('id', userId)
            
            alert("Berhasil disetujui! Pengguna akan otomatis menjadi Owner saat mereka login.")
        } catch (e) {
            console.error(e)
            alert("Gagal menyetujui")
        }
    }

    async function handleReject(reqId) {
        if (!confirm("Tolak permintaan ini?")) return
        
        try {
            await supabase.from('role_requests').update({ status: 'Rejected' }).eq('id', reqId)
            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Rejected' } : r))
        } catch (e) {
            console.error(e)
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    function formatTimeAgo(dateStr) {
        if (!dateStr) return '-'
        const diff = Math.floor((new Date() - new Date(dateStr)) / 1000)
        if (diff < 60) return 'Baru saja'
        if (diff < 3600) return `${Math.floor(diff/60)} mnt lalu`
        if (diff < 86400) return `${Math.floor(diff/3600)} jam lalu`
        return formatDate(dateStr)
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark)', margin: '0 0 8px' }}>Manajemen Pengguna</h1>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Kelola akun pelanggan dan permintaan hak akses Owner.</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
                <button 
                    onClick={() => setActiveTab('users')}
                    style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'users' ? '3px solid var(--primary)' : '3px solid transparent', color: activeTab === 'users' ? 'var(--primary)' : '#64748b', fontWeight: activeTab === 'users' ? 700 : 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    <i className="fas fa-users" style={{ marginRight: '8px' }}></i> Daftar Pengguna ({users.length})
                </button>
                <button 
                    onClick={() => setActiveTab('requests')}
                    style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'requests' ? '3px solid #f59e0b' : '3px solid transparent', color: activeTab === 'requests' ? '#f59e0b' : '#64748b', fontWeight: activeTab === 'requests' ? 700 : 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                >
                    <i className="fas fa-key" style={{ marginRight: '8px' }}></i> Permintaan Role
                    {requests.filter(r => r.status === 'Pending').length > 0 && (
                        <span style={{ position: 'absolute', top: '8px', right: '4px', background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '999px' }}>
                            {requests.filter(r => r.status === 'Pending').length}
                        </span>
                    )}
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                    <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', marginBottom: '16px' }}></i>
                    <div>Memuat data...</div>
                </div>
            ) : activeTab === 'users' ? (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '16px 20px', color: '#475569', fontSize: '0.85rem', fontWeight: 700 }}>Pengguna</th>
                                <th style={{ padding: '16px 20px', color: '#475569', fontSize: '0.85rem', fontWeight: 700 }}>Kontak</th>
                                <th style={{ padding: '16px 20px', color: '#475569', fontSize: '0.85rem', fontWeight: 700 }}>Bergabung</th>
                                <th style={{ padding: '16px 20px', color: '#475569', fontSize: '0.85rem', fontWeight: 700 }}>Terakhir Aktif</th>
                                <th style={{ padding: '16px 20px', color: '#475569', fontSize: '0.85rem', fontWeight: 700 }}>Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Tidak ada pengguna ditemukan.</td>
                                </tr>
                            ) : users.map((user, idx) => (
                                <tr key={user.id} style={{ borderBottom: idx === users.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s', ':hover': { background: '#f8fafc' } }}>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 700, flexShrink: 0 }}>
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    (user.name || '?').charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: 'var(--dark)', fontSize: '0.95rem' }}>{user.name || 'Anonim'}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {user.id.substring(0,8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: '#475569' }}>
                                        {user.email || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Tidak tersedia</span>}
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: '#475569' }}>
                                        {formatDate(user.created_at)}
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: '#475569' }}>
                                        {user.last_active ? formatTimeAgo(user.last_active) : <span style={{ color: '#cbd5e1' }}>Belum login</span>}
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{ 
                                            background: user.role === 'Owner' || user.role === 'Super Admin' ? '#fef3c7' : '#f1f5f9', 
                                            color: user.role === 'Owner' || user.role === 'Super Admin' ? '#d97706' : '#64748b', 
                                            padding: '4px 10px', 
                                            borderRadius: '999px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: 700 
                                        }}>
                                            {user.role || 'Pelanggan'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {requests.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                            <i className="fas fa-shield-alt" style={{ fontSize: '3rem', marginBottom: '16px', color: '#e2e8f0' }}></i>
                            <div>Belum ada permintaan akses Owner.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', padding: '24px' }}>
                            {requests.map(req => (
                                <div key={req.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', background: req.status === 'Pending' ? '#fff' : '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                                    {req.status === 'Pending' && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#f59e0b' }}></div>}
                                    {req.status === 'Approved' && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10b981' }}></div>}
                                    {req.status === 'Rejected' && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#ef4444' }}></div>}
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div>
                                            <div style={{ fontWeight: 800, color: 'var(--dark)', fontSize: '1.05rem', marginBottom: '4px' }}>{req.user_name || 'Pengguna'}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Meminta akses Owner</div>
                                        </div>
                                        <div style={{ 
                                            fontSize: '0.7rem', 
                                            fontWeight: 800, 
                                            padding: '4px 8px', 
                                            borderRadius: '6px', 
                                            textTransform: 'uppercase',
                                            background: req.status === 'Pending' ? '#fef3c7' : req.status === 'Approved' ? '#ecfdf5' : '#fef2f2',
                                            color: req.status === 'Pending' ? '#d97706' : req.status === 'Approved' ? '#10b981' : '#ef4444'
                                        }}>
                                            {req.status}
                                        </div>
                                    </div>
                                    
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <i className="far fa-clock"></i> Diajukan {formatTimeAgo(req.created_at)}
                                    </div>

                                    {req.status === 'Pending' && (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                onClick={() => handleApprove(req.id, req.user_id)}
                                                style={{ flex: 1, padding: '10px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                            >
                                                Setujui
                                            </button>
                                            <button 
                                                onClick={() => handleReject(req.id)}
                                                style={{ flex: 1, padding: '10px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                            >
                                                Tolak
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
