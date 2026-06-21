"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { createClient } from '@/lib/supabaseClient'

export default function DashboardLayout({ children }) {
    const pathname = usePathname()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [unreadNotifs, setUnreadNotifs] = useState(0)
    const { session } = useStore()

    useEffect(() => {
        async function fetchUnread() {
            const supabase = createClient()
            try {
                const { count } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('unread', true)
                
                if (count !== null) setUnreadNotifs(count)
            } catch (e) {
                console.error("Belum ada tabel notifications")
            }
        }
        fetchUnread()
    }, [pathname]) // Refresh count when navigation changes

    const menuOverview = [
        { name: 'Dashboard', icon: 'fa-chart-pie', path: '/dashboard' },
        { name: 'Pesanan', icon: 'fa-shopping-bag', path: '/dashboard/orders' },
        { name: 'Produk', icon: 'fa-box', path: '/dashboard/products' },
        { name: 'Retur', icon: 'fa-undo', path: '/dashboard/returns' },
        { name: 'Keuangan', icon: 'fa-wallet', path: '/dashboard/finance' },
    ]

    const menuKomunikasi = [
        { name: 'Pesan', icon: 'fa-comments', path: '/dashboard/chat' },
        { name: 'Notifikasi', icon: 'fa-bell', path: '/dashboard/notifications' },
    ]

    const menuManajemen = [
        { name: 'Pengguna', icon: 'fa-users', path: '/dashboard/users' },
    ]

    const menuPemasaran = [
        { name: 'Diskon', icon: 'fa-tags', path: '/dashboard/discounts' }
    ]

    const menuItems = [...menuOverview, ...menuManajemen, ...menuPemasaran, ...menuKomunikasi]

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f6', color: '#333' }}>
            {/* SIDEBAR */}
            <aside style={{ 
                width: isSidebarOpen ? '200px' : '0px', 
                background: '#ffffff', 
                borderRight: '1px solid #e2e8f0', 
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0
            }}>
                {/* Logo Area */}
                <div style={{ height: '50px', padding: '0 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', boxSizing: 'border-box' }}>
                    <div style={{ width: '28px', height: '28px', background: 'var(--primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.85rem' }}>
                        <i className="fas fa-store"></i>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>Toko Online</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--dark)' }}>Sembako Berkah</div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav style={{ padding: '12px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', padding: '0 8px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Overview
                    </div>
                    {menuOverview.map((item) => {
                        const isActive = pathname === item.path
                        return (
                            <Link key={item.name} href={item.path} style={{ textDecoration: 'none' }}>
                                <div style={{ 
                                    padding: '8px 12px', 
                                    borderRadius: '6px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px',
                                    color: isActive ? 'var(--primary)' : '#475569',
                                    background: isActive ? '#f0fdf4' : 'transparent',
                                    fontWeight: isActive ? 700 : 500,
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                }}>
                                    <i className={`fas ${item.icon}`} style={{ width: '16px', textAlign: 'center', fontSize: '0.9rem' }}></i>
                                    <span style={{ fontSize: '0.8rem' }}>{item.name}</span>
                                </div>
                            </Link>
                        )
                    })}

                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', padding: '0 8px', marginTop: '16px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Manajemen
                    </div>
                    {menuManajemen.map((item) => {
                        const isActive = pathname === item.path
                        return (
                            <Link key={item.name} href={item.path} style={{ textDecoration: 'none' }}>
                                <div style={{ 
                                    padding: '8px 12px', 
                                    borderRadius: '6px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px',
                                    color: isActive ? 'var(--primary)' : '#475569',
                                    background: isActive ? '#f0fdf4' : 'transparent',
                                    fontWeight: isActive ? 700 : 500,
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                }}>
                                    <i className={`fas ${item.icon}`} style={{ width: '16px', textAlign: 'center', fontSize: '0.9rem' }}></i>
                                    <span style={{ fontSize: '0.8rem' }}>{item.name}</span>
                                </div>
                            </Link>
                        )
                    })}

                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', padding: '0 8px', marginTop: '16px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Pemasaran
                    </div>
                    {menuPemasaran.map((item) => {
                        const isActive = pathname === item.path
                        return (
                            <Link key={item.name} href={item.path} style={{ textDecoration: 'none' }}>
                                <div style={{ 
                                    padding: '8px 12px', 
                                    borderRadius: '6px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px',
                                    color: isActive ? 'var(--primary)' : '#475569',
                                    background: isActive ? '#f0fdf4' : 'transparent',
                                    fontWeight: isActive ? 700 : 500,
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                }}>
                                    <i className={`fas ${item.icon}`} style={{ width: '16px', textAlign: 'center', fontSize: '0.9rem' }}></i>
                                    <span style={{ fontSize: '0.8rem' }}>{item.name}</span>
                                </div>
                            </Link>
                        )
                    })}

                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', padding: '0 8px', marginTop: '16px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Komunikasi
                    </div>
                    {menuKomunikasi.map((item) => {
                        const isActive = pathname === item.path
                        return (
                            <Link key={item.name} href={item.path} style={{ textDecoration: 'none' }}>
                                <div style={{ 
                                    padding: '8px 12px', 
                                    borderRadius: '6px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px',
                                    color: isActive ? 'var(--primary)' : '#475569',
                                    background: isActive ? '#f0fdf4' : 'transparent',
                                    fontWeight: isActive ? 700 : 500,
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                }}>
                                    <i className={`fas ${item.icon}`} style={{ width: '16px', textAlign: 'center', fontSize: '0.9rem' }}></i>
                                    <span style={{ fontSize: '0.8rem' }}>{item.name}</span>
                                </div>
                            </Link>
                        )
                    })}
                    
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', padding: '0 8px', marginTop: '16px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Toko Depan
                    </div>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <div style={{ 
                            padding: '8px 12px', 
                            borderRadius: '6px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px',
                            color: '#475569',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}>
                            <i className="fas fa-home" style={{ width: '16px', textAlign: 'center', fontSize: '0.9rem' }}></i>
                            <span style={{ fontSize: '0.8rem' }}>Lihat Toko</span>
                        </div>
                    </Link>
                </nav>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* TOP NAVBAR */}
                <header style={{ 
                    height: '50px', 
                    background: '#ffffff', 
                    borderBottom: '1px solid #e2e8f0', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                    {/* Left side navbar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                            style={{ background: 'none', border: 'none', fontSize: '1rem', color: '#475569', cursor: 'pointer' }}
                        >
                            <i className="fas fa-bars"></i>
                        </button>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--dark)' }}>
                            {menuItems.find(m => m.path === pathname)?.name || 'Dashboard'}
                        </div>
                    </div>

                    {/* Right side navbar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ position: 'relative' }}>
                            <input type="text" placeholder="Search..." className="input" style={{ width: '180px', padding: '6px 12px 6px 30px', fontSize: '0.8rem', borderRadius: '999px', background: '#f1f5f9', border: 'none', minHeight: '32px' }} />
                            <i className="fas fa-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem' }}></i>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', color: '#64748b', fontSize: '0.9rem', alignItems: 'center' }}>
                            <Link href="/dashboard/chat" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }} title="Pesan Pelanggan">
                                <i className="far fa-comments" style={{ cursor: 'pointer' }}></i>
                            </Link>
                            <Link href="/dashboard/notifications" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }} title="Notifikasi Sistem">
                                <div style={{ position: 'relative', cursor: 'pointer' }}>
                                    <i className="far fa-bell"></i>
                                    {unreadNotifs > 0 && (
                                        <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%', border: '1px solid #fff' }}></span>
                                    )}
                                </div>
                            </Link>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--dark)' }}>
                                    {session?.user?.user_metadata?.username || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Owner Account'}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'capitalize' }}>
                                    {session?.user?.user_metadata?.role || 'Super Admin'}
                                </div>
                            </div>
                            <img 
                                src={session?.user?.user_metadata?.custom_avatar || session?.user?.user_metadata?.avatar_url || "/people.png"} 
                                alt="Profile" 
                                onError={(e) => { e.target.onerror = null; e.target.src = "/people.png"; }}
                                style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #e2e8f0', objectFit: 'cover' }} 
                            />
                        </div>
                    </div>
                </header>

                {/* SCROLLABLE CONTENT */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    {children}
                </div>
            </main>
        </div>
    )
}
