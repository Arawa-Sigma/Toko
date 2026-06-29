"use client"
import { useStore, useUIStore } from "@/lib/store"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabaseClient"
import Loading from "@/app/loading"
import dynamic from 'next/dynamic'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false, loading: () => <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}><i className="fas fa-spinner fa-spin"></i> &nbsp; Memuat Peta...</div> })

export default function CheckoutPage() {
    const router = useRouter()
    const { cart, selectedForCheckout, appliedVoucher, clearAppliedVoucher, removeFromCart, clearCart, session } = useStore()
    const showToast = useUIStore((state) => state.showToast)
    const supabase = createClient()

    const [courier, setCourier] = useState("Ambil Sendiri")
    const [buyerName, setBuyerName] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [useInsurance, setUseInsurance] = useState(true)

    const addresses = session?.user?.user_metadata?.addresses || []
    const [selectedAddressIndex, setSelectedAddressIndex] = useState(0)
    const [showAddressModal, setShowAddressModal] = useState(false)
    
    // Add Address State
    const [showAddAddressForm, setShowAddAddressForm] = useState(false)
    const [newAddress, setNewAddress] = useState({ id: null, name: "", phone: "", region: "", street: "", detail: "", label: "Rumah", isPrimary: false, coordinates: null })
    const [isSavingAddress, setIsSavingAddress] = useState(false)
    const [formErrors, setFormErrors] = useState({})
    const [mapModalOpen, setMapModalOpen] = useState(false)
    const [tempCoordinates, setTempCoordinates] = useState(null)

    const [products, setProducts] = useState([])
    const [loadingProducts, setLoadingProducts] = useState(true)

    const handleSaveNewAddress = async () => {
        const errors = {}
        if (!newAddress.name) errors.name = "Nama lengkap harus diisi"
        if (!newAddress.phone) errors.phone = "Nomor telepon harus diisi"
        else if (!newAddress.phone.startsWith("08")) errors.phone = "Nomor telepon harus diawali dengan '08'"
        else if (newAddress.phone.length < 10 || newAddress.phone.length > 13) errors.phone = "Nomor telepon harus 10-13 digit"
        if (!newAddress.region) errors.region = "Provinsi, Kota, Kecamatan harus diisi"
        if (!newAddress.street) errors.street = "Alamat lengkap harus diisi"

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors)
            return
        }
        
        setFormErrors({})
        try {
            setIsSavingAddress(true)
            let updatedAddresses = [...addresses]
            const addrToAdd = { 
                ...newAddress, 
                id: Date.now().toString(),
                isPrimary: addresses.length === 0 ? true : newAddress.isPrimary 
            }
            updatedAddresses.push(addrToAdd)
            
            const updates = { addresses: updatedAddresses }
            const { error } = await supabase.auth.updateUser({ data: updates })
            if (error) throw error
            
            // Sync session
            const { data: sessionData } = await supabase.auth.getSession()
            if (sessionData?.session) {
                // Not calling setSession because it's in store.js, just reload for simplicity or rely on store if we have an action for it.
                // Wait, useStore.getState().setSession is better
                useStore.getState().setSession(sessionData.session)
            }
            
            setNewAddress({ id: null, name: "", phone: "", region: "", street: "", detail: "", label: "Rumah", isPrimary: false, coordinates: null })
            setShowAddAddressForm(false)
            setSelectedAddressIndex(updatedAddresses.length - 1)
            showToast("Alamat berhasil ditambahkan!", "success")
        } catch (error) {
            console.error("Error saving address:", error)
            showToast(`Gagal menyimpan alamat: ${error.message}`, "error")
        } finally {
            setIsSavingAddress(true) // Should be false
            setIsSavingAddress(false)
        }
    }

    useEffect(() => {
        if (addresses.length > 0 && addresses[selectedAddressIndex]) {
            setBuyerName(addresses[selectedAddressIndex].name)
        } else if (session?.user?.user_metadata?.full_name) {
            setBuyerName(session?.user?.user_metadata?.full_name)
        }
    }, [selectedAddressIndex, session?.user?.user_metadata])

    useEffect(() => {
        if (selectedForCheckout.length === 0) {
            router.replace('/keranjang')
            return
        }

        async function fetchProducts() {
            const checkoutItemIds = cart
                .filter(item => selectedForCheckout.includes(item.uniqueId || item.productId))
                .map(item => item.productId)
                
            if (checkoutItemIds.length === 0) return
            
            const { data } = await supabase.from('products').select('*').in('id', checkoutItemIds)
            if (data) setProducts(data)
            setLoadingProducts(false)
        }
        fetchProducts()
    }, [selectedForCheckout, router, cart])

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
    let insuranceFee = useInsurance ? 2000 : 0
    let shippingFee = 0
    if (courier !== "Ambil Sendiri") {
        let baseOngkir = courier === "GoSend" ? 20000 : 10000;
        if (addresses.length > 0 && addresses[selectedAddressIndex]) {
            const regionStr = addresses[selectedAddressIndex].region || "";
            const extraFee = (regionStr.length % 5) * 2000;
            shippingFee = baseOngkir + extraFee;
        } else {
            shippingFee = baseOngkir;
        }
    }
    
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

    let total = subtotal + tax + shippingFee + adminFee + insuranceFee - discount
    if (total < 0) total = 0

    const handleCheckout = async () => {
        if (!session?.user?.id) {
            showToast("Silakan login terlebih dahulu untuk membuat pesanan.", "error")
            return
        }

        if (enrichedCheckout.length === 0) {
            showToast("Tidak ada barang untuk di checkout!", "error")
            return
        }

        if (courier !== "Ambil Sendiri" && (!addresses || addresses.length === 0 || !addresses[selectedAddressIndex])) {
            showToast("Alamat pengiriman belum dipilih!", "error")
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
                <div className="checkout-layout" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                
                {/* KIRI: ALAMAT & PESANAN */}
                <div className="checkout-left" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
                    
                    {/* CARD: ALAMAT PENGIRIMAN */}
                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', padding: '24px' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Alamat Pengiriman</h3>
                        <div className="address-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, paddingRight: '20px' }}>
                                {addresses.length > 0 && addresses[selectedAddressIndex] ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <i className="fas fa-map-marker-alt" style={{ color: '#10b981' }}></i>
                                            <span style={{ fontWeight: 800, color: 'var(--dark)' }}>
                                                {addresses[selectedAddressIndex].label || 'Alamat'} • {addresses[selectedAddressIndex].name}
                                            </span>
                                        </div>
                                        <div style={{ color: 'var(--dark)', lineHeight: '1.5', fontSize: '0.95rem' }}>
                                            {addresses[selectedAddressIndex].phone} <br/>
                                            {addresses[selectedAddressIndex].street}
                                            {addresses[selectedAddressIndex].detail ? `, ${addresses[selectedAddressIndex].detail}` : ''}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <i className="fas fa-exclamation-circle" style={{ color: '#f59e0b' }}></i>
                                            <span style={{ fontWeight: 800, color: 'var(--dark)' }}>Belum ada alamat</span>
                                        </div>
                                        <div style={{ color: 'var(--muted)', lineHeight: '1.5', fontSize: '0.95rem' }}>
                                            Silakan tambahkan alamat pengiriman dengan menekan tombol Ganti di samping.
                                        </div>
                                    </>
                                )}
                                {addresses.length === 0 && (
                                    <div style={{ marginTop: '12px' }}>
                                        <input 
                                            className="input" 
                                            placeholder="Ketik nama penerima pesanan ini..." 
                                            value={buyerName} 
                                            onChange={(e) => setBuyerName(e.target.value)} 
                                            style={{ padding: '8px 12px', fontSize: '0.9rem', width: '300px' }}
                                        />
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setShowAddressModal(true)} style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '6px 16px', borderRadius: '8px', fontWeight: 700, color: 'var(--dark)', cursor: 'pointer' }}>Ganti</button>
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
                                <input type="checkbox" checked={useInsurance} onChange={(e) => setUseInsurance(e.target.checked)} style={{ accentColor: '#10b981', width: '18px', height: '18px', cursor: 'pointer' }} />
                                <span style={{ fontSize: '0.9rem', color: 'var(--dark)' }}>Pakai Asuransi Pengiriman <span style={{ color: 'var(--muted)' }}>(Rp 2.000)</span></span>
                            </div>
                            <div style={{ marginTop: '16px' }}>
                                <input className="input" placeholder="Kasih Catatan" style={{ border: 'none', borderBottom: '1px solid #e2e8f0', borderRadius: 0, padding: '8px 0', fontSize: '0.95rem' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* KANAN: PAYMENT & RINGKASAN */}
                <div className="checkout-summary" style={{ width: '350px', flexShrink: 0, position: 'sticky', top: '100px' }}>
                    
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
                            {useInsurance && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.95rem' }}>
                                    <span>Asuransi Pengiriman</span><span>Rp {insuranceFee.toLocaleString('id-ID')}</span>
                                </div>
                            )}
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

            {/* MODAL PILIH ALAMAT */}
            {showAddressModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark)', margin: 0 }}>Pilih Alamat Pengiriman</h3>
                            <i className="fas fa-times" style={{ fontSize: '1.2rem', color: 'var(--muted)', cursor: 'pointer' }} onClick={() => setShowAddressModal(false)}></i>
                        </div>
                        
                        
                        {showAddAddressForm ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px' }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <input type="text" className="input" placeholder="Nama Lengkap" value={newAddress.name} onChange={(e) => {setNewAddress({...newAddress, name: e.target.value}); setFormErrors({...formErrors, name: ''})}} style={{ width: '100%', border: formErrors.name ? '1px solid #ee4d2d' : '' }} />
                                        {formErrors.name && <div style={{ color: '#ee4d2d', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>{formErrors.name}</div>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input type="tel" className="input" placeholder="Nomor Telepon (08...)" value={newAddress.phone} maxLength={13} onChange={(e) => {setNewAddress({...newAddress, phone: e.target.value.replace(/\D/g, '')}); setFormErrors({...formErrors, phone: ''})}} style={{ width: '100%', border: formErrors.phone ? '1px solid #ee4d2d' : '' }} />
                                        {formErrors.phone && <div style={{ color: '#ee4d2d', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>{formErrors.phone}</div>}
                                    </div>
                                </div>
                                
                                <div>
                                    <input type="text" className="input" placeholder="Provinsi, Kota, Kecamatan, Kode Pos" value={newAddress.region} onChange={(e) => {setNewAddress({...newAddress, region: e.target.value}); setFormErrors({...formErrors, region: ''})}} style={{ width: '100%', border: formErrors.region ? '1px solid #ee4d2d' : '' }} />
                                    {formErrors.region && <div style={{ color: '#ee4d2d', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>{formErrors.region}</div>}
                                </div>
                                
                                <div>
                                    <textarea className="input" rows="3" placeholder="Nama Jalan, Gedung, No. Rumah" value={newAddress.street} onChange={(e) => {setNewAddress({...newAddress, street: e.target.value}); setFormErrors({...formErrors, street: ''})}} style={{ width: '100%', resize: 'vertical', border: formErrors.street ? '1px solid #ee4d2d' : '' }} />
                                    {formErrors.street && <div style={{ color: '#ee4d2d', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>{formErrors.street}</div>}
                                </div>
                                
                                <div>
                                    <input type="text" className="input" placeholder="Detail Lainnya (Cth: Blok / Unit No., Patokan)" value={newAddress.detail} onChange={(e) => setNewAddress({...newAddress, detail: e.target.value})} style={{ width: '100%' }} />
                                </div>
                                
                                <div onClick={() => { setMapModalOpen(true); setTempCoordinates(newAddress.coordinates) }} style={{ height: '120px', background: newAddress.coordinates ? '#f0fdf4' : '#f8fafc', border: `1px dashed ${newAddress.coordinates ? '#22c55e' : '#cbd5e1'}`, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: newAddress.coordinates ? '#166534' : 'var(--muted)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = newAddress.coordinates ? '#dcfce7' : '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.background = newAddress.coordinates ? '#f0fdf4' : '#f8fafc'}>
                                    {newAddress.coordinates ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', pointerEvents: 'none' }}>
                                            <i className="fas fa-map-marker-alt fa-2x" style={{ color: '#22c55e' }}></i>
                                            <div style={{ fontWeight: 600 }}>Lokasi Tersimpan</div>
                                            <div style={{ fontSize: '0.8rem' }}>{newAddress.coordinates.lat.toFixed(4)}, {newAddress.coordinates.lng.toFixed(4)}</div>
                                        </div>
                                    ) : (
                                        <div style={{ background: '#fff', padding: '8px 16px', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
                                            <i className="fas fa-plus"></i> Tambah Lokasi Peta
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '8px' }}>Tandai Sebagai:</div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button 
                                            onClick={() => setNewAddress({...newAddress, label: 'Rumah'})} 
                                            style={{ padding: '8px 24px', background: '#fff', border: `1px solid ${newAddress.label === 'Rumah' ? '#ee4d2d' : '#cbd5e1'}`, color: newAddress.label === 'Rumah' ? '#ee4d2d' : 'var(--dark)', borderRadius: '4px', cursor: 'pointer', outline: 'none' }}
                                        >Rumah</button>
                                        <button 
                                            onClick={() => setNewAddress({...newAddress, label: 'Kantor'})} 
                                            style={{ padding: '8px 24px', background: '#fff', border: `1px solid ${newAddress.label === 'Kantor' ? '#ee4d2d' : '#cbd5e1'}`, color: newAddress.label === 'Kantor' ? '#ee4d2d' : 'var(--dark)', borderRadius: '4px', cursor: 'pointer', outline: 'none' }}
                                        >Kantor</button>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                    <input type="checkbox" id="isPrimary" checked={newAddress.isPrimary} onChange={(e) => setNewAddress({...newAddress, isPrimary: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#ee4d2d' }} />
                                    <label htmlFor="isPrimary" style={{ color: 'var(--muted)', fontSize: '0.95rem', cursor: 'pointer' }}>Atur sebagai Alamat Pribadi</label>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                                    <button onClick={() => setShowAddAddressForm(false)} className="btn btnOutline" style={{ border: 'none', background: 'transparent' }}>Nanti Saja</button>
                                    <button onClick={handleSaveNewAddress} disabled={isSavingAddress} className="btn btnPrimary" style={{ background: '#ee4d2d', color: '#fff', border: 'none', padding: '10px 40px', borderRadius: '4px' }}>{isSavingAddress ? "Menyimpan..." : "OK"}</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {addresses.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                        <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" style={{ width: '80px', marginBottom: '16px', opacity: 0.8 }} />
                                        <div style={{ color: 'var(--muted)', marginBottom: '16px' }}>Kamu belum menambahkan alamat apapun.</div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                                        {addresses.map((addr, idx) => (
                                            <div 
                                                key={idx} 
                                                onClick={() => { setSelectedAddressIndex(idx); setShowAddressModal(false); }}
                                                style={{ border: selectedAddressIndex === idx ? '2px solid #10b981' : '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', cursor: 'pointer', background: selectedAddressIndex === idx ? '#ecfdf5' : '#fff', transition: 'all 0.2s' }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ fontWeight: 800, color: 'var(--dark)' }}>{addr.label || 'Alamat'} • {addr.name}</span>
                                                    {selectedAddressIndex === idx && <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>}
                                                </div>
                                                <div style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                                    {addr.phone} <br/>
                                                    {addr.street} {addr.detail ? `, ${addr.detail}` : ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button onClick={() => setShowAddAddressForm(true)} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#ecfdf5', color: '#10b981', border: '1px dashed #10b981', fontWeight: 800, cursor: 'pointer', marginTop: '16px', fontSize: '0.95rem' }}>+ Tambah Alamat Baru</button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* MAP MODAL */}
            {mapModalOpen && (
                <div style={{position: 'fixed', inset: 0, zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)'}}>
                    <div style={{background: '#fff', borderRadius: '16px', width: '90%', maxWidth: '600px', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                        <div style={{padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--dark)', margin: 0 }}>Pilih Lokasi</h2>
                            <button onClick={() => setMapModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--muted)' }}><i className="fas fa-times"></i></button>
                        </div>
                        
                        <div style={{ padding: '16px' }}>
                            <MapPicker position={tempCoordinates} onPositionChange={setTempCoordinates} />
                        </div>
                        
                        <div style={{padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc'}}>
                            <button className="btn btnOutline" onClick={() => setMapModalOpen(false)} style={{ border: 'none', background: 'transparent' }}>Batal</button>
                            <button className="btn btnPrimary" onClick={() => {
                                if (tempCoordinates) {
                                    setNewAddress({...newAddress, coordinates: tempCoordinates})
                                }
                                setMapModalOpen(false)
                            }} style={{background: '#10b981', color: '#fff', border: 'none', padding: '10px 40px', borderRadius: '8px'}}>
                                Simpan Lokasi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 768px) {
                    .checkout-layout { flex-direction: column !important; }
                    .checkout-left { width: 100% !important; min-width: 0; }
                    .checkout-summary { width: 100% !important; position: static !important; }
                    .address-row { flex-direction: column; gap: 12px; }
                }
            `}} />
        </div>
    )
}
