"use client"
import { useStore, useUIStore } from "@/lib/store"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabaseClient"
import Loading from "@/app/loading"

export default function CheckoutPage() {
    const router = useRouter()
    const { cart, selectedForCheckout, appliedVoucher, clearAppliedVoucher, removeFromCart, clearCart, session } = useStore()
    const showToast = useUIStore((state) => state.showToast)
    const supabase = createClient()

    const [courier, setCourier] = useState("Ambil Sendiri")
    const [buyerName, setBuyerName] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)

    const [products, setProducts] = useState([])
    const [loadingProducts, setLoadingProducts] = useState(true)

    useEffect(() => {
        if (selectedForCheckout.length === 0) {
            router.replace('/keranjang')
            return
        }

        async function fetchProducts() {
            const { data } = await supabase.from('products').select('*')
            if (data) setProducts(data)
            setLoadingProducts(false)
        }
        fetchProducts()
    }, [selectedForCheckout, router])

    const checkoutItems = cart.filter(item => selectedForCheckout.includes(item.uniqueId || item.productId))

    const enrichedCheckout = checkoutItems.map(item => {
        const product = products.find(p => p.id === item.productId)
        const isVariant = !!item.variant
        return {
            ...item,
            id: item.uniqueId || item.productId,
            productId: item.productId,
            name: product ? (isVariant ? `${product.name} - ${item.variant.name}` : product.name) : 'Produk Tidak Ditemukan',
            price: product ? (isVariant ? Number(item.variant.price) : product.price) : 0,
            image_url: product ? product.image_url : null,
            max_stock: product ? (isVariant ? Number(item.variant.stock) : Number(product.stock)) : 0
        }
    }).filter(item => item.price > 0)

    const cartItemCount = enrichedCheckout.reduce((sum, item) => sum + item.qty, 0)
    const subtotal = enrichedCheckout.reduce((sum, item) => sum + (item.price * item.qty), 0)
    const tax = subtotal * 0.10

    let adminFee = 0

    let shippingFee = courier === "Ambil Sendiri" ? 0 : 15000 // Simplified flat fee for now
    
    let discount = 0
    if (appliedVoucher) {
        if (appliedVoucher.discount_type === 'percent') {
            const calculatedPercent = Math.round(subtotal * (appliedVoucher.discount_amount / 100))
            if (appliedVoucher.max_discount && calculatedPercent > appliedVoucher.max_discount) {
                discount = appliedVoucher.max_discount
            } else {
                discount = calculatedPercent
            }
        } else {
            discount = appliedVoucher.discount_amount
        }
    }

    let total = subtotal + tax + shippingFee + adminFee - discount
    if (total < 0) total = 0

    const handleCheckout = async () => {
        if (!session?.user?.id) {
            showToast("Silakan login terlebih dahulu untuk membuat pesanan.", "error")
            return
        }

        if (!buyerName) {
            showToast("Nama penerima belum diisi!", "error")
            return
        }

        setIsProcessing(true)

        // Cek stok
        const outOfStockItems = enrichedCheckout.filter(item => {
            const currentStock = products.find(p => p.id === item.productId)?.stock || 0
            return currentStock < item.qty
        })

        if (outOfStockItems.length > 0) {
            const itemNames = outOfStockItems.map(i => i.name).join(", ")
            showToast(`Maaf, stok tidak cukup untuk: ${itemNames}.`, "error")
            setIsProcessing(false)
            return
        }
        
        const orderPayload = {
            buyer_name: buyerName,
            payment_method: 'Transfer / COD',
            courier: courier,
            total_amount: total,
            status: 'Belum Bayar',
            user_id: session?.user?.id || null
        }

        const { data, error } = await supabase.from('orders').insert([orderPayload]).select()

        if (error) {
            console.error("Supabase Insert Error:", error)
            showToast("Gagal membuat pesanan, silakan coba lagi.", "error")
            setIsProcessing(false)
            return
        }

        const insertedOrder = data?.[0]
        if (insertedOrder) {
            const orderItemsPayload = enrichedCheckout.map(item => ({
                order_id: insertedOrder.id,
                product_id: item.productId,
                quantity: item.qty,
                price_at_purchase: item.price
            }))
            await supabase.from('order_items').insert(orderItemsPayload)
        }

        // Kurangi stok
        const stockUpdates = enrichedCheckout.map(item => {
            const product = products.find(p => p.id === item.productId)
            if (!product) return null
            
            if (item.variant) {
                const updatedVariants = product.variants.map(v => 
                    v.id === item.variant.id ? { ...v, stock: Math.max(0, v.stock - item.qty) } : v
                )
                const newTotalStock = Math.max(0, product.stock - item.qty)
                return supabase.from('products').update({ stock: newTotalStock, variants: updatedVariants }).eq('id', product.id)
            } else {
                const newStock = Math.max(0, product.stock - item.qty)
                return supabase.from('products').update({ stock: newStock }).eq('id', product.id)
            }
        }).filter(Boolean)

        await Promise.all(stockUpdates)

        await supabase.from('notifications').insert([{
            title: `Pesanan Baru`,
            message: `Pesanan baru dari ${buyerName} senilai Rp ${total.toLocaleString('id-ID')}.`,
            type: 'Order',
            unread: true
        }])

        // Hapus dari keranjang barang yang di checkout saja
        checkoutItems.forEach(item => removeFromCart(item.uniqueId || item.productId))
        clearAppliedVoucher()

        setIsProcessing(false)
        showToast("Pesanan berhasil dibuat!", "success")
        router.push('/profile') 
    }

    if (loadingProducts) return <Loading />

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '40px 0' }}>
            <main className="contentArea" id="mainContent" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px', color: 'var(--dark)' }}>Checkout</h1>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                
                {/* KIRI: ALAMAT & PESANAN */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* CARD: ALAMAT PENGIRIMAN */}
                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', padding: '24px' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Alamat Pengiriman</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <i className="fas fa-map-marker-alt" style={{ color: '#10b981' }}></i>
                                    <span style={{ fontWeight: 800, color: 'var(--dark)' }}>Rumah • {buyerName || session?.user?.user_metadata?.full_name || 'Pembeli Sembako'}</span>
                                </div>
                                <div style={{ color: 'var(--dark)', lineHeight: '1.5', fontSize: '0.95rem' }}>
                                    Jl. Contoh Alamat No. 123, Kelurahan, Kecamatan, Kota, Provinsi, 12345
                                </div>
                                <div style={{ marginTop: '12px' }}>
                                    <input 
                                        className="input" 
                                        placeholder="Ketik nama penerima pesanan ini..." 
                                        value={buyerName} 
                                        onChange={(e) => setBuyerName(e.target.value)} 
                                        style={{ padding: '8px 12px', fontSize: '0.9rem', width: '300px' }}
                                    />
                                </div>
                            </div>
                            <button style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '6px 16px', borderRadius: '8px', fontWeight: 700, color: 'var(--dark)', cursor: 'pointer' }}>Ganti</button>
                        </div>
                    </div>

                    {/* CARD: PESANAN */}
                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', padding: '24px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--dark)', marginBottom: '20px', fontSize: '1.05rem' }}>Sembako Berkah</div>
                        
                        {enrichedCheckout.map((item, index) => (
                            <div key={item.id} style={{ display: 'flex', gap: '16px', marginBottom: '20px', paddingBottom: index < enrichedCheckout.length - 1 ? '20px' : '0', borderBottom: index < enrichedCheckout.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <img src={item.image_url || '/placeholder.png'} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '1rem', color: 'var(--dark)', lineHeight: '1.4' }}>{item.name}</div>
                                    <div style={{ fontWeight: 800, color: 'var(--dark)', marginTop: '4px' }}>{item.qty} x Rp {item.price.toLocaleString('id-ID')}</div>
                                </div>
                            </div>
                        ))}

                        <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '16px', paddingTop: '20px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <select className="select" value={courier} onChange={(e) => setCourier(e.target.value)} style={{ padding: '12px', fontSize: '0.95rem', fontWeight: 600, width: '100%' }}>
                                        <option value="Ambil Sendiri">Ambil Sendiri (Rp 0)</option>
                                        <option value="JNE Reguler">JNE Reguler (Estimasi tiba besok)</option>
                                        <option value="GoSend">GoSend Instant (Estimasi tiba hari ini)</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                                <input type="checkbox" checked readOnly style={{ accentColor: '#10b981', width: '18px', height: '18px' }} />
                                <span style={{ fontSize: '0.9rem', color: 'var(--dark)' }}>Pakai Asuransi Pengiriman <span style={{ color: 'var(--muted)' }}>(Rp 0)</span></span>
                            </div>
                            <div style={{ marginTop: '16px' }}>
                                <input className="input" placeholder="Kasih Catatan" style={{ border: 'none', borderBottom: '1px solid #e2e8f0', borderRadius: 0, padding: '8px 0', fontSize: '0.95rem' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* KANAN: PAYMENT & RINGKASAN */}
                <div style={{ width: '350px', flexShrink: 0, position: 'sticky', top: '100px' }}>
                    
                    {/* PAYMENT METHOD */}
                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', padding: '20px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <i className="fas fa-money-bill-wave" style={{ color: '#10b981', fontSize: '1.2rem' }}></i>
                                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Cash on Delivery (COD)</span>
                                </div>
                                <input type="radio" name="payment" value="COD" checked={true} readOnly style={{ accentColor: '#10b981', width: '18px', height: '18px' }} />
                            </label>
                            {/* Disabled other methods to match the 'only COD' requirement */}
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'not-allowed', opacity: 0.4 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <i className="fas fa-university" style={{ color: '#94a3b8', fontSize: '1.2rem' }}></i>
                                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>BCA Virtual Account</span>
                                </div>
                                <input type="radio" disabled />
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'not-allowed', opacity: 0.4 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <i className="fas fa-store" style={{ color: '#94a3b8', fontSize: '1.2rem' }}></i>
                                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Indomaret / Alfamart</span>
                                </div>
                                <input type="radio" disabled />
                            </label>
                        </div>
                    </div>

                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', padding: '20px' }}>
                        
                        {/* PROMO BANNER */}
                        {appliedVoucher ? (
                            <div style={{ background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '1.2rem' }}></i>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--dark)', fontWeight: 800 }}>Promo {appliedVoucher.code} Terpasang!</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Kamu hemat {discount.toLocaleString('id-ID')}</div>
                                    </div>
                                </div>
                                <i className="fas fa-times" style={{ color: '#ef4444', fontSize: '1rem', cursor: 'pointer' }} onClick={clearAppliedVoucher}></i>
                            </div>
                        ) : (
                            <div style={{ background: '#ecfdf5', border: '1px dashed #10b981', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700 }}>Kembali ke Keranjang untuk masukkan promo</span>
                            </div>
                        )}

                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dark)', margin: '0 0 16px 0' }}>Cek ringkasan transaksimu, yuk</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.95rem' }}>
                                <span>Total Harga ({cartItemCount} Barang)</span><span>Rp {subtotal.toLocaleString('id-ID')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.95rem' }}>
                                <span>Total Ongkos Kirim</span><span>Rp {shippingFee.toLocaleString('id-ID')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.95rem', cursor: 'pointer' }}>
                                <span>Total Pajak/Layanan</span><span>Rp {tax.toLocaleString('id-ID')}</span>
                            </div>
                            {discount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontSize: '0.95rem', fontWeight: 700 }}>
                                    <span>Total Diskon</span><span>-Rp {discount.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '1.1rem', fontWeight: 900, color: 'var(--dark)' }}>
                            <span>Total Tagihan</span><span>Rp {total.toLocaleString('id-ID')}</span>
                        </div>

                        <button 
                            className="btn btnPrimary" 
                            style={{ width: '100%', marginTop: '20px', padding: '14px', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 800, justifyContent: 'center' }} 
                            onClick={handleCheckout} 
                            disabled={isProcessing}
                        >
                            {isProcessing ? "Memproses..." : "Bayar Sekarang"}
                        </button>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center', marginTop: '12px', lineHeight: '1.4' }}>
                            Dengan melanjutkan pembayaran, kamu menyetujui S&K Asuransi Pengiriman & Proteksi
                        </div>
                    </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
