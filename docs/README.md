# SembakoBerkah — Sistem E-Commerce Toko Sembako

Ini adalah project e-commerce lengkap untuk toko sembako yang dibangun menggunakan **Next.js (App Router)**, **Supabase**, dan **Zustand**. 

Sistem ini mendukung dua role (User & Owner), realtime chat, notifikasi pesanan, manajemen stok, dan laporan keuangan otomatis.

## 🚀 Fitur Utama
- **Autentikasi**: Email/Password & Google OAuth (Supabase Auth).
- **Manajemen Keranjang & Checkout**: Validasi stok realtime, voucher diskon.
- **Dashboard Admin**: CRUD produk, manajemen pesanan, retur, pengguna, dan laporan laba-rugi.
- **Realtime Chat**: Customer service realtime antara pelanggan dan admin.
- **Notifikasi**: Pemberitahuan pesanan baru untuk admin secara otomatis.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Database & Backend** | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| **State Management** | Zustand + Persist (localStorage) |
| **Styling** | Vanilla CSS + Custom UI Components |
| **Charts** | Chart.js + react-chartjs-2 |

---

## 💻 Cara Menjalankan Project Secara Lokal

1. **Clone repository ini**
   ```bash
   git clone <url-repo>
   cd SembakoBerkah
   ```

2. **Install dependencies**
   ```bash
   npm install
   # atau
   yarn install
   ```

3. **Siapkan Environment Variables**
   Buat file `.env.local` di root folder dan tambahkan kredensial Supabase Anda:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Jalankan Development Server**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📚 Dokumentasi Alur Sistem (Flowcharts)

Berikut adalah hasil *reverse engineering* dari arsitektur dan alur logika sistem SembakoBerkah.

### 1. Flowchart Sistem Utama

> Alur lengkap keseluruhan sistem dari halaman utama hingga interaksi user & admin.

```mermaid
flowchart TD
    A([🚀 Start]) --> B[Buka Website SembakoBerkah]
    B --> C[Halaman Utama / Etalase]
    C --> D{Sudah Login?}

    D -->|Tidak| E[Tampil Navbar: Login / Daftar]
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

    J --> R[Halaman /auth/callback]
    R --> S[Supabase Auth Callback]
    S --> M

    M -->|Role: owner| T[Dashboard Admin /dashboard]
    M -->|Role: customer / tidak ada| U[Halaman Utama / Etalase]

    D -->|Ya| U

    U --> V{Pilih Aksi di Etalase}
    V -->|Filter Kategori| W[Filter Produk berdasarkan Kategori]
    V -->|Cari Produk| X[Cari Produk berdasarkan Nama]
    V -->|Klik Produk| Y[Halaman Detail Produk /product/slug]
    V -->|Beli Langsung - Quick Buy| Z[Modal Quick Buy]
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
    KK -->|Stok Tidak Cukup| LL[Error: Stok Habis]
    LL --> II
    KK -->|Stok Cukup| MM[Buat Order di Supabase]
    MM --> NN[Simpan Order Items]
    NN --> OO[Kurangi Stok Produk]
    OO --> PP[Buat Notifikasi ke Admin]
    PP --> QQ[Hapus dari Keranjang]
    QQ --> BB

    BB --> RR{Tab Profil}
    RR -->|Pesanan Saya| SS[List Pesanan Pengguna]
    RR -->|Edit Profil| TT[Update Username, Nama, Telepon, dll]
    RR -->|Ganti Password| UU[Update Password Supabase]
    RR -->|Upload Foto| VV[Crop dan Upload Avatar ke Storage]
    RR -->|Tambah Alamat| WW[Form Alamat + Map Picker]
    RR -->|Minta Akses Owner| XX[Kirim Role Request ke Admin]

    SS --> YY{Detail Pesanan}
    YY -->|Pesanan Selesai| ZZ2[Ajukan Retur]
    ZZ2 --> AAA[Data Masuk ke Tabel returns]
    AAA --> BBB[Admin Review Retur di Dashboard]

    T --> CCC{Menu Dashboard Admin}
    CCC -->|Dashboard| DDD[Analitik dan Grafik Performa]
    CCC -->|Pesanan| EEE[Kelola Status Pesanan]
    CCC -->|Produk| FFF[CRUD Produk]
    CCC -->|Retur| GGG[Kelola Permintaan Retur]
    CCC -->|Keuangan| HHH[Laporan Keuangan dan Pengeluaran]
    CCC -->|Pengguna| III[Kelola Pengguna Manual]
    CCC -->|Diskon| JJJ[Set Diskon Produk dan Voucher]
    CCC -->|Pesan| KKK[Chat Realtime dengan Pelanggan]
    CCC -->|Notifikasi| LLL[Kelola Notifikasi Sistem]

    III --> MMM{Aksi Pengguna}
    MMM -->|Cari Pengguna| NNN[Filter ID/Nama/Email]
    MMM -->|Edit Pengguna| OOO[Update Profil Pengguna]
    MMM -->|Hapus Pengguna| PPP[Delete dari Tabel Profil]
    MMM -->|Ganti Role| QQQ[Set Role Owner / Admin / Logistik / Customer]

    %% Menambahkan oval End pada titik akhir
    TT --> Z_END([End])
    UU --> Z_END([End])
    VV --> Z_END([End])
    WW --> Z_END([End])
    XX --> Z_END([End])
    BBB --> Z_END([End])
    DDD --> Z_END([End])
    EEE --> Z_END([End])
    FFF --> Z_END([End])
    GGG --> Z_END([End])
    HHH --> Z_END([End])
    JJJ --> Z_END([End])
    KKK --> Z_END([End])
    LLL --> Z_END([End])
    NNN --> Z_END([End])
    OOO --> Z_END([End])
    PPP --> Z_END([End])
    QQQ --> Z_END([End])
```

---

### 2. Login & Registrasi

> Validasi sisi client dan autentikasi dengan Supabase (Email & Google).

```mermaid
flowchart TD
    A([Start]) --> B[Buka /auth]
    B --> C{Pilih Mode}
    C -->|Login| D[Form Login]
    C -->|Daftar| E[Form Registrasi]
    C -->|Google| F[signInWithOAuth Google]

    %% LOGIN FLOW
    D --> G[Input Email + Password]
    G --> H{Validasi Client}
    H -->|Email bukan @gmail.com| I[Error: Gunakan akun Gmail]
    H -->|Password kosong| J[Error: Password wajib diisi]
    I --> G
    J --> G
    H -->|Valid| K[supabase.auth.signInWithPassword]
    K --> L{Supabase Response}
    L -->|Error / Salah| M[Toast Error: Email atau Password salah]
    M --> D
    L -->|Berhasil| N[Simpan Session ke Zustand Store]
    N --> O{Cek user_metadata.role}
    O -->|role === owner| P[Redirect ke /dashboard]
    O -->|role !== owner atau tidak ada| Q[Redirect ke / - Etalase]

    %% REGISTER FLOW
    E --> R[Input Nama + Email + Password]
    R --> S{Validasi Client-Side}
    S -->|Nama kosong| T[Error: Nama wajib diisi]
    S -->|Email bukan @gmail.com| U[Error: Gunakan @gmail.com]
    S -->|Password kurang dari 8 karakter| V[Error: Min 8 karakter]
    S -->|Tanpa huruf kapital| W[Error: Harus ada huruf kapital]
    S -->|Tanpa angka| X[Error: Harus ada angka]
    S -->|Tanpa simbol| Y[Error: Harus ada simbol]
    T --> R
    U --> R
    V --> R
    W --> R
    X --> R
    Y --> R
    S -->|Semua Valid| Z[supabase.auth.signUp + full_name metadata]
    Z --> AA{Supabase Response}
    AA -->|Error| AB[Toast Error Pendaftaran Gagal]
    AB --> E
    AA -->|data.session langsung ada| AC[Simpan Session, Toast Selamat Datang]
    AC --> Q
    AA -->|Perlu Verifikasi Email| AD[Toast: Periksa email Anda]
    AD --> AE[Reset Form, Kembali ke mode Login]

    %% GOOGLE OAUTH FLOW
    F --> AF[supabase.auth.signInWithOAuth provider=google]
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

    %% Menambahkan oval End pada titik akhir
    P --> Z_END([End])
    Q --> Z_END([End])
    AE --> Z_END([End])

```

---

### 3. Etalase / Storefront

> Halaman utama, filter kategori, dan fitur beli langsung (quick buy).

```mermaid
flowchart TD
    A([Start]) --> B[Buka / - Halaman Etalase]
    B --> C[Fetch Produk dari Supabase]
    C --> D{Loading?}
    D -->|Ya| E[Tampil Komponen Loading]
    D -->|Tidak| F[Tampil Etalase Lengkap]

    F --> G[Hero Carousel Promo Gambar]
    F --> H[Bagian Promo Spesial + Kenapa Kami]
    F --> I[Grid Kategori Produk - 12 Kategori]
    F --> J{Ada Produk Diskon Aktif?}
    J -->|Ya| K[Tampil Bagian Sedang Diskon Besar]
    J -->|Tidak| L[Tampil Grid Produk Utama]
    K --> L

    L --> M{Filter Aktif?}
    M -->|Kategori dipilih| N[Filter produk.category === kategori]
    M -->|Search diisi| O[Filter produk.name contains query]
    M -->|Keduanya| P[Filter Kategori AND Nama]
    M -->|Tidak ada| Q[Tampil Semua Produk Aktif]
    N --> Q
    O --> Q
    P --> Q

    Q --> R{User Klik Produk}
    R -->|Klik kartu produk| S[Navigasi ke /product/slug]
    R -->|Klik Beli Langsung| T[Buka Modal Quick Buy]
    R -->|Klik Hati Wishlist| U[Toggle Wishlist di Zustand Store]

    T --> V[Tampil Info Produk: Nama, Harga, Stok]
    V --> W{Produk Punya Varian?}
    W -->|Ya| X[Tampil Tombol Varian, User Pilih]
    W -->|Tidak| Y[Langsung ke Pengaturan Jumlah]
    X --> Y
    Y --> Z[Atur Jumlah 1 hingga Max Stok]
    Z --> AA{User Aksi}
    AA -->|Tambah Keranjang| AB[addToCart ke Zustand]
    AB --> AC[Toast Sukses, Tutup Modal]
    AA -->|Beli Langsung| AD[addToCart + Navigasi ke /keranjang]
    AA -->|Tutup Modal| AE[Tutup Modal, Kembali ke Etalase]

    U --> AF{Sudah di Wishlist?}
    AF -->|Ya| AG[Hapus dari Wishlist]
    AF -->|Tidak| AH[Tambah ke Wishlist]
    AG --> Q
    AH --> Q

    %% Menambahkan oval End pada titik akhir
    E --> Z_END([End])
    G --> Z_END([End])
    H --> Z_END([End])
    I --> Z_END([End])
    S --> Z_END([End])
    AC --> Z_END([End])
    AD --> Z_END([End])
    AE --> Z_END([End])

```

---

### 4. Detail Produk

> Detail produk, pilihan varian, cek stok realtime, dan ulasan pelanggan.

```mermaid
flowchart TD
    A([Start]) --> B[Buka /product/slug]
    B --> C[Fetch Produk berdasarkan Slug dari Supabase]
    C --> D{Produk Ditemukan?}
    D -->|Tidak| E[Toast Error + Redirect ke /]
    D -->|Ya| F[Fetch Reviews Produk dari Supabase]
    F --> G[Fetch Produk Related - 5 Acak]
    G --> H[Tampil Halaman Detail Produk]

    H --> I[Tampil Gambar, Nama, Harga, Stok, Rating]

    H --> J{Produk Punya Varian?}
    J -->|Ya| K[Tampil Tombol Pilih Varian]
    K --> L[User Pilih Varian]
    L --> M[Update Harga dan Stok berdasarkan Varian]
    J -->|Tidak| N[Gunakan Harga dan Stok Utama]
    M --> N

    H --> O{Stok > 0?}
    O -->|Tidak| P[Tampil Label STOK HABIS, Tombol Nonaktif]
    O -->|Ya| Q[Tombol Aktif: Masukkan Keranjang + Beli Sekarang]

    Q --> R[User Atur Jumlah 1 hingga Max Stok]
    R --> S{Aksi User}
    S -->|Masukkan Keranjang| T[addToCart ke Zustand Store]
    T --> U[Toast Berhasil Masuk Keranjang]
    S -->|Beli Sekarang| V[addToCart + Redirect ke /keranjang]
    S -->|Toggle Wishlist| W[toggleWishlist di Zustand]

    H --> X[Tab Navigasi]
    X --> Y{Pilih Tab}
    Y -->|Detail Produk| Z[Tampil Deskripsi dan Spesifikasi]
    Y -->|Ulasan| AA[Tampil Daftar Ulasan dan Rating]

    AA --> AB[Tampil Distribusi Rating Bintang]
    AB --> AC[Daftar Review dengan Avatar dan Rating]

    H --> AD{Ada Diskon Aktif?}
    AD -->|Ya dan Belum Kadaluarsa| AE[Tampil Badge Diskon + Harga Coret + Hitung Mundur]
    AD -->|Kadaluarsa atau Tidak Ada| AF[Tampil Harga Normal]

    H --> AG[Bagian Produk Terkait 5 Produk Acak]
    AG --> AH[User Klik Produk Terkait]
    AH --> B

    %% Menambahkan oval End pada titik akhir
    E --> Z_END([End])
    I --> Z_END([End])
    N --> Z_END([End])
    P --> Z_END([End])
    U --> Z_END([End])
    V --> Z_END([End])
    W --> Z_END([End])
    Z --> Z_END([End])
    AC --> Z_END([End])
    AE --> Z_END([End])
    AF --> Z_END([End])

```

---

### 5. Keranjang Belanja

> Manajemen item di keranjang, ubah kuantitas, dan validasi voucher diskon.

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
    L -->|Tidak| M[Toast Error: Pilih dulu]
    L -->|Ya| N[Konfirmasi Hapus]
    N -->|Batal| H
    N -->|OK| O[removeFromCart untuk Setiap ID Terpilih]
    O --> H

    I -->|Ubah Qty| P{Delta Qty}
    P -->|Kurang = 0| Q[removeFromCart - Hapus Item]
    P -->|Tambah melebihi stok| R[Toast Error: Qty melebihi stok]
    P -->|Normal| S[updateCartQty di Zustand]
    Q --> H
    R --> H
    S --> H

    I -->|Input Kode Promo| T[Klik Gunakan Promo]
    T --> U{Voucher Code Kosong?}
    U -->|Ya| V[Tidak Proses]
    U -->|Tidak| W[Query Supabase vouchers by code]
    W --> X{Voucher Ditemukan?}
    X -->|Tidak| Y[Toast Error: Kode tidak valid]
    Y --> H
    X -->|Ya| Z{Voucher Masih Aktif?}
    Z -->|Tidak Aktif / Kadaluarsa| AA[Toast Error: Voucher kadaluarsa]
    AA --> H
    Z -->|Aktif| AB{Minimal Belanja Terpenuhi?}
    AB -->|Tidak| AC[Toast Error: Belum mencapai min. pembelian]
    AC --> H
    AB -->|Ya| AD[setAppliedVoucher ke Zustand]
    AD --> AE[Toast Sukses, Tampil Info Diskon Voucher]
    AE --> H

    I -->|Klik Checkout - Item Dipilih| AF{Ada Item Dipilih?}
    AF -->|Tidak| AG[Toast Error: Pilih minimal 1 produk]
    AF -->|Ya| AH[setSelectedForCheckout ke Zustand]
    AH --> AI[Navigasi ke /checkout]

    H --> AJ[Tampil Ringkasan]
    AJ --> AK[Total Harga Item Terpilih]
    AK --> AL{Voucher Terpasang?}
    AL -->|Ya| AM[Tampil Total setelah Diskon Voucher]
    AL -->|Tidak| AN[Tampil Total Tanpa Diskon]

    %% Menambahkan oval End pada titik akhir
    G --> Z_END([End])
    J --> Z_END([End])
    K --> Z_END([End])
    M --> Z_END([End])
    V --> Z_END([End])
    AG --> Z_END([End])
    AI --> Z_END([End])
    AM --> Z_END([End])
    AN --> Z_END([End])

```

---

### 6. Checkout & Pembayaran

> Kalkulasi ongkir, pemotongan stok otomatis, dan pembuatan order.

```mermaid
flowchart TD
    A([Start]) --> B[Buka /checkout]
    B --> C{selectedForCheckout Kosong?}
    C -->|Ya| D[Redirect Paksa ke /keranjang]
    C -->|Tidak| E[Fetch Semua Produk dari Supabase]
    E --> F[Enrich Item Checkout dengan Harga Terbaru]

    F --> G[Tampil Halaman Checkout]

    G --> H[Tampil Ringkasan Item Pesanan]
    G --> I[Tampil Pilihan Kurir]
    G --> J{Voucher Terpasang dari Keranjang?}
    J -->|Ya| K[Tampil Badge Promo + Jumlah Hemat]
    J -->|Tidak| L[Tampil Banner Kembali ke Keranjang untuk Masukkan Promo]

    G --> M[Isi Nama Penerima]
    G --> N[Pilih Metode Pengiriman]
    N --> O{Pilihan Kurir}
    O -->|Ambil Sendiri| P[Ongkir = Rp 0]
    O -->|JNE Reguler| Q[Ongkir = Rp 15.000]
    O -->|GoSend Instant| R[Ongkir = Rp 15.000]

    G --> S[Kalkulasi Total Tagihan]
    S --> T[Subtotal + Pajak 10persen + Ongkir - Diskon Voucher]

    G --> U[Pilih Metode Pembayaran]
    U --> V[Hanya COD yang Aktif]

    G --> W[Klik Bayar Sekarang]
    W --> X{Session Login Ada?}
    X -->|Tidak| Y[Toast Error: Silakan Login]
    Y --> G
    X -->|Ya| Z{Nama Penerima Diisi?}
    Z -->|Tidak| AA[Toast Error: Nama penerima kosong]
    AA --> G
    Z -->|Ya| AB[Cek Stok Setiap Item ke Supabase]
    AB --> AC{Ada Item Stok Habis?}
    AC -->|Ya| AD[Toast Error: Daftar Nama Item]
    AD --> G
    AC -->|Tidak| AE[INSERT ke Tabel orders Supabase]
    AE --> AF{Insert Berhasil?}
    AF -->|Gagal| AG[Toast Error Buat Pesanan Gagal]
    AG --> G
    AF -->|Berhasil| AH[INSERT ke Tabel order_items]
    AH --> AI[UPDATE Stok Setiap Produk]
    AI --> AJ[INSERT Notifikasi Pesanan Baru ke Admin]
    AJ --> AK[Hapus Item Checkout dari Keranjang]
    AK --> AL[Hapus Voucher yang Dipakai]
    AL --> AM[Toast Sukses: Pesanan Berhasil Dibuat]
    AM --> AN[Redirect ke /profile]

    %% Menambahkan oval End pada titik akhir
    D --> Z_END([End])
    H --> Z_END([End])
    I --> Z_END([End])
    K --> Z_END([End])
    L --> Z_END([End])
    M --> Z_END([End])
    P --> Z_END([End])
    Q --> Z_END([End])
    R --> Z_END([End])
    T --> Z_END([End])
    V --> Z_END([End])
    AN --> Z_END([End])

```

---

### 7. Profil Pengguna

> Manajemen alamat, upload avatar, riwayat pesanan, dan request akses admin.

```mermaid
flowchart TD
    A([Start]) --> B[Buka /profile]
    B --> C{Session Ada?}
    C -->|Tidak| D[Tampil Halaman Profil Kosong / Belum Login]
    C -->|Ya| E[Load User Metadata dari Session Zustand]
    E --> F[Fetch Pesanan dari Supabase berdasarkan user_id]
    E --> G[Fetch Role Request Status dari Supabase]
    E --> H[Load Alamat dari user_metadata.addresses]

    G --> I{Role Request = Approved?}
    I -->|Ya| J[Auto-Update Role jadi Owner via Supabase Auth]
    J --> K[Sync ke Tabel profiles]
    K --> L[Refresh Session Zustand]
    L --> M[Delete Role Request yang Sudah Diproses]
    I -->|Pending / Tidak Ada| N[Tampil Status Permintaan]

    B --> O[Tab Navigasi Profil]
    O --> P{Pilih Tab}

    P -->|Dashboard Pesanan| Q[Tampil Ringkasan dan List Pesanan]
    Q --> R[Filter Pesanan berdasarkan Status]
    R --> S[Klik Detail Pesanan]
    S --> T[Fetch order_items dari Supabase]
    T --> U[Tampil Modal Detail Pesanan]
    U --> V{Status Pesanan = Selesai?}
    V -->|Ya| W[Tombol Ajukan Retur Aktif]
    V -->|Tidak| X[Tombol Retur Nonaktif]
    W --> Y[Klik Ajukan Retur]
    Y --> Z[Isi Alasan Retur]
    Z --> AA[INSERT ke Tabel returns Supabase]
    AA --> AB[Toast Sukses Retur Diajukan]

    P -->|Profil Saya| AC[Form Edit Profil]
    AC --> AD[Ubah Username, Nama, Telepon, Jenis Kelamin, Tanggal Lahir]
    AD --> AE[Klik Simpan Perubahan]
    AE --> AF{Validasi Nomor Telepon}
    AF -->|Tidak Valid 08 + 12 digit| AG[Toast Error Nomor Telepon]
    AF -->|Valid / Kosong| AH[supabase.auth.updateUser dengan Data Baru]
    AH --> AI[Sync ke Tabel profiles]
    AI --> AJ[Refresh Session Zustand]
    AJ --> AK[Toast Sukses Data Diperbarui]

    P -->|Foto Profil| AL[Drag and Drop atau Pilih File]
    AL --> AM[Validasi Tipe File Image saja]
    AM --> AN[Buka Modal Crop]
    AN --> AO[User Crop Gambar]
    AO --> AP[Upload ke Supabase Storage bucket avatars]
    AP --> AQ{Upload Berhasil?}
    AQ -->|Gagal| AR[Toast Error Upload]
    AQ -->|Berhasil| AS[Dapatkan Public URL]
    AS --> AT[supabase.auth.updateUser dengan custom_avatar]
    AT --> AU[Sync ke profiles.avatar_url]
    AU --> AV[Refresh Session Zustand]
    AV --> AW[Toast Sukses Foto Diperbarui]

    P -->|Ganti Password| AX[Input Password Baru + Konfirmasi]
    AX --> AY{Password Cocok?}
    AY -->|Tidak| AZ[Toast Error Tidak Cocok]
    AY -->|Ya| BA[supabase.auth.updateUser dengan Password Baru]
    BA --> BB[Toast Sukses Password Diperbarui]

    P -->|Alamat Saya| BC[Tampil Daftar Alamat]
    BC --> BD[Klik Tambah Alamat Baru]
    BD --> BE[Form Alamat: Nama, Telepon, Wilayah, Jalan, Detail, Label]
    BE --> BF[Opsional: Buka Map Picker Leaflet untuk Koordinat]
    BF --> BG[Simpan Alamat ke user_metadata.addresses]
    BG --> BH[Update via supabase.auth.updateUser]

    P -->|Minta Akses Owner| BI{Sudah Ada Role Request?}
    BI -->|Ya - Pending| BJ[Tampil Status Menunggu Persetujuan]
    BI -->|Ya - Approved| BK[Tampil Tombol Klaim sudah diklaim otomatis]
    BI -->|Tidak Ada| BL[Tombol Ajukan Permintaan Aktif]
    BL --> BM[Konfirmasi Dialog]
    BM -->|OK| BN[INSERT ke Tabel role_requests Supabase]
    BN --> BO[Toast Sukses Permintaan Dikirim]
    BO --> BJ

    %% Menambahkan oval End pada titik akhir
    D --> Z_END([End])
    F --> Z_END([End])
    H --> Z_END([End])
    M --> Z_END([End])
    N --> Z_END([End])
    X --> Z_END([End])
    AB --> Z_END([End])
    AG --> Z_END([End])
    AK --> Z_END([End])
    AR --> Z_END([End])
    AW --> Z_END([End])
    AZ --> Z_END([End])
    BB --> Z_END([End])
    BH --> Z_END([End])
    BJ --> Z_END([End])
    BK --> Z_END([End])

```

---

### 8. Dashboard Admin

> Pusat kontrol admin untuk CRUD produk, pantau pesanan, keuangan, dan manajemen user.

```mermaid
flowchart TD
    A([Start]) --> B[Buka /dashboard]
    B --> C{Session Valid + Role = owner?}
    C -->|Tidak| D[Redirect ke /auth]
    C -->|Ya| E[Dashboard Layout dengan Sidebar]

    E --> F[Fetch Unread Notifications Count dari Supabase]
    F --> G[Tampil Badge Notif di Header]

    E --> H{Menu Sidebar}
    H -->|Dashboard| I[Halaman /dashboard - Analitik dan Grafik]
    H -->|Pesanan| J[Halaman /dashboard/orders - Manajemen Pesanan]
    H -->|Produk| K[Halaman /dashboard/products - CRUD Produk]
    H -->|Retur| L[Halaman /dashboard/returns - Pengembalian Barang]
    H -->|Keuangan| M[Halaman /dashboard/finance - Laporan Keuangan]
    H -->|Pengguna| N[Halaman /dashboard/users - Manajemen User]
    H -->|Diskon| O[Halaman /dashboard/discounts - Diskon dan Voucher]
    H -->|Pesan| P[Halaman /dashboard/chat - Chat Pelanggan]
    H -->|Notifikasi| Q[Halaman /dashboard/notifications]
    H -->|Lihat Toko| R[Kembali ke / Etalase]

    %% DASHBOARD ANALITIK
    I --> I1[Fetch orders, expenses, profiles, site_visits, products]
    I1 --> I2[Tampil 4 Kartu KPI]
    I2 --> I3[Total Pemasukan dari Semua Pesanan Aktif]
    I2 --> I4[Total Pesanan]
    I2 --> I5[Pesanan Tertunda: status Menunggu]
    I2 --> I6[Stok Kritis: produk stok kurang dari 5]
    I1 --> I7[Grafik Bar: Pemasukan vs Pengeluaran per Bulan]
    I1 --> I8[Grafik Line: Pendaftaran Pengguna Baru per Bulan]
    I1 --> I9[Grafik Line: Kunjungan Website per Bulan]

    %% PESANAN
    J --> J1[Fetch orders dari Supabase - Desc by created_at]
    J1 --> J2[Filter berdasarkan Status + Pencarian]
    J2 --> J3{Aksi Pesanan}
    J3 -->|Update Status| J4[supabase.update orders.status]
    J4 --> J5{Status Baru}
    J5 -->|Belum Bayar| J6[Status: Menunggu Pembayaran]
    J5 -->|Sedang Dikemas| J7[Status: Sedang Dikemas]
    J5 -->|Dikirim| J8[Status: Dalam Pengiriman]
    J5 -->|Selesai| J9[Status: Pesanan Selesai]
    J5 -->|Dibatalkan| J10[Status: Dibatalkan]

    %% PRODUK CRUD
    K --> K1[Fetch products dari Supabase]
    K1 --> K2[Tampil Tabel Produk dengan Pencarian]
    K2 --> K3{Aksi Produk}
    K3 -->|Tambah Baru| K4[Buka Modal Form Produk]
    K4 --> K5[Input: Nama, Harga, HPP, Stok, Kategori, Gambar, Deskripsi]
    K5 --> K6[Tambah Varian Opsional: Nama-Harga-Stok]
    K6 --> K7[Tambah Spesifikasi Opsional: Key-Value]
    K7 --> K8[Upload Gambar ke Supabase Storage]
    K8 --> K9[INSERT ke Tabel products]
    K9 --> K10[Toast Sukses + Refresh Tabel]
    K3 -->|Edit Produk| K11[Buka Modal Form dengan Data Existing]
    K11 --> K5
    K9 --> K12[UPDATE products jika Edit Mode]
    K3 -->|Hapus Produk| K13[Konfirmasi Hapus]
    K13 -->|OK| K14[DELETE dari Tabel products]
    K14 --> K10
    K3 -->|Aktifkan / Nonaktifkan| K15[UPDATE products.status]

    %% RETUR
    L --> L1[Fetch returns JOIN orders dari Supabase]
    L1 --> L2{Ada Retur?}
    L2 -->|Tidak| L3[Tampil Pesan Kosong]
    L2 -->|Ya| L4[Tampil Kartu Retur]
    L4 --> L5{Aksi Retur}
    L5 -->|Setujui| L6[UPDATE returns.status = Disetujui]
    L6 --> L7[UPDATE orders.status = Dikembalikan Retur]
    L5 -->|Tolak| L8[UPDATE returns.status = Ditolak]
    L8 --> L9[UPDATE orders.status = Selesai]

    %% KEUANGAN
    M --> M1[Fetch orders status=Selesai + expenses]
    M1 --> M2[Hitung Omzet dari Pesanan Selesai]
    M2 --> M3[Asumsikan HPP 70 persen dari Omzet]
    M3 --> M4[Total Pengeluaran dari Tabel expenses]
    M4 --> M5[Hitung Laba Bersih = Omzet - HPP - Pengeluaran]
    M5 --> M6[Tampil 4 Kartu: Omzet, Pengeluaran, HPP, Laba Bersih]
    M6 --> M7[Klik Tambah Pengeluaran]
    M7 --> M8[Form: Tanggal, Kategori, Catatan, Jumlah]
    M8 --> M9[INSERT ke Tabel expenses]
    M9 --> M1

    %% PENGGUNA
    N --> N1[Fetch users via RPC get_all_users atau fallback profiles]
    N1 --> N2[Fetch role_requests dari Supabase]
    N2 --> N3{Tab Aktif}
    N3 -->|Pengguna| N4[Tampil Tabel Semua Pengguna]
    N3 -->|Permintaan Owner| N5[Tampil Daftar Role Request]
    N5 --> N6{Aksi}
    N6 -->|Approve| N7[UPDATE role_requests.status = Approved]
    N7 --> N8[UPDATE profiles.role = Owner]
    N8 --> N9[Alert: User akan jadi Owner saat login]
    N6 -->|Reject| N10[UPDATE role_requests.status = Rejected]

    %% DISKON
    O --> O1[Fetch products + vouchers dari Supabase]
    O1 --> O2{Tab Aktif}
    O2 -->|Diskon Produk| O3[Tampil Tabel Produk dengan Input Diskon]
    O3 --> O4{Aksi Diskon}
    O4 -->|Edit Diskon Per Produk| O5[Input % Diskon + Tanggal Berakhir]
    O5 --> O6[UPDATE products.discount + discount_end_date]
    O4 -->|Hapus Diskon| O7[SET discount = 0]
    O4 -->|Bulk Diskon| O8[Input % untuk Semua Produk]
    O8 --> O9[UPDATE semua products.discount]
    O2 -->|Voucher| O10[Tampil Daftar Voucher]
    O10 --> O11[Klik Buat Voucher]
    O11 --> O12[Input: Kode, Jenis, Nilai, Min Belanja, Batas Diskon, Batas Pakai]
    O12 --> O13[INSERT ke Tabel vouchers]
    O10 --> O14[Hapus Voucher]
    O14 --> O15[DELETE dari Tabel vouchers]

    %% CHAT
    P --> P1[Fetch profiles untuk Mapping Nama]
    P1 --> P2[Fetch chat_messages dari Supabase]
    P2 --> P3[Tampil Sidebar Percakapan]
    P3 --> P4[Subscribe Realtime Supabase chat_messages]
    P4 --> P5{Pesan Baru Masuk?}
    P5 -->|Ya| P6[Toast Pesan Baru + Browser Notification]
    P6 --> P3
    P3 --> P7[Klik User di Sidebar]
    P7 --> P8[Tampil Riwayat Pesan dengan User]
    P8 --> P9[Admin Ketik Balasan]
    P9 --> P10[INSERT chat_messages - sender = admin]
    P10 --> P8

    %% NOTIFIKASI
    Q --> Q1[Fetch notifications - Desc by created_at]
    Q1 --> Q2[Tampil List Notifikasi]
    Q2 --> Q3{Aksi}
    Q3 -->|Tandai Dibaca| Q4[UPDATE notifications.unread = false]
    Q3 -->|Tandai Semua Dibaca| Q5[UPDATE semua unread = false]
    Q3 -->|Hapus Notif| Q6[DELETE dari Tabel notifications]

    %% Menambahkan oval End pada titik akhir
    D --> Z_END([End])
    G --> Z_END([End])
    R --> Z_END([End])
    I3 --> Z_END([End])
    I4 --> Z_END([End])
    I5 --> Z_END([End])
    I6 --> Z_END([End])
    I7 --> Z_END([End])
    I8 --> Z_END([End])
    I9 --> Z_END([End])
    J6 --> Z_END([End])
    J7 --> Z_END([End])
    J8 --> Z_END([End])
    J9 --> Z_END([End])
    J10 --> Z_END([End])
    K10 --> Z_END([End])
    K12 --> Z_END([End])
    K15 --> Z_END([End])
    L3 --> Z_END([End])
    L7 --> Z_END([End])
    L9 --> Z_END([End])
    N4 --> Z_END([End])
    N9 --> Z_END([End])
    N10 --> Z_END([End])
    O6 --> Z_END([End])
    O7 --> Z_END([End])
    O9 --> Z_END([End])
    O13 --> Z_END([End])
    O15 --> Z_END([End])
    Q4 --> Z_END([End])
    Q5 --> Z_END([End])
    Q6 --> Z_END([End])

```

---

### 9. Chat Pelanggan (Realtime)

> Fitur live chat antara pengunjung toko dan admin menggunakan Supabase Realtime.

```mermaid
flowchart TD
    A([Start]) --> B{User Sudah Login?}
    B -->|Tidak| C[FloatingChat Tidak Muncul]
    C --> END1([End])
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
    P --> L

    L --> Q[User Ketik Pesan]
    Q --> R{Panel Terbuka saat Kirim?}
    R -->|Ya| S[INSERT ke Tabel chat_messages - sender = user]
    S --> T{Berhasil?}
    T -->|Gagal| U[Toast Error]
    T -->|Berhasil| V[Pesan Tampil di Chat]
    V --> W[Tandai Semua Pesan Admin sebagai Sudah Dibaca]
    W --> X[UPDATE is_read = true untuk Pesan Admin]
    X --> Y[Reset Unread Count ke 0]
    Y --> L

    L --> Z[User Tutup Panel Chat]
    Z --> END2([End])

    AA([Admin Side]) --> AB[Buka /dashboard/chat]
    AB --> AC[Tampil Sidebar Semua Konversasi]
    AC --> AD[Klik Konversasi User]
    AD --> AE[Tampil Riwayat Pesan]
    AE --> AF[Admin Balas Pesan]
    AF --> AG[INSERT chat_messages - sender = admin]
    AG --> AH[Realtime: FloatingChat User Dapat Pesan Baru]
    AH --> END3([End])

```

---

### 10. Pengajuan Retur Barang

> Alur komplain dan pengembalian barang dari pelanggan hingga disetujui admin.

```mermaid
flowchart TD
    A([Start]) --> B[Pesanan Selesai di /profile]
    B --> C[User Klik Ajukan Retur]
    C --> D[Buka Modal Retur]
    D --> E[Pilih Alasan Retur]
    E --> F{Alasan Diisi?}
    F -->|Tidak| G[Toast Error: Alasan Wajib]
    G --> E
    F -->|Ya| H[INSERT ke Tabel returns di Supabase]
    H --> I{Berhasil?}
    I -->|Gagal| J[Toast Error]
    I -->|Ya| K[Toast Sukses: Retur Diajukan]
    K --> L[Tutup Modal]

    L --> M[--- Sisi Admin ---]
    M --> N[Admin Buka /dashboard/returns]
    N --> O[Fetch returns JOIN orders dari Supabase]
    O --> P{Ada Pengajuan Retur?}
    P -->|Tidak| Q[Tampil Pesan: Belum Ada Retur]
    P -->|Ya| R[Tampil Kartu Retur dengan Detail]

    R --> S[Tampil Info: ID Order, Nama Pembeli, Total, Alasan, Tanggal]
    S --> T{Keputusan Admin}

    T -->|Setujui| U[Klik Tombol Setujui]
    U --> V[Konfirmasi Dialog]
    V -->|Batal| S
    V -->|OK| W[UPDATE returns.status = Disetujui]
    W --> X[UPDATE orders.status = Dikembalikan Retur]
    X --> Y[UI Update Kartu Retur Jadi Disetujui]

    T -->|Tolak| Z[Klik Tombol Tolak]
    Z --> AA[Konfirmasi Dialog]
    AA -->|Batal| S
    AA -->|OK| AB[UPDATE returns.status = Ditolak]
    AB --> AC[UPDATE orders.status = Selesai]
    AC --> AD[UI Update Kartu Retur Jadi Ditolak]

    Y --> AE[Pengembalian Dana Manual di Luar Sistem]
    AD --> AF[Pesanan Kembali ke Status Selesai]

    %% Menambahkan oval End pada titik akhir
    J --> Z_END([End])
    Q --> Z_END([End])
    AE --> Z_END([End])
    AF --> Z_END([End])

```

---


*Dokumentasi diagram dibuat secara otomatis berdasarkan implementasi kode aktual.*