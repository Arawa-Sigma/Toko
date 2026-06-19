export default function PengirimanPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark)', marginBottom: '10px' }}>Kebijakan Pengiriman</h1>
      <p style={{ color: 'var(--muted)', fontSize: '1.1rem', marginBottom: '40px' }}>Informasi seputar jasa pengiriman dan estimasi waktu tiba.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--dark)', lineHeight: '1.8' }}>
        <p>
          Kami di SembakoBerkah berkomitmen untuk mengantarkan pesanan belanja sembako Anda dengan cepat dan aman.
        </p>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '20px' }}>Area Pengiriman</h3>
        <p>
          Saat ini kami melayani pengiriman di wilayah kota utama dan sekitarnya. Jika lokasi Anda berada di luar jangkauan kurir internal kami, kami akan menggunakan jasa pengiriman pihak ketiga (seperti GoSend, GrabExpress, atau JNE).
        </p>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '20px' }}>Waktu Operasional</h3>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Pesanan yang masuk sebelum jam 14.00 akan dikirimkan di hari yang sama.</li>
          <li>Pesanan yang masuk setelah jam 14.00 akan dikirimkan pada pagi hari berikutnya.</li>
          <li>Pengiriman libur pada Hari Raya Besar Keagamaan.</li>
        </ul>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '20px' }}>Biaya Pengiriman</h3>
        <p>
          Biaya pengiriman dihitung secara otomatis berdasarkan jarak tempuh dari toko kami ke lokasi Anda. Nikmati **Gratis Ongkir** untuk pembelanjaan di atas Rp 250.000 (maksimal potongan ongkir Rp 15.000).
        </p>
      </div>
    </div>
  )
}
