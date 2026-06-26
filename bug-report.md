# 🐛 Bug Report — SembakoBerkah (Toko)
**Repo:** https://github.com/Arawa-Sigma/Toko  
**Stack:** Next.js 16 · Supabase · Zustand · Tailwind CSS v4  
**Review Date:** 2026-06-26  
**Reviewer:** Arena.ai Agent

---

## 🔴 CRITICAL BUGS (Langsung menyebabkan error / crash)

---

### 🔴 BUG-01 — Duplicate Key `session` di Zustand Store
**File:** `src/lib/store.js` (baris 6–7)  
**Kode Bermasalah:**
```js
session: null,
session: null,  // ← DUPLIKAT
```
**Dampak:** Di JavaScript strict mode / bundler modern, duplicate key dalam object literal akan menyebabkan salah satu value diabaikan secara diam-diam. Ini bisa menyebabkan state authentication tidak konsisten dan hard to debug.  
**Fix:** Hapus satu dari dua deklarasi `session: null`.

---

### 🔴 BUG-02 — `setIsSavingAddress` dipanggil `true` di blok `finally` (Logic Terbalik)
**File:** `src/app/checkout/page.js` (blok `handleSaveNewAddress`)  
**Kode Bermasalah:**
```js
} finally {
  setIsSavingAddress(true)  // ← SALAH, harusnya false
  setIsSavingAddress(false)
}
```
**Dampak:** Tombol simpan alamat akan momentarily ter-*set* ke `true` (loading) tepat sebelum `false`. Ini adalah coding error yang nyata — meski efek visualnya minor, mengindikasikan kode ditulis terburu-buru dan bisa menyebabkan race condition di future refactor.  
**Fix:** Hapus baris `setIsSavingAddress(true)` di dalam blok `finally`.

---

### 🔴 BUG-03 — Broken Image URL di Navbar (Path Hardcoded Salah)
**File:** `src/components/Navbar.js`  
**Kode Bermasalah:**
```jsx
<img src="https://raw.githubusercontent.com/logo.png" ... />
// dan:
<img src="/people.png" />
```
**Dampak:** Logo SembakoBerkah tidak akan pernah tampil karena URL `https://raw.githubusercontent.com/logo.png` adalah URL yang tidak valid/tidak ada. File `/people.png` juga tidak ada di folder `/public`. Navbar akan rusak tampilannya bagi user yang tidak login.  
**Fix:** Pastikan file logo ada di `/public/logo.png` dan gunakan path `/logo.png`. Ganti fallback image ke asset yang benar-benar ada.

---

### 🔴 BUG-04 — `useStore` digunakan sebagai Static Reference di dalam Store sendiri
**File:** `src/lib/store.js`  
**Kode Bermasalah:**
```js
addToCart: async (product, qty = 1, variant = null) => {
  // ...
  useUIStore.getState().showToast(...)  // ← Fine, ini OK
  // ...
},
toggleWishlist: async (productId) => {
  // ...
  useUIStore.getState().showToast(...)  // ← Fine
}
```
**Catatan:** Penggunaan `useUIStore.getState()` di luar React component sebenarnya valid untuk Zustand. Namun masalahnya ada di logout:
```js
logout: () => set({ session: null }),
// Tidak sync cart/wishlist state ke initial state secara atomik 
// (cart, wishlist, selectedForCheckout tidak direset di sini!)
```
**Dampak:** Setelah logout, Zustand masih menyimpan `cart` dan `wishlist` di localStorage (karena `persist`). Kalau user login akun berbeda, mereka akan melihat cart dari akun sebelumnya sampai `syncCartFromSupabase` dipanggil ulang.  
**Fix:** Di `setSession`, saat `user` adalah `null`, juga reset `cart`, `wishlist`, dan `selectedForCheckout` (sudah ada di kode, tapi `logout()` tidak melakukan itu — hanya `set({ session: null })`).

---

### 🔴 BUG-05 — Tidak Ada Route Protection / Middleware Auth di Dashboard
**File:** `src/app/dashboard/layout.js`  
**Kode Bermasalah:**
```js
export default function DashboardLayout({ children }) {
  const { session } = useStore()
  // TIDAK ADA redirect jika session null atau role !== 'owner'
  return ( <div>...</div> )
}
```
**Dampak:** Siapapun bisa mengakses URL `/dashboard`, `/dashboard/products`, `/dashboard/finance`, dll. bahkan tanpa login, hanya dengan mengetik URL langsung di browser. Tidak ada `middleware.js` di repository ini. Ini adalah **kerentanan keamanan serius** — data pesanan, data keuangan, manajemen user semua terbuka.  
**Fix:** Buat `src/middleware.js` dengan Supabase SSR session check, atau tambahkan guard `useEffect` + `router.replace('/auth')` di `DashboardLayout` jika session null atau role bukan owner.

---

## 🟠 MAJOR BUGS (Fitur tidak bekerja sebagaimana mestinya)

---

### 🟠 BUG-06 — Validasi Email Terlalu Ketat: Hanya `@gmail.com`
**File:** `src/app/auth/page.js`  
**Kode Bermasalah:**
```js
const validateEmail = (email) => {
  if (!email.endsWith("@gmail.com")) return "Gunakan akun @gmail.com"
  return ""
}
```
**Dampak:** User dengan email `@yahoo.com`, `@outlook.com`, `@company.com`, dll. **tidak bisa mendaftar sama sekali**. Ini sangat membatasi jangkauan pengguna. Supabase Auth sendiri mendukung semua format email valid.  
**Fix:** Ganti validasi menjadi regex email standar: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.

---

### 🟠 BUG-07 — `fetchProducts` di Checkout Mengambil Semua Produk Tanpa Filter
**File:** `src/app/checkout/page.js`  
**Kode Bermasalah:**
```js
const { data } = await supabase.from('products').select('*')
// Mengambil SEMUA produk tanpa filter
if (data) setProducts(data)
```
**Dampak:** Di production ketika ada ribuan produk, ini akan menyebabkan:  
1. Response lambat karena mengambil semua data
2. Memory usage di browser meningkat drastis  
3. Supabase bisa throttle request karena payload terlalu besar

**Fix:** Filter hanya produk yang dibutuhkan: `.in('id', checkoutItemIds)`.

---

### 🟠 BUG-08 — Voucher Tidak Dikurangi `used_count` Setelah Checkout Berhasil
**File:** `src/app/checkout/page.js` (fungsi `handleCheckout`)  
**Kode Bermasalah:**
```js
// Setelah order sukses:
clearAppliedVoucher()
// TIDAK ADA update used_count di tabel vouchers!
```
**Dampak:** Kuota voucher tidak pernah berkurang, sehingga validasi kuota di halaman keranjang (`data.used_count >= data.quota`) tidak pernah efektif. Voucher terbatas bisa dipakai unlimited kali.  
**Fix:** Tambahkan setelah `clearAppliedVoucher()`:
```js
if (appliedVoucher) {
  await supabase.from('vouchers')
    .update({ used_count: appliedVoucher.used_count + 1 })
    .eq('id', appliedVoucher.id)
}
```

---

### 🟠 BUG-09 — Riwayat Pesanan di Profil Menggunakan Filter Nama (Tidak Aman & Tidak Akurat)
**File:** `src/app/profile/page.js`  
**Kode Bermasalah:**
```js
const myOrders = data.filter(o => 
  o.buyer_name === (meta.full_name || meta.username) || 
  o.user_id === session.user.id  // ← Ini sudah benar
)
```
**Dampak:** Filter `buyer_name` sangat rentan: dua user dengan nama yang sama akan melihat pesanan satu sama lain. Selain itu, query awalnya mengambil SEMUA orders (`from('orders').select('*')`) — ini sangat berbahaya dan tidak efisien.  
**Fix:** Query langsung menggunakan `user_id`:
```js
const { data } = await supabase.from('orders')
  .select('*')
  .eq('user_id', session.user.id)
  .order('created_at', { ascending: false })
```

---

### 🟠 BUG-10 — Stok Dikurangi di Client-Side Tanpa Validasi Atomik (Race Condition)
**File:** `src/app/checkout/page.js` (fungsi `handleCheckout`)  
**Kode Bermasalah:**
```js
// Cek stok
const outOfStockItems = enrichedCheckout.filter(item => {
  const currentStock = products.find(p => p.id === item.productId)?.stock || 0
  return currentStock < item.qty
})
// Lalu update stok:
await supabase.from('products').update({ stock: newStock }).eq('id', product.id)
```
**Dampak:** Jika dua user checkout produk yang sama secara bersamaan, keduanya bisa melewati pengecekan stok (misalnya stok = 1, keduanya cek dan stok masih 1), lalu keduanya berhasil membeli sehingga stok jadi -1. Ini **race condition klasik** di e-commerce.  
**Fix:** Gunakan Supabase RPC dengan PostgreSQL transaction untuk atomic check-and-decrement stok, atau minimal gunakan `.update({ stock: newStock }).eq('id', product.id).gt('stock', 0)` dan cek hasilnya.

---

### 🟠 BUG-11 — Auto-tab Berubah Berdasarkan Scroll Tanpa Interaksi User
**File:** `src/app/product/[slug]/page.js`  
**Kode Bermasalah:**
```js
useEffect(() => {
  const handleScroll = () => {
    if (window.scrollY > 800) setActiveTab('ulasan')  // ← AUTO SWITCH!
    else setActiveTab('detail')
  }
  window.addEventListener('scroll', handleScroll)
}, [])
```
**Dampak:** Tab aktif di halaman detail produk berubah-ubah sendiri saat user scroll, meskipun mereka tidak mengklik tab apapun. Ini merusak UX karena user bisa tidak mengerti kenapa tampilan berubah sendiri.  
**Fix:** Pisahkan state `activeTab` dari `isSticky`. Biarkan `isSticky` dikendalikan scroll, tapi jangan ubah `activeTab` secara otomatis.

---

### 🟠 BUG-12 — `addToCart` saat Item Existing: Bug Qty Ganda di Supabase
**File:** `src/lib/store.js`  
**Kode Bermasalah:**
```js
if (existing && existing.dbId) {
  await supabase.from('cart_items')
    .update({ qty: existing.qty + qty })
    .eq('id', existing.dbId)
} else {
  await supabase.from('cart_items').insert([{
    qty: existing ? existing.qty + qty : qty  // ← Bug di sini
  }])
}
```
**Dampak:** Jika item sudah ada di cart tapi belum punya `dbId` (belum tersync ke Supabase), maka kode akan masuk ke blok `else` dan menginsert item baru. Ini akan menyebabkan duplikasi item di tabel `cart_items`.  
**Fix:** Pastikan `dbId` selalu di-set saat `syncCartFromSupabase`, dan tangani kasus `existing && !existing.dbId` secara terpisah.

---

## 🟡 MINOR BUGS & UX ISSUES

---

### 🟡 BUG-13 — Notifikasi Navbar Selalu Kosong (Hardcoded "0 New")
**File:** `src/components/Navbar.js`  
**Kode Bermasalah:**
```jsx
<span>NOTIFICATIONS</span>
<span>0 New</span>  {/* Hardcoded! */}
<p>No notifications yet</p>
```
**Dampak:** Fitur notifikasi di navbar tidak berfungsi sama sekali. Selalu menampilkan "0 New" dan "No notifications yet" meskipun ada notifikasi.  
**Fix:** Fetch data dari tabel `notifications` dengan filter berdasarkan `user_id` dan tampilkan secara dinamis.

---

### 🟡 BUG-14 — "Lupa Password" Tidak Berfungsi (Hanya Toast)
**File:** `src/app/auth/page.js`  
**Kode Bermasalah:**
```jsx
<a href="#" onClick={(e) => { 
  e.preventDefault(); 
  showToast('Silakan hubungi admin untuk reset password', 'info'); 
}}>
  Lupa password?
</a>
```
**Dampak:** Fitur reset password tidak ada implementasinya. User yang lupa password harus menghubungi admin secara manual — sangat buruk untuk UX.  
**Fix:** Implementasikan `supabase.auth.resetPasswordForEmail(email)` yang sudah tersedia gratis di Supabase Auth.

---

### 🟡 BUG-15 — `terjualCount` Dihitung dari Jumlah Review, Bukan Data Asli
**File:** `src/app/product/[slug]/page.js`  
**Kode Bermasalah:**
```js
const terjualCount = reviewCount > 0 ? reviewCount * 3 + 15 : 0;
```
**Dampak:** Jumlah "Terjual" di halaman produk adalah **data palsu** (review × 3 + 15). Ini menyesatkan user. Seharusnya dihitung dari tabel `order_items`.  
**Fix:** Tambahkan kolom `sold_count` di tabel `products` yang diupdate setiap checkout, atau query aggregate dari `order_items`.

---

### 🟡 BUG-16 — Ongkir JNE & GoSend Hardcoded Rp 15.000 Tanpa Kalkulasi Real
**File:** `src/app/checkout/page.js`  
**Kode Bermasalah:**
```js
let shippingFee = courier === "Ambil Sendiri" ? 0 : 15000 // Simplified flat fee for now
```
**Dampak:** Pilihan kurir JNE Reguler dan GoSend Instant keduanya sama-sama dikenakan Rp 15.000 — tidak ada perbedaan harga, tidak ada kalkulasi berdasarkan jarak/berat.  
**Fix:** Integrasikan API ongkir (RajaOngkir/Shipper) atau minimal bedakan harga per kurir.

---

### 🟡 BUG-17 — Payment Method di Checkout: Hanya COD Aktif, Yang Lain Disabled tapi Tetap Tampil
**File:** `src/app/checkout/page.js`  
**Kode Bermasalah:**
```jsx
<option disabled>BCA Virtual Account</option>
<option disabled>Indomaret / Alfamart</option>
```
**Dampak:** Tampilan memberikan kesan bahwa ada pilihan pembayaran lain padahal tidak bisa dipilih. Ini membingungkan user dan menurunkan kepercayaan.  
**Fix:** Sembunyikan opsi yang belum tersedia atau tampilkan label "Segera Hadir" yang jelas.

---

### 🟡 BUG-18 — Tidak Ada Middleware untuk Melindungi Halaman `/profile` & `/keranjang`
**File:** Tidak ada `src/middleware.js`  
**Dampak:** Halaman profil, keranjang, dan checkout bisa diakses tanpa login (hanya state kosong yang tampil). Tidak ada redirect otomatis ke `/auth`. Meski ada pengecekan di beberapa komponen, tidak konsisten dan bisa di-bypass.  
**Fix:** Buat `src/middleware.js` dengan `createServerClient` Supabase untuk protect semua route private.

---

### 🟡 BUG-19 — `syncCartFromSupabase` Me-map `variant_id` sebagai `name` (Data Tidak Akurat)
**File:** `src/lib/store.js`  
**Kode Bermasalah:**
```js
variant: item.variant_id ? { id: item.variant_id, name: item.variant_id } : null
//                                                       ^^^^^^^^^^^^^^^^
//                                                       Seharusnya variant name, bukan ID!
```
**Dampak:** Setelah page refresh / login ulang, nama varian produk di keranjang akan menampilkan `variant_id` (misal: `"abc123"`) bukan nama varian yang sebenarnya (misal: `"500ml"`). Tampilan cart jadi kacau.  
**Fix:** Simpan `variant_name` di tabel `cart_items`, atau fetch data varian dari tabel `products` saat sync.

---

### 🟡 BUG-20 — Dashboard Layout Menggunakan Font Awesome via CDN (Tidak Di-import Resmi)
**File:** `src/app/dashboard/layout.js`  
**Kode Bermasalah:**  
Menu icons menggunakan class `fa-chart-pie`, `fa-shopping-bag`, dll. yang hanya bekerja jika Font Awesome dimuat via CDN/link di HTML. Tidak ada import Font Awesome di `package.json` maupun di `layout.js`.  
**Dampak:** Ikon di sidebar dashboard tidak akan tampil jika CDN Font Awesome tidak di-load secara eksplisit di `<head>`.  
**Fix:** Install `@fortawesome/react-fontawesome` atau ganti ke `lucide-react` yang sudah ada di `package.json`.

---

### 🟡 BUG-21 — Auto-Reply Bot Hanya Untuk Pesan Pertama (Logic Salah)
**File:** `src/components/FloatingChat.js`  
**Kode Bermasalah:**
```js
if (chatHistory.length === 0) {
  setTimeout(async () => {
    await supabase.from('chat_messages').insert({ sender: 'bot', ... })
  }, 1500)
}
```
**Dampak:** Auto-reply hanya muncul sekali di awal. Jika `chatHistory` sudah lebih dari 0 (artinya sudah ada riwayat chat), maka auto-reply tidak pernah muncul lagi untuk user baru yang mengirim pesan pertama mereka tapi sudah punya riwayat dari sesi sebelumnya.  
**Fix:** Logika auto-reply sebaiknya berdasarkan kondisi lain, misalnya: apakah dalam sesi ini belum ada balasan admin.

---

### 🟡 BUG-22 — `showToast` dengan type `"warn"` & `"danger"` Tidak Konsisten
**File:** `src/components/FloatingChat.js` & `src/lib/store.js`  
**Kode Bermasalah:**
```js
showToast("Silakan Masuk...", "warn")   // FloatingChat.js
showToast("Gagal mengirim pesan", "danger")  // FloatingChat.js
// Tapi di UIStore, type yang valid adalah: 'success' | 'error' | 'info'
```
**Dampak:** Toast dengan type `"warn"` atau `"danger"` akan dirender dengan style default (bukan warna yang dimaksud), karena `Toast.js` hanya mengenal tipe yang terdaftar.  
**Fix:** Standardisasi tipe toast menjadi `'success' | 'error' | 'info' | 'warn'` dan pastikan `Toast.js` menangani semua tipe.

---

### 🟡 BUG-23 — `makeSlug` di `ProductCard.js` & `product/[slug]/page.js` Berbeda Implementasi
**File:** `src/components/ProductCard.js` vs `src/app/product/[slug]/page.js`  
**Kode Bermasalah:**
- `ProductCard.js`: `name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + id`
- `product/[slug]`: `name.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + id`

**Dampak:** Slug yang di-generate bisa berbeda antara card dan halaman detail (terutama untuk nama produk yang diawali/diakhiri karakter non-alphanumeric), menyebabkan link tidak ditemukan (404).  
**Fix:** Pindahkan fungsi `makeSlug` ke `src/lib/utils.js` sebagai shared utility agar konsisten.

---

## ⚪ KEKURANGAN FITUR (Feature Gaps)

---

### ⚪ GAP-01 — Tidak Ada `middleware.js` (Keamanan Route)
Tidak ada file `src/middleware.js`. Semua proteksi route dilakukan di client-side, yang bisa di-bypass.

### ⚪ GAP-02 — Tidak Ada Konfirmasi Email Setelah Registrasi Diimplementasikan dengan Benar
Flow email verification ada di UI, tapi tidak ada halaman `/auth/verify` untuk memandu user.

### ⚪ GAP-03 — Tidak Ada Pagination di Halaman Admin (Orders, Products, Users)
Semua data ditampilkan sekaligus tanpa pagination, akan sangat lambat di production.

### ⚪ GAP-04 — Tidak Ada Fitur Search di Dashboard Admin
Dashboard admin tidak memiliki fitur search/filter untuk order, produk, atau user.

### ⚪ GAP-05 — Tidak Ada Optimistic UI Rollback Saat Error Supabase
Saat sync ke Supabase gagal (cart, wishlist), state lokal sudah berubah tapi tidak di-rollback. Menyebabkan inkonsistensi antara UI dan database.

### ⚪ GAP-06 — Rating Produk di `products` Table Tidak Di-update Setelah Review Masuk
Kolom `rating` di tabel produk tidak pernah diupdate secara otomatis saat user memberikan ulasan.

### ⚪ GAP-07 — Tidak Ada Error Boundary
Tidak ada React Error Boundary. Jika satu komponen crash (misalnya Supabase error), seluruh halaman akan blank/white screen.

### ⚪ GAP-08 — Laporan Keuangan Tidak Memiliki Export Fitur
Halaman `/dashboard/finance` tidak bisa export ke PDF/Excel, padahal ini fitur umum untuk laporan keuangan toko.

---

## 📊 Ringkasan

| Kategori | Jumlah |
|---|---|
| 🔴 Critical Bug | 5 |
| 🟠 Major Bug | 7 |
| 🟡 Minor Bug / UX | 9 |
| ⚪ Feature Gap | 8 |
| **Total** | **29** |

---

## 🛠️ Prioritas Perbaikan (Rekomendasi Urutan)

1. **BUG-05** — Tambahkan `middleware.js` untuk proteksi dashboard (Security Critical)
2. **BUG-09** — Fix query orders di profil (Data Privacy)
3. **BUG-10** — Atomic stock decrement (Race Condition)
4. **BUG-08** — Kurangi `used_count` voucher setelah checkout
5. **BUG-01** — Hapus duplicate `session` key di store
6. **BUG-02** — Fix logic `setIsSavingAddress` di finally block
7. **BUG-06** — Relax validasi email (bukan hanya @gmail.com)
8. **BUG-19** — Fix variant name mapping di syncCartFromSupabase
9. **BUG-03** — Fix broken image URLs di Navbar
10. **BUG-14** — Implementasi reset password via Supabase
