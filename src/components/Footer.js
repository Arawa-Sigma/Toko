"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import packageJson from '../../package.json'

export default function Footer() {
  const pathname = usePathname()
  
  // Sembunyikan footer di halaman auth
  if (pathname === '/auth') return null

  return (
    <footer className="site-footer" style={{ background: '#065f46', borderTop: 'none', padding: '60px 20px 20px 20px', marginTop: '60px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'space-between' }}>
        
        {/* Kolom 1: Brand & Info */}
        <div style={{ flex: '1 1 300px' }}>
          <div style={{fontSize: '1.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', marginBottom: '16px'}}>
            <span style={{color: '#ffffff'}}>Sembako</span><span style={{color: '#6ee7b7'}}>Berkah</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
            SembakoBerkah adalah platform toko kelontong digital yang menyediakan berbagai kebutuhan pokok harian dengan harga bersahabat dan kualitas terjamin.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'all 0.2s' }} onMouseOver={(e) => {e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#065f46'}} onMouseOut={(e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ffffff'}}><i className="fab fa-instagram"></i></a>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'all 0.2s' }} onMouseOver={(e) => {e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#065f46'}} onMouseOut={(e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ffffff'}}><i className="fab fa-whatsapp"></i></a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'all 0.2s' }} onMouseOver={(e) => {e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#065f46'}} onMouseOut={(e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ffffff'}}><i className="fab fa-facebook-f"></i></a>
          </div>
        </div>

        {/* Kolom 2: Tautan Cepat */}
        <div style={{ flex: '1 1 150px' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '20px' }}>Tautan Cepat</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#ffffff'} onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}>Belanja</Link>
            <Link href="/keranjang" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#ffffff'} onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}>Keranjang</Link>
            <Link href="/invoice" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#ffffff'} onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}>Invoice</Link>
            <Link href="/profile" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#ffffff'} onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}>Profil Saya</Link>
          </div>
        </div>

        {/* Kolom 3: Layanan Pelanggan */}
        <div style={{ flex: '1 1 150px' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '20px' }}>Layanan</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Link href="/bantuan" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#ffffff'} onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}>Bantuan & FAQ</Link>
            <Link href="/cara-pesan" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#ffffff'} onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}>Cara Pemesanan</Link>
            <Link href="/pengiriman" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#ffffff'} onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}>Kebijakan Pengiriman</Link>
            <Link href="/syarat-ketentuan" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#ffffff'} onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}>Syarat & Ketentuan</Link>
          </div>
        </div>

        {/* Kolom 4: Pembayaran */}
        <div style={{ flex: '1 1 200px' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '20px' }}>Pembayaran Aman</h4>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ background: '#fff', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px' }}>
              <img src="/midtrans.png" alt="Midtrans" style={{ maxHeight: '100%', maxWidth: '80px', objectFit: 'contain' }} />
            </div>
            <div style={{ background: '#fff', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px' }}>
              <img src="/qris.jpeg" alt="QRIS" style={{ maxHeight: '100%', maxWidth: '80px', objectFit: 'contain' }} />
            </div>
            <div style={{ background: '#fff', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px' }}>
              <img src="/gopay.jpg" alt="GoPay" style={{ maxHeight: '100%', maxWidth: '80px', objectFit: 'contain' }} />
            </div>
            <div style={{ background: '#fff', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px' }}>
              <img src="/seabank.png" alt="SeaBank" style={{ maxHeight: '100%', maxWidth: '80px', objectFit: 'contain' }} />
            </div>
            <div style={{ background: '#fff', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px' }}>
              <img src="/dana.png" alt="DANA" style={{ maxHeight: '100%', maxWidth: '80px', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '60px', paddingTop: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 500 }}>
        <div>&copy; {new Date().getFullYear()} SembakoBerkah. All rights reserved.</div>
        <div style={{ marginTop: '6px', fontSize: '0.75rem', opacity: 0.6 }}>v{packageJson.version}</div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 480px) {
          .site-footer { padding: 30px 14px 14px !important; margin-top: 30px !important; }
          .site-footer h4 { font-size: 0.95rem !important; margin-bottom: 14px !important; }
          .site-footer p, .site-footer a { font-size: 0.85rem !important; }
        }
      `}} />
    </footer>
  )
}
