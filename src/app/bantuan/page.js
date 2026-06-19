export default function BantuanPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark)', marginBottom: '10px' }}>Bantuan & FAQ</h1>
      <p style={{ color: 'var(--muted)', fontSize: '1.1rem', marginBottom: '40px' }}>Temukan jawaban untuk pertanyaan yang paling sering diajukan oleh pelanggan SembakoBerkah.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ padding: '24px', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '10px' }}>Bagaimana cara membatalkan pesanan?</h3>
          <p style={{ color: 'var(--dark)', lineHeight: '1.6' }}>Pesanan hanya dapat dibatalkan jika statusnya masih <strong>"Menunggu Pembayaran"</strong> atau <strong>"Diproses"</strong>. Silakan masuk ke menu <em>Profil Saya &gt; Pesanan Saya</em>, lalu klik tombol batalkan pada pesanan yang sesuai.</p>
        </div>

        <div style={{ padding: '24px', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '10px' }}>Apakah barang yang sudah dibeli bisa ditukar?</h3>
          <p style={{ color: 'var(--dark)', lineHeight: '1.6' }}>Ya, penukaran barang dapat dilakukan maksimal 1x24 jam setelah pesanan diterima, dengan syarat barang dalam kondisi utuh dan terdapat video unboxing saat paket dibuka.</p>
        </div>

        <div style={{ padding: '24px', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '10px' }}>Mengapa pembayaran saya gagal?</h3>
          <p style={{ color: 'var(--dark)', lineHeight: '1.6' }}>Pembayaran gagal biasanya disebabkan oleh batas waktu pembayaran yang habis atau gangguan koneksi internet. Silakan coba <em>checkout</em> ulang pesanan Anda dengan metode pembayaran yang lain.</p>
        </div>
      </div>
    </div>
  )
}
