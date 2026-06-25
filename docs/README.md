# SembakoBerkah — Dokumentasi Sistem & Flowchart

> Dokumentasi ini dibuat berdasarkan hasil **reverse engineering** source code project SembakoBerkah. Seluruh flowchart sesuai dengan implementasi aktual.

---

## 📋 Deskripsi Singkat Sistem

**SembakoBerkah** adalah aplikasi e-commerce toko sembako online yang dibangun dengan **Next.js (App Router)**, **Supabase** (database + auth + storage + realtime), dan **Zustand** untuk state management.

Sistem memiliki **dua role utama**:
| Role | Akses |
|---|---|
| **User (Pelanggan)** | Etalase, Keranjang, Checkout, Profil, Chat |
| **Owner (Admin)** | Semua akses User + Dashboard Admin penuh |

### Tabel Database Utama (Supabase)

| Tabel | Fungsi |
|---|---|
| `products` | Data produk beserta varian, spesifikasi, diskon |
| `orders` | Data pesanan pelanggan |
| `order_items` | Detail item per pesanan |
| `profiles` | Data profil pengguna |
| `reviews` | Ulasan produk |
| `returns` | Pengajuan pengembalian barang |
| `expenses` | Pengeluaran toko |
| `vouchers` | Kode promo/diskon |
| `chat_messages` | Pesan antara user & admin |
| `notifications` | Notifikasi sistem untuk admin |
| `role_requests` | Permintaan upgrade ke role Owner |
| `site_visits` | Data kunjungan website |

---

## 🗂️ Daftar Flowchart

| No | Nama Flowchart | File | Keterangan |
|---|---|---|---|
| 1 | Sistem Utama | `flowchart-sistem.mmd` | Alur lengkap keseluruhan sistem |
| 2 | Login & Registrasi | `flowchart-login.mmd` | Autentikasi email, Google OAuth |
| 3 | Etalase / Storefront | `flowchart-etalase.mmd` | Halaman utama, filter, quick buy |
| 4 | Detail Produk | `flowchart-produk-detail.mmd` | Halaman produk, varian, ulasan |
| 5 | Keranjang Belanja | `flowchart-keranjang.mmd` | Cart, voucher, checkout |
| 6 | Checkout & Pembayaran | `flowchart-checkout.mmd` | Proses pembuatan pesanan |
| 7 | Profil Pengguna | `flowchart-profil.mmd` | Riwayat pesanan, edit profil, alamat |
| 8 | Dashboard Admin | `flowchart-dashboard.mmd` | Semua fitur halaman admin |
| 9 | Chat Pelanggan | `flowchart-chat.mmd` | FloatingChat user + Admin chat |
| 10 | Retur Barang | `flowchart-retur.mmd` | Pengajuan & persetujuan retur |

---

## Flowchart Mermaid

### 1. Flowchart Sistem Utama

> Menggambarkan alur keseluruhan sistem dari pertama kali buka website hingga semua fitur inti.

```mermaid
flowchart TD
    A([Start]) --> B[Buka Website SembakoBerkah]
    B --> C[Halaman Utama / Etalase]
    C --> D{Sudah Login?}

    D -->|Tidak| E[Tampil Navbar Login / Daftar]
    E --> F[Buka /auth]
    F --> G{Pilih Aksi}
    G -->|Login| H[Form Login Email + Password]
    G -->|Daftar| I[Form Registrasi Nama + Email + Password]
    G -->|Google OAuth| J[Redirect Google OAuth]

    H --> K{Validasi Login}
    K -->|Gagal| L[Tampil Pesan Error]
    L --> H
    K -->|Berhasil| M{Cek Role User}

    I --> N{Validasi Registrasi}
    N -->|Gagal| O[Tampil Error Validasi]
    O --> I
    N -->|Berhasil| P{Email Verifikasi?}
    P -->|Session Langsung| M
    P -->|Perlu Verifikasi Email| Q[Tampil Pesan Periksa Email]
    Q --> F

    J --> R[/auth/callback]
    R --> S[Supabase Auth Callback]
    S --> M

    M -->|Role owner| T[Dashboard Admin /dashboard]
    M -->|Role user atau tidak ada| U[Halaman Utama / Etalase]

    D -->|Ya| U

    U --> V{Pilih Aksi di Etalase}
    V -->|Filter Kategori| W[Filter Produk berdasarkan Kategori]
    V -->|Cari Produk| X[Cari Produk berdasarkan Nama]
    V -->|Klik Produk| Y[Halaman Detail Produk /product/slug]
    V -->|Beli Langsung Quick Buy| Z[Modal Quick Buy]
    V -->|Lihat Keranjang| AA[Halaman Keranjang /keranjang]
    V -->|Profil| BB[Halaman Profil /profile]

    W --> U
    X --> U
    Y --> CC{Aksi di Detail Produk}
    CC -->|Tambah ke Keranjang| AA
    CC -->|Beli Langsung| AA
    CC -->|Toggle Wishlist| U

    Z --> ZZ{Pilih Varian + Qty}
    ZZ -->|Tambah Keranjang| AA
    ZZ -->|Beli Langsung| AA

    AA --> DD{Aksi di Keranjang}
    DD -->|Masukkan Kode Promo| EE{Validasi Voucher}
    EE -->|Valid| FF[Diskon Terpasang]
    EE -->|Tidak Valid| GG[Pesan Error Voucher]
    FF --> DD
    GG --> DD
    DD -->|Pilih Item + Checkout| HH{Session Login?}
    HH -->|Tidak| F
    HH -->|Ya| II[Halaman Checkout /checkout]

    II --> JJ{Isi Nama Penerima + Kurir}
    JJ -->|Klik Bayar Sekarang| KK{Cek Stok}
    KK -->|Stok Tidak Cukup| LL[Error Stok Habis]
    LL --> II
    KK -->|Stok Cukup| MM[Buat Order di Supabase]
    MM --> NN[Simpan Order Items]
    NN --> OO[Kurangi Stok Produk]
    OO --> PP[Buat Notifikasi ke Admin]
    PP --> QQ[Hapus dari Keranjang]
    QQ --> BB

    BB --> RR{Tab Profil}
    RR -->|Pesanan Saya| SS[List Pesanan Pengguna]
    RR -->|Edit Profil| TT[Update Username Nama Telepon dll]
    RR -->|Ganti Password| UU[Update Password Supabase]
    RR -->|Upload Foto| VV[Crop dan Upload Avatar ke Storage]
    RR -->|Tambah Alamat| WW[Form Alamat + Map Picker]
    RR -->|Minta Akses Owner| XX[Kirim Role Request ke Admin]

    SS --> YY{Pesanan Selesai?}
    YY -->|Ya| ZZ2[Ajukan Retur]
    ZZ2 --> AAA[Data Masuk ke Tabel returns]
    AAA --> BBB[Admin Review Retur di Dashboard]

    T --> CCC{Menu Dashboard Admin}
    CCC -->|Dashboard| DDD[Analitik dan Grafik Performa]
    CCC -->|Pesanan| EEE[Kelola Status Pesanan]
    CCC -->|Produk| FFF[CRUD Produk]
    CCC -->|Retur| GGG[Kelola Permintaan Retur]
    CCC -->|Keuangan| HHH[Laporan Keuangan dan Pengeluaran]
    CCC -->|Pengguna| III[Kelola User dan Role Request]
    CCC -->|Diskon| JJJ[Set Diskon Produk dan Voucher]
    CCC -->|Pesan| KKK[Chat Realtime dengan Pelanggan]
    CCC -->|Notifikasi| LLL[Kelola Notifikasi Sistem]

    III --> MMM{Aksi Role Request}
    MMM -->|Approve| NNN[Update Role Profil jadi Owner]
    MMM -->|Reject| OOO[Tolak Permintaan]
```

---

### 2. Flowchart Login & Registrasi

> Mencakup tiga metode autentikasi: Email+Password, Registrasi, dan Google OAuth. Validasi dilakukan di sisi client sebelum dikirim ke Supabase.

```mermaid
flowchart TD
    A([Start]) --> B[Buka /auth]
    B --> C{Pilih Mode}
    C -->|Login| D[Form Login]
    C -->|Daftar| E[Form Registrasi]
    C -->|Google| F[signInWithOAuth Google]

    D --> G[Input Email + Password]
    G --> H{Validasi Client}
    H -->|Email bukan gmail.com| I[Error Gunakan akun Gmail]
    H -->|Password kosong| J[Error Password wajib diisi]
    I --> G
    J --> G
    H -->|Valid| K[supabase.auth.signInWithPassword]
    K --> L{Supabase Response}
    L -->|Error / Salah| M[Toast Error Email atau Password salah]
    M --> D
    L -->|Berhasil| N[Simpan Session ke Zustand Store]
    N --> O{Cek user_metadata.role}
    O -->|role owner| P[Redirect ke /dashboard]
    O -->|role user atau tidak ada| Q[Redirect ke / Etalase]

    E --> R[Input Nama + Email + Password]
    R --> S{Validasi Client-Side}
    S -->|Nama kosong| T[Error Nama wajib diisi]
    S -->|Email bukan gmail.com| U[Error Gunakan gmail.com]
    S -->|Password kurang 8 karakter| V[Error Min 8 karakter]
    S -->|Tanpa huruf kapital| W[Error Harus ada huruf kapital]
    S -->|Tanpa angka| X[Error Harus ada angka]
    S -->|Tanpa simbol| Y[Error Harus ada simbol]
    T --> R
    U --> R
    V --> R
    W --> R
    X --> R
    Y --> R
    S -->|Semua Valid| Z[supabase.auth.signUp dengan full_name metadata]
    Z --> AA{Supabase Response}
    AA -->|Error| AB[Toast Error Pendaftaran Gagal]
    AB --> E
    AA -->|Session langsung ada| AC[Simpan Session Toast Selamat Datang]
    AC --> Q
    AA -->|Perlu Verifikasi Email| AD[Toast Periksa email Anda]
    AD --> AE[Reset Form Kembali ke mode Login]

    F --> AF[supabase.auth.signInWithOAuth provider google]
    AF --> AG{Error OAuth?}
    AG -->|Ya| AH[Toast Error Google Login]
    AH --> B
    AG -->|Tidak| AI[Redirect ke Google Consent Screen]
    AI --> AJ[Google Redirect ke /auth/callback]
    AJ --> AK[Supabase Exchange Code for Session]
    AK --> AL{Session Valid?}
    AL -->|Tidak| AM[Redirect /auth?error=CouldNotAuthenticate]
    AM --> AN[Toast Error Login]
    AN --> B
    AL -->|Ya| AO[Simpan Session]
    AO --> O
```

---

### 3. Flowchart Etalase / Storefront

> Halaman utama `/` dengan fitur filter kategori, pencarian, produk diskon, dan quick buy modal.

```mermaid
flowchart TD
    A([Start]) --> B[Buka / Halaman Etalase]
    B --> C[Fetch Produk dari Supabase]
    C --> D{Loading?}
    D -->|Ya| E[Tampil Komponen Loading]
    D -->|Tidak| F[Tampil Etalase Lengkap]

    F --> G[Hero Carousel Promo Gambar]
    F --> H[Bagian Promo Spesial + Kenapa Kami]
    F --> I[Grid Kategori Produk 12 Kategori]
    F --> J{Ada Produk Diskon Aktif?}
    J -->|Ya| K[Tampil Bagian Sedang Diskon Besar]
    J -->|Tidak| L[Tampil Grid Produk Utama]
    K --> L

    L --> M{Filter Aktif?}
    M -->|Kategori dipilih| N[Filter produk.category sesuai kategori]
    M -->|Search diisi| O[Filter produk.name mengandung query]
    M -->|Keduanya aktif| P[Filter Kategori AND Nama]
    M -->|Tidak ada| Q[Tampil Semua Produk Aktif]
    N --> Q
    O --> Q
    P --> Q

    Q --> R{User Klik Produk}
    R -->|Klik kartu produk| S[Navigasi ke /product/slug]
    R -->|Klik Beli Langsung| T[Buka Modal Quick Buy]
    R -->|Klik Hati Wishlist| U[Toggle Wishlist di Zustand Store]

    T --> V[Tampil Info Produk Nama Harga Stok]
    V --> W{Produk Punya Varian?}
    W -->|Ya| X[Tampil Tombol Varian User Pilih]
    W -->|Tidak| Y[Langsung ke Pengaturan Jumlah]
    X --> Y
    Y --> Z[Atur Jumlah 1 hingga Max Stok]
    Z --> AA{User Aksi}
    AA -->|Tambah Keranjang| AB[addToCart ke Zustand]
    AB --> AC[Toast Sukses Tutup Modal]
    AA -->|Beli Langsung| AD[addToCart + Navigasi ke /keranjang]
    AA -->|Tutup Modal| AE[Tutup Modal Kembali ke Etalase]
```

---

### 4. Flowchart Detail Produk

> Halaman `/product/[slug]` dengan varian, stok, diskon countdown, ulasan, dan produk terkait.

```mermaid
flowchart TD
    A([Start]) --> B[Buka /product/slug]
    B --> C[Fetch Produk berdasarkan Slug dari Supabase]
    C --> D{Produk Ditemukan?}
    D -->|Tidak| E[Toast Error + Redirect ke /]
    D -->|Ya| F[Fetch Reviews Produk dari Supabase]
    F --> G[Fetch Produk Related 5 Acak]
    G --> H[Tampil Halaman Detail Produk]

    H --> J{Produk Punya Varian?}
    J -->|Ya| K[Tampil Tombol Pilih Varian]
    K --> L[User Pilih Varian]
    L --> M[Update Harga dan Stok berdasarkan Varian]
    J -->|Tidak| N[Gunakan Harga dan Stok Utama]
    M --> N

    H --> O{Stok lebih dari 0?}
    O -->|Tidak| P[Tampil Label STOK HABIS Tombol Nonaktif]
    O -->|Ya| Q[Tombol Aktif Masukkan Keranjang + Beli Sekarang]

    Q --> R[User Atur Jumlah 1 hingga Max Stok]
    R --> S{Aksi User}
    S -->|Masukkan Keranjang| T[addToCart ke Zustand Store]
    T --> U[Toast Berhasil Masuk Keranjang]
    S -->|Beli Sekarang| V[addToCart + Redirect ke /keranjang]
    S -->|Toggle Wishlist| W[toggleWishlist di Zustand]

    H --> Y{Pilih Tab}
    Y -->|Detail Produk| Z[Tampil Deskripsi dan Spesifikasi]
    Y -->|Ulasan| AA[Tampil Daftar Ulasan dan Rating]
    AA --> AB[Tampil Distribusi Rating Bintang]

    H --> AD{Ada Diskon Aktif?}
    AD -->|Ya Belum Kadaluarsa| AE[Tampil Badge Diskon + Harga Coret + Hitung Mundur]
    AD -->|Kadaluarsa atau Tidak Ada| AF[Tampil Harga Normal]

    H --> AG[Bagian Produk Terkait 5 Produk Acak]
    AG --> AH[User Klik Produk Terkait]
    AH --> B
```

---

### 5. Flowchart Keranjang Belanja

> Halaman `/keranjang` dengan seleksi item, update qty, penerapan voucher/promo, dan lanjut checkout.

```mermaid
flowchart TD
    A([Start]) --> B[Buka /keranjang]
    B --> C[Fetch Semua Produk dari Supabase]
    C --> D[Enrich Cart Items dengan Data Produk Terbaru]
    D --> E{Cart Kosong?}
    E -->|Ya| F[Tampil Pesan Keranjang Kosong]
    F --> G[Tombol Mulai Belanja ke /]
    E -->|Tidak| H[Tampil Daftar Item Keranjang]

    H --> I{Aksi User}
    I -->|Pilih Semua Checkbox| J[Tandai Semua Item Valid]
    I -->|Pilih Item Tertentu| K[Toggle Checkbox Item]
    I -->|Hapus Item Terpilih| L{Ada Item Terpilih?}
    L -->|Tidak| M[Toast Error Pilih dulu]
    L -->|Ya| N[Konfirmasi Hapus]
    N -->|OK| O[removeFromCart untuk Setiap ID Terpilih]
    O --> H

    I -->|Ubah Qty| P{Delta Qty}
    P -->|Kurang sampai 0| Q[removeFromCart Hapus Item]
    P -->|Tambah melebihi stok| R[Toast Error Qty melebihi stok]
    P -->|Normal| S[updateCartQty di Zustand]

    I -->|Input Kode Promo| T[Klik Gunakan Promo]
    T --> W[Query Supabase vouchers by code]
    W --> X{Voucher Ditemukan?}
    X -->|Tidak| Y[Toast Error Kode tidak valid]
    X -->|Ya| Z{Voucher Masih Aktif?}
    Z -->|Tidak| AA[Toast Error Voucher kadaluarsa]
    Z -->|Aktif| AB{Minimal Belanja Terpenuhi?}
    AB -->|Tidak| AC[Toast Error Belum mencapai min pembelian]
    AB -->|Ya| AD[setAppliedVoucher ke Zustand]
    AD --> AE[Toast Sukses Tampil Info Diskon Voucher]

    I -->|Klik Checkout Item Dipilih| AF{Ada Item Dipilih?}
    AF -->|Tidak| AG[Toast Error Pilih minimal 1 produk]
    AF -->|Ya| AH[setSelectedForCheckout ke Zustand]
    AH --> AI[Navigasi ke /checkout]
```

---

### 6. Flowchart Checkout & Pembayaran

> Halaman `/checkout` dengan validasi stok, pembuatan pesanan ke Supabase, update stok, dan notifikasi admin.

```mermaid
flowchart TD
    A([Start]) --> B[Buka /checkout]
    B --> C{selectedForCheckout Kosong?}
    C -->|Ya| D[Redirect Paksa ke /keranjang]
    C -->|Tidak| E[Fetch Semua Produk dari Supabase]
    E --> F[Enrich Item Checkout dengan Harga Terbaru]

    F --> G[Tampil Halaman Checkout]
    G --> N[Pilih Metode Pengiriman]
    N --> O{Pilihan Kurir}
    O -->|Ambil Sendiri| P[Ongkir = Rp 0]
    O -->|JNE Reguler| Q[Ongkir = Rp 15.000]
    O -->|GoSend Instant| R[Ongkir = Rp 15.000]

    G --> S[Kalkulasi Total Subtotal + Pajak 10persen + Ongkir - Diskon Voucher]
    G --> U[Pilih Metode Pembayaran - Hanya COD Aktif]

    G --> W[Klik Bayar Sekarang]
    W --> X{Session Login Ada?}
    X -->|Tidak| Y[Toast Error Silakan Login]
    X -->|Ya| Z{Nama Penerima Diisi?}
    Z -->|Tidak| AA[Toast Error Nama penerima kosong]
    Z -->|Ya| AB[Cek Stok Setiap Item ke Supabase]
    AB --> AC{Ada Item Stok Habis?}
    AC -->|Ya| AD[Toast Error Daftar Nama Item]
    AC -->|Tidak| AE[INSERT ke Tabel orders Supabase]
    AE --> AF{Insert Berhasil?}
    AF -->|Gagal| AG[Toast Error Buat Pesanan Gagal]
    AF -->|Berhasil| AH[INSERT ke Tabel order_items]
    AH --> AI[UPDATE Stok Setiap Produk]
    AI --> AJ[INSERT Notifikasi Pesanan Baru ke Admin]
    AJ --> AK[Hapus Item Checkout dari Keranjang]
    AK --> AL[Hapus Voucher yang Dipakai]
    AL --> AM[Toast Sukses Pesanan Berhasil Dibuat]
    AM --> AN[Redirect ke /profile]
```

---

### 7. Flowchart Profil Pengguna

> Halaman `/profile` dengan tab: Pesanan, Edit Profil, Upload Foto, Ganti Password, Alamat, dan Minta Akses Owner.

```mermaid
flowchart TD
    A([Start]) --> B[Buka /profile]
    B --> C{Session Ada?}
    C -->|Tidak| D[Tampil Halaman Profil Kosong]
    C -->|Ya| E[Load User Metadata dari Session Zustand]
    E --> F[Fetch Pesanan dari Supabase]
    E --> G[Fetch Role Request Status]
    E --> H[Load Alamat dari user_metadata]

    G --> I{Role Request = Approved?}
    I -->|Ya| J[Auto-Update Role jadi Owner]
    J --> K[Sync ke Tabel profiles]
    K --> L[Refresh Session Zustand]

    B --> P{Pilih Tab}
    P -->|Dashboard Pesanan| Q[Tampil Ringkasan dan List Pesanan]
    Q --> R[Filter Pesanan berdasarkan Status]
    R --> S[Klik Detail Pesanan]
    S --> T[Fetch order_items dari Supabase]
    T --> U[Tampil Modal Detail Pesanan]
    U --> V{Status Pesanan = Selesai?}
    V -->|Ya| W[Tombol Ajukan Retur Aktif]
    W --> Y[Isi Alasan Retur]
    Y --> Z[INSERT ke Tabel returns Supabase]

    P -->|Profil Saya| AC[Form Edit Profil]
    AC --> AE[Klik Simpan Perubahan]
    AE --> AF{Validasi Nomor Telepon}
    AF -->|Tidak Valid| AG[Toast Error Nomor Telepon]
    AF -->|Valid| AH[supabase.auth.updateUser]
    AH --> AI[Sync ke Tabel profiles]
    AI --> AJ[Refresh Session Zustand]

    P -->|Foto Profil| AL[Drag Drop atau Pilih File]
    AL --> AN[Buka Modal Crop]
    AN --> AO[User Crop Gambar]
    AO --> AP[Upload ke Supabase Storage bucket avatars]
    AP --> AS[Dapatkan Public URL]
    AS --> AT[supabase.auth.updateUser dengan custom_avatar]
    AT --> AU[Sync ke profiles.avatar_url]

    P -->|Minta Akses Owner| BI{Sudah Ada Role Request?}
    BI -->|Ya Pending| BJ[Tampil Status Menunggu]
    BI -->|Tidak Ada| BL[Tombol Ajukan Permintaan Aktif]
    BL --> BM[Konfirmasi Dialog]
    BM -->|OK| BN[INSERT ke Tabel role_requests]
    BN --> BJ
```

---

### 8. Flowchart Dashboard Admin

> Halaman `/dashboard` dan semua sub-halaman admin: Pesanan, Produk CRUD, Retur, Keuangan, Pengguna, Diskon, Chat, Notifikasi.

```mermaid
flowchart TD
    A([Start]) --> B[Buka /dashboard]
    B --> C{Session Valid + Role owner?}
    C -->|Tidak| D[Redirect ke /auth]
    C -->|Ya| E[Dashboard Layout dengan Sidebar]

    E --> H{Menu Sidebar}
    H -->|Dashboard| I[Analitik dan Grafik]
    H -->|Pesanan| J[Manajemen Pesanan]
    H -->|Produk| K[CRUD Produk]
    H -->|Retur| L[Pengembalian Barang]
    H -->|Keuangan| M[Laporan Keuangan]
    H -->|Pengguna| N[Manajemen User]
    H -->|Diskon| O[Diskon dan Voucher]
    H -->|Pesan| P[Chat Pelanggan]
    H -->|Notifikasi| Q[Notifikasi Sistem]

    I --> I1[Fetch orders expenses profiles site_visits products]
    I1 --> I2[4 Kartu KPI Total Pemasukan Pesanan Tertunda Stok Kritis]
    I1 --> I7[Grafik Bar Pemasukan vs Pengeluaran per Bulan]
    I1 --> I8[Grafik Line Registrasi Pengguna Baru per Bulan]
    I1 --> I9[Grafik Line Kunjungan Website per Bulan]

    J --> J1[Fetch orders dari Supabase]
    J1 --> J2[Filter Status + Pencarian]
    J2 --> J3{Update Status Pesanan}
    J3 -->|Belum Bayar| J6[Status Menunggu Pembayaran]
    J3 -->|Sedang Dikemas| J7[Status Sedang Dikemas]
    J3 -->|Dikirim| J8[Status Dalam Pengiriman]
    J3 -->|Selesai| J9[Status Pesanan Selesai]
    J3 -->|Dibatalkan| J10[Status Dibatalkan]

    K --> K2[Tampil Tabel Produk]
    K2 --> K3{Aksi Produk}
    K3 -->|Tambah atau Edit| K5[Form Nama Harga HPP Stok Kategori Gambar]
    K5 --> K6[Tambah Varian dan Spesifikasi Opsional]
    K6 --> K8[Upload Gambar ke Supabase Storage]
    K8 --> K9[INSERT atau UPDATE products]
    K3 -->|Hapus| K13[Konfirmasi DELETE products]
    K3 -->|Aktif atau Nonaktif| K15[UPDATE products.status]

    N --> N5[Tampil Daftar Role Request]
    N5 --> N6{Aksi}
    N6 -->|Approve| N7[UPDATE role_requests.status = Approved]
    N7 --> N8[UPDATE profiles.role = Owner]
    N6 -->|Reject| N10[UPDATE role_requests.status = Rejected]

    O --> O2{Tab Aktif}
    O2 -->|Diskon Produk| O4{Aksi Diskon}
    O4 -->|Edit Per Produk| O6[UPDATE products.discount + discount_end_date]
    O4 -->|Bulk Diskon| O9[UPDATE semua products.discount]
    O4 -->|Hapus Diskon| O7[SET discount = 0]
    O2 -->|Voucher| O11[Klik Buat Voucher]
    O11 --> O12[Form Kode Jenis Nilai Min Belanja Batas]
    O12 --> O13[INSERT ke Tabel vouchers]
```

---

### 9. Flowchart Chat Pelanggan

> FloatingChat component (sisi user) dan halaman `/dashboard/chat` (sisi admin) dengan Supabase Realtime.

```mermaid
flowchart TD
    A([Start]) --> B{User Sudah Login?}
    B -->|Tidak| C[FloatingChat Tidak Muncul]
    B -->|Ya| D[FloatingChat Muncul di Pojok Kanan Bawah]

    D --> E[Fetch chat_messages milik user dari Supabase]
    E --> F[Hitung Pesan Admin yang Belum Dibaca]
    F --> G{Ada Pesan Belum Dibaca?}
    G -->|Ya| H[Tampil Badge Merah dengan Jumlah Unread]
    G -->|Tidak| I[Tampil Tombol Chat Normal]

    H --> J[User Klik Tombol Chat]
    I --> J
    J --> K[Buka Panel Chat]
    K --> L[Tampil Riwayat Percakapan]
    L --> M[Subscribe Realtime Supabase chat_messages]

    M --> N{Pesan Baru Masuk dari Admin?}
    N -->|Ya| O[Tambah Pesan ke Riwayat]
    O --> P[Naikkan Jumlah Unread]

    L --> Q[User Ketik Pesan]
    Q --> S[INSERT ke Tabel chat_messages sender = user]
    S --> V[Pesan Tampil di Chat]
    V --> W[Tandai Pesan Admin sebagai Sudah Dibaca]
    W --> X[UPDATE is_read = true]
    X --> Y[Reset Unread Count ke 0]

    AA([Admin Side]) --> AB[Buka /dashboard/chat]
    AB --> AC[Tampil Sidebar Semua Konversasi]
    AC --> AD[Klik Konversasi User]
    AD --> AE[Tampil Riwayat Pesan]
    AE --> AF[Admin Balas Pesan]
    AF --> AG[INSERT chat_messages sender = admin]
    AG --> AH[Realtime FloatingChat User Dapat Pesan Baru]
```

---

### 10. Flowchart Retur Barang

> Alur pengajuan retur oleh user dari `/profile` hingga persetujuan/penolakan oleh admin di `/dashboard/returns`.

```mermaid
flowchart TD
    A([Start]) --> B[Pesanan Selesai di /profile]
    B --> C[User Klik Ajukan Retur]
    C --> D[Buka Modal Retur]
    D --> E[Pilih Alasan Retur]
    E --> F{Alasan Diisi?}
    F -->|Tidak| G[Toast Error Alasan Wajib]
    G --> E
    F -->|Ya| H[INSERT ke Tabel returns di Supabase]
    H --> I{Berhasil?}
    I -->|Gagal| J[Toast Error]
    I -->|Ya| K[Toast Sukses Retur Diajukan]
    K --> L[Tutup Modal]

    L --> M[Sisi Admin]
    M --> N[Admin Buka /dashboard/returns]
    N --> O[Fetch returns JOIN orders dari Supabase]
    O --> P{Ada Pengajuan Retur?}
    P -->|Tidak| Q[Tampil Pesan Belum Ada Retur]
    P -->|Ya| R[Tampil Kartu Retur dengan Detail]

    R --> T{Keputusan Admin}
    T -->|Setujui| U[Klik Tombol Setujui]
    U --> V[Konfirmasi Dialog]
    V -->|OK| W[UPDATE returns.status = Disetujui]
    W --> X[UPDATE orders.status = Dikembalikan Retur]

    T -->|Tolak| Z[Klik Tombol Tolak]
    Z --> AA[Konfirmasi Dialog]
    AA -->|OK| AB[UPDATE returns.status = Ditolak]
    AB --> AC[UPDATE orders.status = Selesai]

    X --> AE[Pengembalian Dana Manual di Luar Sistem]
```

---

## 📁 Struktur File Dokumentasi

```
docs/
├── README.md                      ← Dokumentasi ini
├── flowchart-sistem.mmd           ← Flowchart utama keseluruhan sistem
├── flowchart-login.mmd            ← Flowchart login & registrasi
├── flowchart-etalase.mmd          ← Flowchart halaman utama etalase
├── flowchart-produk-detail.mmd    ← Flowchart halaman detail produk
├── flowchart-keranjang.mmd        ← Flowchart keranjang belanja
├── flowchart-checkout.mmd         ← Flowchart proses checkout
├── flowchart-profil.mmd           ← Flowchart halaman profil pengguna
├── flowchart-dashboard.mmd        ← Flowchart dashboard admin lengkap
├── flowchart-chat.mmd             ← Flowchart fitur chat realtime
└── flowchart-retur.mmd            ← Flowchart pengajuan retur barang
```

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email + Google OAuth) |
| Storage | Supabase Storage (avatars, product images) |
| Realtime | Supabase Realtime (chat, notifikasi) |
| State | Zustand + Persist (localStorage) |
| UI | Vanilla CSS + Custom Components |
| Charts | Chart.js + react-chartjs-2 |
| Maps | Leaflet (via MapPicker component) |

---

*Dokumentasi dibuat otomatis via reverse engineering source code — SembakoBerkah Project*
