"use client"
import { useStore, useUIStore } from "@/lib/store"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
    const router = useRouter()
    const { cart, removeFromCart, updateQuantity, clearCart } = useStore()
    const showToast = useUIStore((state) => state.showToast)

    const [paymentMethod, setPaymentMethod] = useState("")
    const [courier, setCourier] = useState("Ambil Sendiri")
    const [voucher, setVoucher] = useState("")
    const [buyerName, setBuyerName] = useState("")

    const cartItemCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0)

    // Calculate Totals
    const subtotal = Object.values(cart).reduce((sum, item) => sum + (item.price * item.qty), 0)
    const tax = subtotal * 0.10

    let adminFee = 0
    if (paymentMethod === "QRIS") adminFee = 2500
    if (paymentMethod === "Debit") adminFee = 4000

    let shippingFee = 0 // simplified for now, need map logic later
    let discount = 0
    if (voucher.toUpperCase() === "HEMAT10") {
        discount = subtotal * 0.10
    }

    const total = subtotal + tax + shippingFee + adminFee - discount

    const handleCheckout = () => {
        if (!buyerName) {
            showToast("Nama penerima belum diisi!", "error")
            return
        }
        if (Object.keys(cart).length === 0) {
            showToast("Keranjang belanja masih kosong!", "error")
            return
        }
        showToast("Checkout berhasil! Namun karena belum terhubung ke database pesanan, data akan diriset.", "success")
        clearCart()
        router.push('/invoice')
    }

    return (
        <main className="contentArea" id="mainContent">
            <div className="card sectionPad">
                <div className="titleRow">
                    <div>
                        <h3 className="h1">Keranjang - Buat Manifest Transaksi</h3>
                        <div className="p">Atur data pembeli, kurir, pembayaran, voucher, dan checkout. Setelah selesai,
                            lihat status di tab Invoice.</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <Link href="/">
                            <button className="btn btnOutline">
                                <i className="fas fa-plus"></i> Tambah Produk
                            </button>
                        </Link>
                        <button className="btn btnDanger" onClick={clearCart}>
                            <i className="fas fa-trash"></i> Kosongkan Keranjang
                        </button>
                    </div>
                </div>

                <div className="grid2" style={{ marginTop: '14px' }}>
                    {/* KIRI: FORM */}
                    <div className="card sectionPad" style={{ borderRadius: '18px' }}>
                        <h3 className="h1" style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Form Manifest</h3>
                        <div className="formGrid" style={{ gap: '16px', marginTop: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div className="label" style={{ marginTop: 0 }}>Nama Konsumen / Penerima</div>
                                <input
                                    className="input"
                                    id="buyerName"
                                    placeholder="Nama penerima..."
                                    value={buyerName}
                                    onChange={(e) => setBuyerName(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div className="label" style={{ marginTop: 0 }}>Metode Pembayaran</div>
                                <select
                                    className="select"
                                    id="paymentMethod"
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                >
                                    <option value="" disabled>Pilih kanal pembayaran...</option>
                                    <option value="COD">COD (Bayar di tempat)</option>
                                    <option value="QRIS">QRIS (biaya admin)</option>
                                    <option value="Debit">Transfer Debit (biaya admin)</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div className="label" style={{ marginTop: 0 }}>Pilihan Kurir</div>
                                <select
                                    className="select"
                                    id="courierSelect"
                                    value={courier}
                                    onChange={(e) => setCourier(e.target.value)}
                                >
                                    <option value="Ambil Sendiri">Ambil Sendiri (tanpa ongkir)</option>
                                    <option value="JNE Reguler">JNE Reguler (Rp 3.000/km)</option>
                                    <option value="J&T Express">J&T Express (Rp 4.000/km)</option>
                                    <option value="GrabExpress">GrabExpress SameDay (Rp 6.000/km)</option>
                                    <option value="GoSend">GoSend Premium Instant (Rp 8.000/km)</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div className="label" style={{ marginTop: 0 }}>Voucher (opsional)</div>
                                <input
                                    className="input"
                                    id="voucherInput"
                                    placeholder="Contoh: HEMAT10"
                                    value={voucher}
                                    onChange={(e) => setVoucher(e.target.value)}
                                />
                            </div>
                        </div>

                        {courier !== "Ambil Sendiri" && (
                            <div id="mapArea" style={{ marginTop: '12px' }}>
                                <div className="label">Alamat lengkap</div>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <input className="input" id="alamatLengkap" style={{ flex: 1 }} placeholder="Masukkan alamat/jalan/kota..." />
                                    <button className="btn btnPrimary" onClick={() => showToast("Integrasi Leaflet Map belum aktif!", "info")}>
                                        <i className="fas fa-search-location"></i> Cari
                                    </button>
                                </div>
                                <div className="mapBox" id="mapBox" style={{ marginTop: '10px', background: '#e5e7eb', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    [ Peta akan muncul di sini ]
                                </div>
                                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span className="badge" id="shipLive"><i className="fas fa-route"></i> Jarak: 0 km | Ongkir: Rp 0</span>
                                    <span className="p" style={{ margin: 0 }}>Klik peta untuk set titik rumah. Marker bisa digeser.</span>
                                </div>
                                <div className="label" style={{ marginTop: '10px' }}>Catatan patokan (opsional)</div>
                                <input className="input" id="houseBenchmark" placeholder="Contoh: pagar hitam depan mushola" />
                            </div>
                        )}
                    </div>

                    {/* KANAN: KERANJANG & RINGKASAN */}
                    <div className="card sectionPad" style={{ borderRadius: '18px' }}>
                        <div className="titleRow">
                            <div>
                                <h3 className="h1" style={{ fontSize: '1.05rem', margin: 0 }}>Keranjang</h3>
                                <div className="p" style={{ margin: '6px 0 0' }}>Atur qty &amp; hapus item di sini.</div>
                            </div>
                            <span className="badge"><i className="fas fa-box"></i> Item: <span>{cartItemCount}</span></span>
                        </div>

                        <div className="cartList" id="cartList" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {Object.keys(cart).length === 0 ? (
                                <div className="p" style={{ textAlign: 'center', padding: '40px 0', background: '#f8fafc', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                                    <i className="fas fa-shopping-basket" style={{ fontSize: '2rem', color: 'var(--border)', marginBottom: '10px' }}></i>
                                    <div style={{ fontWeight: 700 }}>Keranjang masih kosong</div>
                                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Yuk, tambah produk dari Etalase!</div>
                                </div>
                            ) : (
                                Object.values(cart).map(item => (
                                    <div key={item.id} style={{ display: 'flex', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)', alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>{item.name}</div>
                                            <div style={{ color: 'var(--secondary)', fontWeight: 800, marginTop: '4px' }}>Rp {item.price.toLocaleString('id-ID')}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '4px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                                            <button className="qtyMiniBtn" style={{ border: 'none', background: '#f1f5f9' }} onClick={() => updateQuantity(item.id, item.qty - 1)}>-</button>
                                            <span style={{ fontWeight: 900, width: '28px', textAlign: 'center' }}>{item.qty}</span>
                                            <button className="qtyMiniBtn" style={{ border: 'none', background: '#f1f5f9' }} onClick={() => updateQuantity(item.id, item.qty + 1)}>+</button>
                                        </div>
                                        <button className="btn btnDanger" style={{ padding: '8px 12px', borderRadius: '12px' }} onClick={() => removeFromCart(item.id)}>
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {Object.keys(cart).length > 0 && (
                            <div className="summary" id="summaryBox" style={{ marginTop: '16px' }}>
                                <div className="sumRow muted" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Subtotal</span><span>Rp {subtotal.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="sumRow muted" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>PPN 10%</span><span>Rp {tax.toLocaleString('id-ID')}</span>
                                </div>
                                {shippingFee > 0 && (
                                    <div className="sumRow muted" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Ongkir</span><span>Rp {shippingFee.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                {adminFee > 0 && (
                                    <div className="sumRow muted" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Biaya Admin</span><span>Rp {adminFee.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                {discount > 0 && (
                                    <div className="sumRow" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', fontWeight: 800 }}>
                                        <span>Potongan Voucher</span><span>- Rp {discount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <div className="sumRow sumTotal" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed var(--border)', paddingTop: '10px', marginTop: '10px', fontSize: '1.1rem', fontWeight: 900 }}>
                                    <span>Total</span><span>Rp {total.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        )}

                        <button
                            className="btn btnPrimary"
                            id="btnCheckout"
                            style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                            onClick={handleCheckout}
                            disabled={Object.keys(cart).length === 0}
                        >
                            <i className="fas fa-credit-card"></i> Selesaikan Manifest Transaksi
                        </button>
                    </div>
                </div>
            </div>
        </main>
    )
}
