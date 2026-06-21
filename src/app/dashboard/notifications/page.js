"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchNotifications()
    }, [])

    async function fetchNotifications() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
            
            if (data) setNotifications(data)
        } catch (e) {
            console.error("Belum ada tabel notifications", e)
        }
        setLoading(false)
    }

    async function markAsRead(id) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n))
        await supabase.from('notifications').update({ unread: false }).eq('id', id)
    }

    async function markAllAsRead() {
        setNotifications(notifications.map(n => ({ ...n, unread: false })))
        await supabase.from('notifications').update({ unread: false }).eq('unread', true)
    }

    async function deleteNotif(id) {
        setNotifications(notifications.filter(n => n.id !== id))
        await supabase.from('notifications').delete().eq('id', id)
    }

    function getIcon(type, unread) {
        let bg = unread ? '#eff6ff' : '#f8fafc';
        let color = unread ? '#3b82f6' : '#94a3b8';
        let icon = "fas fa-bell";

        if (type === 'Order') {
            bg = unread ? 'rgba(3,172,14,0.1)' : '#f8fafc';
            color = unread ? 'var(--primary)' : '#94a3b8';
            icon = "fas fa-shopping-bag";
        } else if (type === 'Inventory') {
            bg = unread ? 'rgba(249,115,22,0.1)' : '#f8fafc';
            color = unread ? '#f97316' : '#94a3b8';
            icon = "fas fa-exclamation-triangle";
        } else if (type === 'Information') {
            icon = "fas fa-info-circle";
        }

        return (
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                <i className={icon}></i>
            </div>
        )
    }

    function formatTime(isoString) {
        if (!isoString) return ''
        const date = new Date(isoString)
        const now = new Date()
        const diffInSeconds = Math.floor((now - date) / 1000)
        
        if (diffInSeconds < 60) return 'Baru saja'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds/60)} menit lalu`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds/3600)} jam lalu`
        if (diffInSeconds < 172800) return 'Kemarin'
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    }

    const unreadCount = notifications.filter(n => n.unread).length

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 95px)', width: '100%' }}>
            
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Kamu memiliki {unreadCount} pesan belum dibaca.</span>
                {unreadCount > 0 && (
                    <button onClick={markAllAsRead} style={{ background: 'transparent', color: 'var(--primary)', border: '1px solid rgba(3,172,14,0.3)', padding: '6px 12px', borderRadius: '999px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <i className="fas fa-check-double"></i> Tandai Semua Dibaca
                    </button>
                )}
            </div>

            {/* Modern Compact List */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflowY: 'auto', flex: 1, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Memuat notifikasi...</div>
                ) : notifications.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '2rem' }}>
                            <i className="fas fa-bell-slash"></i>
                        </div>
                        <h3 style={{ margin: '0 0 8px', color: '#64748b', fontSize: '1.1rem' }}>Semua Bersih!</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Tidak ada notifikasi sistem saat ini.</p>
                    </div>
                ) : (
                    notifications.map((notif, idx) => {
                        const isLast = idx === notifications.length - 1;
                        
                        return (
                            <div key={notif.id} style={{ 
                                display: 'flex', 
                                padding: '16px 20px', 
                                borderBottom: isLast ? 'none' : '1px solid #f1f5f9', 
                                background: notif.unread ? '#fdfdff' : '#fff',
                                alignItems: 'center',
                                gap: '16px',
                                transition: 'background 0.2s'
                            }}>
                                
                                {/* Icon */}
                                <div style={{ flexShrink: 0, position: 'relative' }}>
                                    {getIcon(notif.type, notif.unread)}
                                    {notif.unread && (
                                        <span style={{ position: 'absolute', top: 0, right: 0, width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '50%', border: '2px solid #fff' }}></span>
                                    )}
                                </div>

                                {/* Content */}
                                <div style={{ flex: '1', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: notif.unread ? 800 : 600, fontSize: '0.95rem', color: notif.unread ? 'var(--dark)' : '#475569' }}>
                                            {notif.title}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: '10px' }}>
                                            {formatTime(notif.created_at)}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: notif.unread ? '#475569' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {notif.message}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, paddingLeft: '12px' }}>
                                    {notif.unread && (
                                        <button onClick={() => markAsRead(notif.id)} title="Tandai dibaca" style={{ background: '#f1f5f9', border: 'none', color: '#64748b', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="fas fa-check"></i>
                                        </button>
                                    )}
                                    <button onClick={() => deleteNotif(notif.id)} title="Hapus notifikasi" style={{ background: '#fef2f2', border: 'none', color: '#ef4444', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>

                            </div>
                        )
                    })
                )}
            </div>

        </div>
    )
}
