import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div style={{minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div style={{maxWidth: '800px', width: '100%', background: '#fff', borderRadius: '16px', padding: '40px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', textAlign: 'center'}}>
        <i className="fas fa-store" style={{fontSize: '48px', color: 'var(--primary)', marginBottom: '20px'}}></i>
        <h1 style={{fontSize: '2rem', color: 'var(--dark)', marginBottom: '10px'}}>Dashboard Pemilik Sembako Berkah</h1>
        <p style={{color: 'var(--muted)', fontSize: '1.1rem', marginBottom: '30px', lineHeight: 1.6}}>
          Selamat datang di ruang kontrol utama. Di sini Anda nantinya bisa mengatur Produk, mengelola Promo, melihat Keuangan, Grafik Penjualan, Staff Gudang, dan Audit.
        </p>
        
        <div style={{display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px'}}>
          {['Produk', 'Promo', 'Keuangan', 'Grafik', 'Staff Gudang', 'Audit'].map(tab => (
            <div key={tab} style={{padding: '12px 20px', background: '#f1f5f9', borderRadius: '8px', fontWeight: 600, color: 'var(--dark)', border: '1px solid var(--border)'}}>
              {tab} (Segera Hadir)
            </div>
          ))}
        </div>

        <Link href="/">
          <button className="btn btnPrimary" style={{padding: '12px 24px', borderRadius: '999px', fontSize: '1rem'}}>
            <i className="fas fa-arrow-left" style={{marginRight: '8px'}}></i> Kembali ke Toko Depan
          </button>
        </Link>
      </div>
    </div>
  )
}
