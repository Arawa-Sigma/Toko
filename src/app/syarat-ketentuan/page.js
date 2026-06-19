export default function SyaratKetentuanPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark)', marginBottom: '10px' }}>Syarat & Ketentuan</h1>
      <p style={{ color: 'var(--muted)', fontSize: '1.1rem', marginBottom: '40px' }}>Peraturan dan persetujuan penggunaan layanan SembakoBerkah.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--dark)', lineHeight: '1.8' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '10px' }}>1. Ketentuan Umum</h3>
        <p>
          Dengan menggunakan platform SembakoBerkah, Anda dianggap telah membaca, memahami, dan menyetujui semua syarat dan ketentuan yang berlaku. SembakoBerkah berhak untuk mengubah syarat dan ketentuan sewaktu-waktu tanpa pemberitahuan sebelumnya.
        </p>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '20px' }}>2. Ketersediaan Produk</h3>
        <p>
          Harga dan ketersediaan barang dapat berubah sewaktu-waktu. Jika barang yang Anda pesan kehabisan stok setelah Anda melakukan pembayaran, pihak toko akan menghubungi Anda untuk menawarkan opsi penukaran barang lain atau pengembalian dana penuh (<em>refund</em>).
        </p>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '20px' }}>3. Kebijakan Privasi</h3>
        <p>
          Kami sangat menjaga privasi data pelanggan kami. Informasi pribadi seperti email, alamat pengiriman, dan nomor telepon tidak akan pernah diperjualbelikan kepada pihak ketiga. Kami hanya menggunakannya untuk keperluan pengiriman dan komunikasi layanan SembakoBerkah.
        </p>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '20px' }}>4. Penyelesaian Sengketa</h3>
        <p>
          Segala keluhan dan masalah yang muncul terkait dengan layanan dan kualitas produk akan diselesaikan secara musyawarah mufakat. Silakan hubungi nomor WhatsApp Layanan Pelanggan kami yang tertera di menu Bantuan.
        </p>
      </div>
    </div>
  )
}
