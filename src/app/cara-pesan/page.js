export default function CaraPesanPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark)', marginBottom: '10px' }}>Cara Pemesanan</h1>
      <p style={{ color: 'var(--muted)', fontSize: '1.1rem', marginBottom: '40px' }}>Panduan langkah demi langkah berbelanja di SembakoBerkah.</p>

      <ol style={{ paddingLeft: '20px', color: 'var(--dark)', lineHeight: '1.8', fontSize: '1.05rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <li><strong>Pilih Produk:</strong> Telusuri kategori barang atau gunakan fitur pencarian untuk menemukan produk sembako yang Anda butuhkan.</li>
        <li><strong>Masukkan ke Keranjang:</strong> Tentukan jumlah barang yang ingin dibeli, lalu klik tombol <em>Tambah ke Keranjang</em>.</li>
        <li><strong>Checkout Pesanan:</strong> Buka menu keranjang di pojok kanan atas, periksa kembali barang Anda, lalu klik <em>Checkout</em>.</li>
        <li><strong>Isi Alamat:</strong> Pastikan alamat pengiriman Anda sudah benar di halaman pengaturan profil atau form <em>checkout</em>.</li>
        <li><strong>Pembayaran:</strong> Pilih metode pembayaran yang Anda inginkan (QRIS, GoPay, DANA, dll) dan selesaikan pembayaran sesuai instruksi.</li>
        <li><strong>Selesai:</strong> Pesanan Anda akan segera diproses dan dikirimkan oleh kurir SembakoBerkah ke depan pintu rumah Anda!</li>
      </ol>
    </div>
  )
}
