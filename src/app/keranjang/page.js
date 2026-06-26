"use client"
import { useStore, useUIStore } from "@/lib/store"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabaseClient"
import Loading from "@/app/loading"
import ProductCard from "@/components/ProductCard"

export default function KeranjangPage() {
    const router = useRouter()
    const { cart, removeFromCart, updateCartQty, setSelectedForCheckout, wishlist, toggleWishlist, appliedVoucher, setAppliedVoucher, clearAppliedVoucher } = useStore()
    const showToast = useUIStore((state) => state.showToast)
    const supabase = createClient()

    const [promoInput, setPromoInput] = useState('')
    const [promoLoading, setPromoLoading] = useState(false)

    const [products, setProducts] = useState([])
    const [loadingProducts, setLoadingProducts] = useState(true)
    
    // UI State for checkboxes
    const [selectedItems, setSelectedItems] = useState([])

    useEffect(() => {
        async function fetchProducts() {
            const { data } = await supabase.from('products').select('*')
            if (data) setProducts(data)
            setLoadingProducts(false)
        }
        fetchProducts()
    }, [])

    const enrichedCart = cart.map(item => {
        const product = products.find(p => p.id === (item.productId || item.id));
        const isVariant = !!item.variant
        return {
            ...item,
            id: item.uniqueId || item.productId || item.id,
            productId: item.productId || item.id,
            name: product ? product.name : 'Produk Tidak Ditemukan',
            variantName: isVariant ? item.variant.name : null,
            price: product ? (isVariant ? Number(item.variant.price) : product.price) : 0,
            image_url: product ? product.image_url : null,
            max_stock: product ? (isVariant ? Number(item.variant.stock) : Number(product.stock)) : 0,
            category: product ? product.category : '',
            description: product ? product.description : '',
            isAvailable: !!product
        }
    })

    const allValidItems = enrichedCart.filter(i => i.qty <= i.max_stock)
    
    // Automatically deselect items that are removed or invalid
    useEffect(() => {
        if (!loadingProducts) {
            setSelectedItems(prev => prev.filter(id => allValidItems.some(item => item.id === id)))
        }
    }, [cart, loadingProducts])

    const handleSelectAll = () => {
        if (selectedItems.length === allValidItems.length) {
            setSelectedItems([])
        } else {
            setSelectedItems(allValidItems.map(i => i.id))
        }
    }

    const toggleSelectItem = (id) => {
        setSelectedItems(prev => 
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        )
    }

    const handleRemoveSelected = () => {
        if (selectedItems.length === 0) return;
        if (confirm(`Hapus ${selectedItems.length} produk dari keranjang?`)) {
            selectedItems.forEach(id => removeFromCart(id))
            setSelectedItems([])
            showToast("Produk berhasil dihapus.", "success")
        }
    }

    const selectedCartItems = enrichedCart.filter(item => selectedItems.includes(item.id))
    const totalItems = selectedCartItems.reduce((sum, item) => sum + item.qty, 0)
    const totalPrice = selectedCartItems.reduce((sum, item) => sum + (item.price * item.qty), 0)

    const proceedToCheckout = () => {
        if (selectedItems.length === 0) {
            showToast("Pilih minimal 1 produk untuk dibeli!", "error")
            return
        }
        setSelectedForCheckout(selectedItems)
        router.push('/checkout')
    }

    const handleApplyPromo = async () => {
        if (!promoInput.trim()) return;
        setPromoLoading(true);
        
        try {
            const { data, error } = await supabase.from('vouchers').select('*').eq('code', promoInput.toUpperCase()).single();
            
            if (error || !data) {
                showToast("Kode promo tidak valid atau tidak ditemukan!", "error");
                setPromoLoading(false);
                return;
            }

            // Validasi min purchase
            if (data.min_purchase && totalPrice < data.min_purchase) {
                showToast(`Minimal belanja Rp ${data.min_purchase.toLocaleString('id-ID')} untuk menggunakan promo ini!`, "error");
                setPromoLoading(false);
                return;
            }

            // Validasi kuota
            if (data.quota && data.used_count >= data.quota) {
                showToast("Kuota promo ini sudah habis!", "error");
                setPromoLoading(false);
                return;
            }

            setAppliedVoucher(data);
            setPromoInput('');
            showToast("Promo berhasil digunakan!", "success");
        } catch (err) {
            showToast("Terjadi kesalahan saat memverifikasi promo.", "error");
        }
        setPromoLoading(false);
    }

    if (loadingProducts) return <Loading />

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '40px 0' }}>
            <main className="contentArea" id="mainContent" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '24px', color: 'var(--dark)' }}>Keranjang</h1>
            
            {enrichedCart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" style={{ width: '120px', marginBottom: '20px', opacity: 0.8 }} />
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark)' }}>Wah, keranjang belanjamu kosong</h2>
                    <p style={{ color: 'var(--muted)', marginTop: '8px', marginBottom: '24px' }}>Yuk, isi dengan sembako dan kebutuhan harianmu sekarang!</p>
                    <Link href="/">
                        <button className="btn btnPrimary" style={{ padding: '12px 32px', borderRadius: '8px', fontWeight: 800 }}>Mulai Belanja</button>
                    </Link>
                </div>
            ) : (
                <div className="cart-layout" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                    
                    {/* KIRI: DAFTAR PRODUK */}
                    <div className="cart-items-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
                        
                        {/* HEADER TABEL */}
                        <div className="cart-header" style={{ background: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                            <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                                <input 
                                    type="checkbox" 
                                    style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }} 
                                    checked={selectedItems.length > 0 && selectedItems.length === allValidItems.length}
                                    onChange={handleSelectAll}
                                />
                            </div>
                            <div style={{ flex: 2 }}>Produk</div>
                            <div style={{ flex: 1, textAlign: 'center' }}>Harga Satuan</div>
                            <div style={{ flex: 1, textAlign: 'center' }}>Kuantitas</div>
                            <div style={{ flex: 1, textAlign: 'center' }}>Total Harga</div>
                            <div style={{ width: '60px', textAlign: 'center' }}>Aksi</div>
                        </div>

                        {/* LIST ITEMS */}
                        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                            {enrichedCart.map((item, index) => {
                                const isInvalid = !item.isAvailable || item.qty > item.max_stock;
                                const isSelected = selectedItems.includes(item.id);
                                const isWishlisted = wishlist.includes(item.productId);

                                return (
                                    <div key={item.id} className="cart-item-row" style={{ padding: '16px', borderBottom: index < enrichedCart.length - 1 ? '1px solid #f1f5f9' : 'none', opacity: isInvalid ? 0.6 : 1, display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                                        {/* CHECKBOX */}
                                        <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                                            <input 
                                                type="checkbox" 
                                                style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                                                checked={isSelected}
                                                onChange={() => toggleSelectItem(item.id)}
                                                disabled={isInvalid}
                                            />
                                        </div>

                                        {/* PRODUK (Image + Info) */}
                                        <div className="cart-item-product" style={{ flex: 2, display: 'flex', gap: '12px', alignItems: 'flex-start', paddingRight: '12px' }}>
                                            <img src={item.image_url || 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png'} style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #f1f5f9' }} />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--dark)', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {item.name}
                                                </div>
                                                {!item.isAvailable && <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700 }}>Produk sudah dihapus toko</div>}
                                                {item.variantName && <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Variasi: {item.variantName}</div>}
                                                {item.category && <div style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}>{item.category}</div>}
                                                {item.isAvailable && item.qty > item.max_stock && <div style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 700 }}>Sisa stok: {item.max_stock}</div>}
                                                <div className="mobile-price" style={{ display: 'none', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', marginTop: '4px' }}>
                                                    Rp{item.price.toLocaleString('id-ID')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* HARGA SATUAN */}
                                        <div className="cart-item-price" style={{ flex: 1, textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                                            Rp{item.price.toLocaleString('id-ID')}
                                        </div>

                                        {/* KUANTITAS */}
                                        <div className="cart-item-qty" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', opacity: item.isAvailable ? 1 : 0.5 }}>
                                                <button style={{ border: 'none', borderRight: '1px solid #cbd5e1', background: '#f8fafc', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: item.qty <= 1 || !item.isAvailable ? '#cbd5e1' : '#64748b', fontWeight: 800 }} onClick={() => updateCartQty(item.id, item.qty - 1)} disabled={item.qty <= 1 || !item.isAvailable}>-</button>
                                                <div style={{ width: '36px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--dark)' }}>{item.qty}</div>
                                                <button style={{ border: 'none', borderLeft: '1px solid #cbd5e1', background: '#f8fafc', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isInvalid || item.qty >= item.max_stock || !item.isAvailable ? '#cbd5e1' : '#64748b', fontWeight: 800 }} onClick={() => updateCartQty(item.id, item.qty + 1)} disabled={item.qty >= item.max_stock || !item.isAvailable}>+</button>
                                            </div>
                                        </div>

                                        {/* TOTAL HARGA */}
                                        <div className="cart-item-total" style={{ flex: 1, textAlign: 'center', color: '#ef4444', fontWeight: 700 }}>
                                            Rp{(item.price * item.qty).toLocaleString('id-ID')}
                                        </div>

                                        {/* AKSI */}
                                        <div className="cart-item-action" style={{ width: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ color: 'var(--dark)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'color 0.2s' }} onClick={() => removeFromCart(item.id)}>Hapus</div>
                                            <div style={{ color: '#f97316', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                Serupa <i className="fas fa-caret-down"></i>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>


                    </div>

                    {/* KANAN: RINGKASAN */}
                    <div className="cart-summary" style={{ width: '350px', flexShrink: 0, position: 'sticky', top: '100px' }}>
                        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', padding: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark)', margin: '0 0 20px 0' }}>Ringkasan belanja</h3>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <span style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>Total Harga ({totalItems} barang)</span>
                                <span style={{ fontWeight: 800, color: 'var(--dark)', fontSize: '1.1rem' }}>Rp {totalPrice.toLocaleString('id-ID')}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--dark)' }}>Makin hemat pakai promo</div>
                                
                                {appliedVoucher ? (
                                    <div style={{ background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#10b981', fontSize: '0.9rem' }}>{appliedVoucher.code}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>
                                                Diskon {appliedVoucher.discount_type === 'percent' ? `${appliedVoucher.discount_amount}%` : `Rp ${appliedVoucher.discount_amount.toLocaleString('id-ID')}`}
                                            </div>
                                        </div>
                                        <button onClick={clearAppliedVoucher} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Hapus</button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                                        <input 
                                            placeholder="Masukkan kode promo" 
                                            value={promoInput}
                                            onChange={e => setPromoInput(e.target.value)}
                                            style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, padding: '12px 16px', fontSize: '0.85rem', color: 'var(--dark)' }} 
                                        />
                                        <button 
                                            onClick={handleApplyPromo}
                                            disabled={promoLoading || !promoInput.trim()}
                                            style={{ border: 'none', background: promoInput.trim() ? '#10b981' : '#cbd5e1', color: '#fff', padding: '0 20px', alignSelf: 'stretch', fontWeight: 700, cursor: promoInput.trim() ? 'pointer' : 'not-allowed', fontSize: '0.9rem', transition: 'background 0.2s' }}
                                        >
                                            {promoLoading ? 'Cek...' : 'Gunakan'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button 
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: selectedItems.length > 0 ? '#10b981' : '#e2e8f0', color: selectedItems.length > 0 ? '#fff' : '#94a3b8', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
                                onClick={proceedToCheckout}
                                disabled={selectedItems.length === 0}
                            >
                                Beli ({totalItems})
                            </button>
                        </div>
                    </div>

                </div>
            )}

            {/* REKOMENDASI PRODUK (Dipindah ke luar cart-layout agar selalu di bawah) */}
            {enrichedCart.length > 0 && !loadingProducts && products.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark)', marginBottom: '16px' }}>Rekomendasi untukmu</h2>
                    <div className="recommendation-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        {products.filter(p => !cart.some(c => c.productId === p.id)).slice(0, 8).map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            )}

            </main>

            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 768px) {
                    .cart-layout { flex-direction: column !important; }
                    .cart-summary { width: 100% !important; position: static !important; }
                    .cart-header { display: none !important; }
                    .cart-item-row { flex-wrap: wrap !important; padding: 16px 12px !important; }
                    .cart-item-product { flex: 0 0 calc(100% - 40px) !important; padding-right: 0 !important; margin-bottom: 12px; }
                    .cart-item-price { display: none !important; }
                    .mobile-price { display: block !important; }
                    .cart-item-qty { flex: 1 !important; justify-content: flex-start !important; }
                    .cart-item-total { flex: 1 !important; text-align: right !important; font-size: 1rem !important; }
                    .cart-item-action { width: 100% !important; flex-direction: row !important; justify-content: flex-end !important; margin-top: 12px; border-top: 1px solid #f1f5f9; padding-top: 12px; }
                    .recommendation-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
            `}} />
        </div>
    )
}
