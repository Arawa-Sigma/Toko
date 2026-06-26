"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore, useUIStore } from "@/lib/store"
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import FloatingChat from './FloatingChat'

export default function Navbar() {
  const pathname = usePathname()
  const { landingSearch, setLandingSearch, session, setSession, logout, cart = [] } = useStore()
  const showToast = useUIStore((state) => state.showToast)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const navRightRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRightRef.current && !navRightRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
        setIsNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    
    // Ambil sesi saat komponen dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({data}) => {
          if (data) setUserProfile(data)
        })
      }
    })

    // Dengarkan perubahan status otentikasi (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({data}) => {
          if (data) setUserProfile(data)
        })
      } else {
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [setSession])

  // Validate cart items
  const removeFromCart = useStore(state => state.removeFromCart)
  useEffect(() => {
    const validateCart = async () => {
      if (!cart || cart.length === 0) return
      const supabase = createClient()
      const productIds = cart.map(item => item.productId || item.id).filter(Boolean)
      
      if (productIds.length === 0) {
          // All items are invalid format or missing IDs
          cart.forEach(item => removeFromCart(item.uniqueId || item.productId || item.id))
          return
      }

      try {
        const { data, error } = await supabase.from('products').select('id').in('id', productIds)
        if (data) {
          const validIds = data.map(p => p.id)
          cart.forEach(item => {
            const currentId = item.productId || item.id
            if (!validIds.includes(currentId)) {
              removeFromCart(item.uniqueId || currentId)
            }
          })
        }
      } catch (err) {
        console.error("Error validating cart:", err)
      }
    }
    
    validateCart()
  }, [cart.length, removeFromCart])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    logout()
    showToast("Anda telah berhasil keluar.", "info")
  }

  if (pathname === '/auth') return null

  return (
    <>
      <div className="nav-wrapper">
        <div className="nav" id="fullNav">
        <Link href="/" className="brand" style={{cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', order: 1}}>
          <div className="logo-text" style={{fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', letterSpacing: '-0.5px'}}>
            <span style={{color: 'var(--dark)'}}>Sembako</span><span style={{color: 'var(--primary)'}}>Berkah</span>
          </div>
          <img src="/logo.png" alt="SembakoBerkah Logo" className="logo-img" style={{height: '32px', width: 'auto', objectFit: 'contain'}} />
        </Link>
        <div className="nav-search-wrapper">
            {pathname === '/' && (
                <div className="nav-search-container" style={{ width: '100%' }}>
                    <div style={{position: 'relative', width: '100%'}}>
                        <input 
                          id="globalSearch" 
                          className="search" 
                          placeholder="Cari sembako murah..."
                          value={landingSearch}
                          onChange={(e) => setLandingSearch(e.target.value)}
                          style={{paddingLeft: '44px', margin: 0, height: '44px', width: '100%', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontSize: '0.95rem'}}
                        />
                        <i className="fas fa-search" style={{position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '1rem'}}></i>
                    </div>
                </div>
            )}
        </div>

        <div className="navRight" ref={navRightRef} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          
          {/* Keranjang (Cart) Icon */}
          <Link href="/keranjang" style={{ textDecoration: 'none' }}>
            <button className="iconBtn" style={{ position: 'relative' }}>
              <i className="fas fa-shopping-cart"></i>
              {cart && cart.length > 0 && (
                <div style={{ position: 'absolute', top: '2px', right: '0px', background: 'var(--danger)', color: 'white', fontSize: '0.6rem', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--card)' }}>
                  {cart.reduce((acc, item) => acc + item.qty, 0)}
                </div>
              )}
            </button>
          </Link>

          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 8px' }}></div>

          <div style={{position: 'relative', display: 'flex'}}>
            <button className="iconBtn" onClick={() => { setIsNotifOpen(!isNotifOpen); setIsDropdownOpen(false); }}>
              <i className="fas fa-bell"></i>
            </button>
            {isNotifOpen && (
              <div style={{position: 'absolute', top: 'calc(100% + 14px)', right: '-130px', width: '310px', background: 'var(--card)', borderRadius: '16px', boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)', border: '1px solid var(--border)', zIndex: 100, animation: 'dropdown-slide-down 0.25s cubic-bezier(0.16, 1, 0.3, 1)'}}>
                {/* Tanda Panah */}
                <div style={{position: 'absolute', top: '-6px', right: '144px', width: '12px', height: '12px', background: '#f8fafc', borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)', transform: 'rotate(45deg)', zIndex: 101}}></div>
                
                <div style={{position: 'relative', zIndex: 102, background: 'var(--card)', borderRadius: '16px', overflow: 'hidden'}}>
                  <div style={{padding: '14px 18px', borderBottom: '1px solid var(--border)', background: '#f8fafc', fontWeight: 800, fontSize: '0.85rem', color: 'var(--dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span>NOTIFICATIONS</span>
                    <span style={{background: '#f1f5f9', color: 'var(--muted)', padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700}}>0 New</span>
                  </div>
                  <div style={{padding: '40px 18px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'}}>
                    <div style={{width: '56px', height: '56px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '1.4rem', marginBottom: '4px'}}>
                      <i className="fas fa-bell-slash"></i>
                    </div>
                    <div style={{fontSize: '0.95rem', color: 'var(--dark)', fontWeight: 700}}>No notifications yet</div>
                    <div style={{fontSize: '0.85rem', color: 'var(--muted)'}}>When you get notifications, they'll show up here.</div>
                  </div>
                  <div style={{borderTop: '1px solid var(--border)', background: '#f8fafc'}}>
                    <button onClick={() => setIsNotifOpen(false)} style={{background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', width: '100%', padding: '14px', transition: 'background 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px'}} onMouseOver={(e) => e.target.style.background = '#f1f5f9'} onMouseOut={(e) => e.target.style.background = 'none'}>
                      View All Activity <i className="fas fa-arrow-right" style={{fontSize: '0.75rem'}}></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {session ? (
            <div className="nav-profile-badge" style={{position: 'relative', display: 'flex', alignItems: 'center', marginLeft: '10px'}}>
              <div 
                onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsNotifOpen(false); }}
                style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: '#f1f5f9', borderRadius: '999px', cursor: 'pointer', transition: 'background 0.2s'}}
              >
                {session.user?.user_metadata?.custom_avatar || session.user?.user_metadata?.avatar_url ? (
                  <img 
                    src={session.user.user_metadata.custom_avatar || session.user.user_metadata.avatar_url} 
                    alt="Avatar" 
                    onError={(e) => { e.target.onerror = null; e.target.src = "/people.png"; }}
                    style={{width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover'}} 
                  />
                ) : (
                  <img src="/people.png" alt="Avatar Default" style={{width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover'}} />
                )}
                <span className="nav-profile-name" style={{fontSize: '0.85rem', fontWeight: 600, color: 'var(--dark)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                  {session.user?.user_metadata?.username || session.user?.user_metadata?.full_name || session.user?.email?.split('@')[0] || 'User'}
                </span>
                <i className={`fas fa-chevron-down`} style={{fontSize: '0.7rem', color: 'var(--muted)', marginLeft: '4px', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}}></i>
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div style={{position: 'absolute', top: '120%', right: 0, width: '240px', background: 'var(--card)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border)', overflow: 'hidden', zIndex: 100}}>
                  <div style={{padding: '16px', borderBottom: '1px solid var(--border)', background: '#f8fafc'}}>
                    <div style={{fontWeight: 700, color: 'var(--dark)', fontSize: '0.9rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                      {session.user?.user_metadata?.full_name || session.user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div style={{fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600}}>
                      Role: <span style={{color: (userProfile?.role || session.user?.user_metadata?.role)?.toLowerCase() === 'owner' ? 'var(--primary)' : 'var(--muted)'}}>
                        {(userProfile?.role || session.user?.user_metadata?.role)?.toLowerCase() === 'owner' ? 'Owner' : 'Customer'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{display: 'flex', flexDirection: 'column', padding: '8px 0'}}>
                    {(userProfile?.role || session.user?.user_metadata?.role)?.toLowerCase() === 'owner' && (
                      <Link href="/dashboard" onClick={() => setIsDropdownOpen(false)} style={{padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--dark)', fontSize: '0.85rem', fontWeight: 600}}>
                        <i className="fas fa-store" style={{color: 'var(--primary)', width: '16px', textAlign: 'center'}}></i> Ke Dashboard Toko
                      </Link>
                    )}
                    <Link href="/keranjang" onClick={() => setIsDropdownOpen(false)} style={{padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--dark)', fontSize: '0.85rem', fontWeight: 600}}>
                      <i className="fas fa-shopping-cart" style={{color: 'var(--muted)', width: '16px', textAlign: 'center'}}></i> Ke Keranjang
                    </Link>
                    <Link href="/invoice" onClick={() => setIsDropdownOpen(false)} style={{padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--dark)', fontSize: '0.85rem', fontWeight: 600}}>
                      <i className="fas fa-file-invoice" style={{color: 'var(--muted)', width: '16px', textAlign: 'center'}}></i> Lihat Invoice
                    </Link>
                    <Link href="/profile" onClick={() => setIsDropdownOpen(false)} style={{padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--dark)', fontSize: '0.85rem', fontWeight: 600}}>
                      <i className="fas fa-user-cog" style={{color: 'var(--muted)', width: '16px', textAlign: 'center'}}></i> Pengaturan Profil
                    </Link>
                    <div style={{height: '1px', background: 'var(--border)', margin: '8px 0'}}></div>
                    <button onClick={() => { setIsDropdownOpen(false); handleLogout(); }} style={{padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left'}}>
                      <i className="fas fa-sign-out-alt" style={{width: '16px', textAlign: 'center'}}></i> Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth">
              <button className="btn btnPrimary login-btn">Masuk / Daftar</button>
            </Link>
          )}
        </div>
      </div>
      </div>

      <FloatingChat />

      <style dangerouslySetInnerHTML={{__html: `
        /* Override global styles for responsive navbar */
        .nav {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
        }
        .brand { order: 1; }
        .navRight { order: 4; margin-left: auto; }
        .navMenu { order: 2; flex: 1; }
        .nav-search-wrapper {
          order: 2;
          flex: 1;
          padding: 0 24px;
          display: flex;
          justify-content: center;
        }
        .nav-search-container {
          width: 100%;
          max-width: 600px;
          position: relative;
        }
        .login-btn {
          margin-left: 10px;
          padding: 8px 18px;
          border-radius: 999px;
        }
        .logo-img {
          display: none;
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .logo-text {
            display: none !important;
          }
          .logo-img {
            display: block !important;
          }
          
          .nav {
            padding: 10px 12px;
            gap: 8px;
          }
          .brand { order: 1; flex: 0 0 auto; min-width: 0; padding: 4px; }
          .navRight { order: 2; margin-left: auto; flex: 0 0 auto; gap: 4px; }
          
          .login-btn {
            margin-left: 4px;
            padding: 6px 12px !important;
            font-size: 0.8rem;
          }
          
          /* Move search below top bar */
          .nav-search-wrapper {
            order: 3;
            width: 100%;
            max-width: 100%;
            flex: 0 0 100%;
            padding: 0 4px;
            margin-top: 8px;
          }
          
          /* Move menu below search */
          .navMenu {
            order: 4;
            width: 100%;
            flex: 0 0 100%;
            padding-bottom: 0px;
            margin-top: 4px;
            border-top: none;
            padding-top: 4px;
            justify-content: flex-start;
          }
          
          /* Adjust font sizes and paddings for mobile */
          .iconBtn { width: 32px; height: 32px; }
          .tabBtn { padding: 6px 10px; font-size: 0.8rem; }
          .search { padding: 8px 14px 8px 34px !important; height: 36px !important; }
        }
        
        @media (max-width: 480px) {
          .nav { padding: 8px 10px; gap: 6px; }
          .brand { padding: 2px; }
          .logo-img { height: 28px !important; }
          .navRight { gap: 2px !important; }
          .iconBtn { width: 30px; height: 30px; font-size: 0.85rem; }
          .search { height: 34px !important; font-size: 0.85rem !important; border-radius: 10px !important; }
          .nav-search-container { margin-top: 2px; }
          .tabBtn { padding: 5px 8px; font-size: 0.75rem; }
          .nav-profile-badge { margin-left: 4px !important; }
          .nav-profile-name { max-width: 60px !important; font-size: 0.78rem !important; }
        }
      `}} />
    </>
  )
}
