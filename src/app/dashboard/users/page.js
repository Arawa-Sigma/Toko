"use client"
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { createDebugClient, logger } from '@/lib/debug'

export default function UsersPage() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [editingUser, setEditingUser] = useState(null)
    const [editForm, setEditForm] = useState({ name: '', email: '', role: 'Customer' })
    
    // 🔧 1. Wrap Supabase client dengan Debug Client 
    // Menggunakan useMemo agar client tidak terbuat ulang setiap kali komponen render
    const supabase = useMemo(() => {
        const baseClient = createClient()
        return createDebugClient(baseClient, { module: 'dashboard/users/page' })
    }, [])

    useEffect(() => {
        // 🔧 2. Contoh pencatatan Info saat komponen dimuat
        logger.info("Halaman Manajemen Pengguna dimuat", { module: 'dashboard/users/page' })
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
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    async function handleDelete(userId) {
        if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini beserta datanya? Tindakan ini tidak dapat dibatalkan.")) return
        
        try {
            // Coba panggil RPC khusus untuk menghapus user dari auth.users
            const { error: rpcError } = await supabase.rpc('delete_user_admin', { target_user_id: userId })
            
            if (rpcError) {
                console.warn("RPC delete_user_admin tidak ditemukan atau gagal:", rpcError)
                
                // Fallback: coba hapus profil. Menggunakan .select() untuk mengecek apakah RLS mencegah penghapusan
                const { data, error } = await supabase.from('profiles').delete().eq('id', userId).select()
                
                if (error) throw error
                if (!data || data.length === 0) {
                    alert("Kegagalan berlapis:\n1. RPC Error: " + rpcError.message + "\n2. RLS memblokir hapus profil biasa.")
                    return // Batal menghapus dari tampilan
                }
            }
            
            setUsers(prev => prev.filter(u => u.id !== userId))
            alert("Pengguna berhasil dihapus.")
            logger.success(`Berhasil menghapus pengguna dengan ID: ${userId}`, { module: 'dashboard/users/page', fn: 'handleDelete' })
        } catch (e) {
            console.error("Delete error:", e)
            logger.error("Gagal menghapus pengguna", { module: 'dashboard/users/page', fn: 'handleDelete', data: e })
            alert("Gagal menghapus pengguna. " + (e.message || ''))
        }
    }

    function openEditModal(user) {
        setEditingUser(user)
        setEditForm({ name: user.name || '', email: user.email || '', role: user.role || 'Customer' })
    }

    async function saveEdit() {
        if (!editingUser) return
        try {
            // Update name dan role di profiles (email tidak bisa diubah langsung dari public.profiles)
            const { error } = await supabase.from('profiles').update({ 
                name: editForm.name, 
                role: editForm.role
            }).eq('id', editingUser.id)

            if (error) throw error

            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, name: editForm.name, email: editForm.email, role: editForm.role } : u))
            setEditingUser(null)
            alert("Data pengguna berhasil diperbarui.")
        } catch (e) {
            console.error(e)
            alert("Gagal memperbarui data pengguna.")
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

    const filteredUsers = users.filter(u => {
        const query = searchQuery.toLowerCase()
        return (u.id && u.id.toLowerCase().includes(query)) ||
               (u.name && u.name.toLowerCase().includes(query)) ||
               (u.email && u.email.toLowerCase().includes(query))
    })

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark)', margin: '0 0 8px' }}>Manajemen Pengguna</h1>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Kelola akun pelanggan dan hak akses secara manual.</p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ position: 'relative', flex: '1 1 250px', maxWidth: '100%' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                    <input 
                        type="text" 
                        placeholder="Cari ID, Email, atau Nama..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Total Pengguna: {filteredUsers.length}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                    <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', marginBottom: '16px' }}></i>
                    <div>Memuat data...</div>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflowX: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
                    <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pengguna</th>
                                <th style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kontak</th>
                                <th style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bergabung</th>
                                <th style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Terakhir Aktif</th>
                                <th style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</th>
                                <th style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                                        <i className="fas fa-users" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '16px' }}></i>
                                        <h3 style={{ margin: '0 0 8px', color: '#64748b' }}>Tidak ada pengguna</h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem' }}>Data pengguna tidak ditemukan.</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user, idx) => (
                                <tr key={user.id} style={{ borderBottom: idx === filteredUsers.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s', ':hover': { background: '#f8fafc' } }}>
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
                                                <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>{user.name || 'Anonim'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>ID: {user.id.substring(0,8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: '#475569' }}>
                                        {user.email || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Tidak tersedia</span>}
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: '#475569' }}>
                                        {formatDate(user.created_at)}
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>
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
                                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button onClick={() => openEditModal(user)} title="Edit Pengguna" style={{ background: '#f0fdf4', color: '#16a34a', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button onClick={() => handleDelete(user.id)} title="Hapus Pengguna" style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {editingUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
                        <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem' }}>Edit Pengguna</h2>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#475569' }}>Nama</label>
                            <input 
                                type="text" 
                                value={editForm.name} 
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#475569' }}>Email</label>
                            <input 
                                type="email" 
                                value={editForm.email} 
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#475569' }}>Role</label>
                            <select 
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                            >
                                <option value="Customer">Customer</option>
                                <option value="Owner">Owner</option>
                                <option value="Logistik">Logistik / Staff Gudang</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditingUser(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Batal</button>
                            <button onClick={saveEdit} style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Simpan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
