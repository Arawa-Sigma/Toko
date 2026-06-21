"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useStore, useUIStore } from "@/lib/store"
import { createClient } from "@/lib/supabaseClient"
import Loading from "@/app/loading"

export default function ProductDetail() {
    const router = useRouter()
    const params = useParams()
    const { slug } = params

    const makeSlug = (name, id) => {
        if (!name) return `product-${id}`;
        const cleanName = name.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        return `${cleanName}-${id}`
    }
    const [product, setProduct] = useState(null)
    const [reviews, setReviews] = useState([])
    const [relatedProducts, setRelatedProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [qty, setQty] = useState(1)
    const [isSticky, setIsSticky] = useState(false)
    const [activeTab, setActiveTab] = useState('detail')
    const [infoTab, setInfoTab] = useState('detail')
    const [selectedVariant, setSelectedVariant] = useState(null)

    const { cart, addToCart, removeFromCart, updateCartQty, wishlist, toggleWishlist } = useStore()
    const showToast = useUIStore((state) => state.showToast)

    useEffect(() => {
        async function loadProduct() {
            const supabase = createClient()

            // Coba ambil berdasarkan slug
            let { data: prodData, error: prodErr } = await supabase
                .from('products')
                .select('*')
                .eq('slug', slug)
                .single()

            // Fallback jika belum jalankan script SQL (kolom slug belum ada) atau slug kosong
            if (!prodData) {
                // Ekstrak ID (karena format slug sementara adalah: nama-barang-id)
                const slugParts = typeof slug === 'string' ? slug.split('-') : []
                const possibleId = slugParts.length > 0 ? slugParts[slugParts.length - 1] : slug

                const { data: fallbackData } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', possibleId)
                    .single()

                if (fallbackData) {
                    prodData = fallbackData
                }
            }

            if (prodData) {
                setProduct(prodData)
                if (prodData.variants && prodData.variants.length > 0) {
                    setSelectedVariant(prodData.variants[0])
                }

                // Fetch Reviews
                const { data: revData } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('product_id', prodData.id)
                    .order('created_at', { ascending: false })

                if (revData) setReviews(revData)

                // 2. Ambil produk lain secara acak
                const { data: relatedData } = await supabase
                    .from('products')
                    .select('*')
                    .neq('id', prodData.id)
                    .limit(20)

                if (relatedData) {
                    const shuffled = relatedData.sort(() => 0.5 - Math.random())
                    setRelatedProducts(shuffled.slice(0, 5))
                }
            } else {
                showToast("Produk tidak ditemukan!", "error")
                router.push("/")
            }
            setLoading(false)
        }
        loadProduct()
    }, [slug])
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 400) {
                setIsSticky(true)
                if (window.scrollY > 800) setActiveTab('ulasan')
                else setActiveTab('detail')
            } else {
                setIsSticky(false)
            }
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    if (loading) {
        return <Loading />
    }

    if (!product) return null

    let hasDisc = Number(product.discount || 0) > 0
    let discountEndText = ""
    let isUnlimited = false
    
    if (hasDisc && product.discount_end_date) {
        const now = new Date()
        const endDate = new Date(product.discount_end_date)
        const diff = endDate - now
        
        if (diff <= 0) {
            hasDisc = false // Expired
        } else {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            
            if (days > 0) discountEndText = `${days} hari`
            else if (hours > 0) discountEndText = `${hours} jam`
            else discountEndText = `${mins} menit`
        }
    } else if (hasDisc) {
        isUnlimited = true
    }

    const basePrice = selectedVariant ? Number(selectedVariant.price) : Number(product.price)
    const finalPrice = hasDisc ? Math.round(basePrice - (basePrice * (product.discount / 100))) : basePrice
    const stockTotal = selectedVariant ? Number(selectedVariant.stock) : Number(product.stock || 0)
    const isOut = stockTotal <= 0

    const reviewCount = reviews.length;
    const terjualCount = reviewCount > 0 ? reviewCount * 3 + 15 : 0;

    // Hitung rata-rata rating dari review
    const avgRating = reviewCount > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) : 0;
    const displayRating = avgRating.toFixed(1);
    const starCount = Math.round(avgRating);
    const stars = "★".repeat(starCount) + "☆".repeat(5 - starCount)

    const img = product.image_url || "https://cdn-icons-png.flaticon.com/512/3081/3081840.png"



    const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach(r => {
        if (ratingDist[r.rating] !== undefined) ratingDist[r.rating]++;
    });

    const handleAddToCart = () => {
        if (stockTotal <= 0) {
            showToast("Maaf, stok habis!", "error")
            return
        }
        addToCart(product, qty, selectedVariant)
        showToast("Berhasil dimasukkan ke keranjang", "success")
    }

    const handleBuyNow = () => {
        if (stockTotal <= 0) {
            showToast("Maaf, stok habis!", "error")
            return
        }
        addToCart(product, qty, selectedVariant)
        router.push("/keranjang")
    }

    function getCartQty(productId) {
        const item = cart.find(i => i.productId === productId)
        return item ? item.qty : 0
    }

    function changeQty(productId, delta, productStock) {
        const qtyInCart = getCartQty(productId)
        const next = qtyInCart + delta
        if (next <= 0) {
            removeFromCart(productId)
        } else if (next <= productStock) {
            updateCartQty(productId, next)
        } else {
            showToast("Qty melebihi stok.", "error")
        }
    }

    return (
        <main className="contentArea" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Sticky Navigation Bar */}
            {isSticky && (
                <div style={{ position: 'fixed', top: '64px', left: 0, right: 0, background: '#fff', borderBottom: '1px solid var(--border)', zIndex: 40, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', height: '60px', padding: '0 20px' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', marginRight: '40px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                        <div style={{ display: 'flex', gap: '32px', height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: activeTab === 'detail' ? 'var(--primary)' : 'var(--muted)', borderBottom: activeTab === 'detail' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', height: '100%' }} onClick={() => { setActiveTab('detail'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Detail Produk</div>
                            <div style={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: activeTab === 'ulasan' ? 'var(--primary)' : 'var(--muted)', borderBottom: activeTab === 'ulasan' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', height: '100%' }} onClick={() => { setActiveTab('ulasan'); document.getElementById('ulasan-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>Ulasan</div>
                            <div style={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: activeTab === 'rekomendasi' ? 'var(--primary)' : 'var(--muted)', borderBottom: activeTab === 'rekomendasi' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', height: '100%' }} onClick={() => { setActiveTab('rekomendasi'); document.getElementById('rekomendasi-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>Rekomendasi</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigasi Breadcrumb */}
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '24px' }}>
                <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Home</Link>
                <span style={{ margin: '0 8px' }}>&gt;</span>
                <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>{product.category}</span>
                <span style={{ margin: '0 8px' }}>&gt;</span>
                <span style={{ color: '#111827' }}>{product.name}</span>
            </div>

            {/* Layout 3 Kolom Utama */}
            <div className="tokopediaGrid">

                {/* KOLOM 1: Gambar Produk */}
                <div style={{ position: 'sticky', top: '100px' }}>
                    <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: '#f8fafc', position: 'relative', marginBottom: '12px' }}>
                        {isOut && <div className="stockOverlay" style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}><div style={{ background: 'var(--danger)', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontWeight: 900, letterSpacing: '1px' }}>STOK HABIS</div></div>}
                        <img src={img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    {/* Thumbnail kecil */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '8px', border: '2px solid var(--primary)', overflow: 'hidden', cursor: 'pointer' }}>
                            <img src={img} alt="thumb1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>
                </div>

                {/* KOLOM 2: Info & Detail */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: '#111827', lineHeight: '1.4' }}>{product.name}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: 700 }}>Terjual {terjualCount === 0 ? "0" : `${terjualCount}+`}</span>
                        </div>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--muted)' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted)' }}>
                            <span style={{ color: 'var(--warn)', fontSize: '1.1rem' }}>★</span>
                            <span style={{ fontWeight: 700, color: '#111827' }}>{displayRating}</span> ({reviewCount} rating)
                        </div>
                    </div>

                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', marginBottom: '24px' }}>
                        Rp{finalPrice.toLocaleString('id-ID')}
                        {hasDisc && <span style={{ marginLeft: '12px', fontSize: '1rem', background: '#fce7f3', color: '#db2777', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{product.discount}%</span>}
                        {hasDisc && <span style={{ marginLeft: '8px', fontSize: '1rem', textDecoration: 'line-through', color: 'var(--muted)', fontWeight: 500 }}>Rp{basePrice.toLocaleString('id-ID')}</span>}
                    </div>

                    {product.variants && product.variants.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '24px' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '12px' }}>Pilih varian: <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{selectedVariant?.name}</span></div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {product.variants.map((v, idx) => {
                                    const isSelected = selectedVariant?.id === v.id
                                    return (
                                        <button key={v.id} onClick={() => { setSelectedVariant(v); setQty(1); }} style={{ padding: '6px 16px', borderRadius: '8px', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`, background: isSelected ? '#e6f7eb' : '#fff', color: isSelected ? 'var(--primary)' : '#334155', fontWeight: isSelected ? 700 : 500, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <img src={img} alt={v.name} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} /> {v.name}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '16px 0', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '32px', color: 'var(--primary)', fontWeight: 700, fontSize: '1rem', marginBottom: '16px' }}>
                            <div onClick={() => setInfoTab('detail')} style={{ borderBottom: infoTab === 'detail' ? '3px solid var(--primary)' : '3px solid transparent', color: infoTab === 'detail' ? 'var(--primary)' : 'var(--muted)', cursor: 'pointer', paddingBottom: '8px' }}>Detail Produk</div>
                            {product.specifications && product.specifications.length > 0 && (
                                <div onClick={() => setInfoTab('spesifikasi')} style={{ borderBottom: infoTab === 'spesifikasi' ? '3px solid var(--primary)' : '3px solid transparent', color: infoTab === 'spesifikasi' ? 'var(--primary)' : 'var(--muted)', cursor: 'pointer', paddingBottom: '8px' }}>Spesifikasi</div>
                            )}
                        </div>
                        <div style={{ fontSize: '0.95rem', color: '#334155', lineHeight: '1.8' }}>
                            {infoTab === 'detail' && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', marginBottom: '20px' }}>
                                        <div style={{ color: 'var(--muted)' }}>Kategori:</div>
                                        <div style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>{product.category}</div>
                                    </div>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                        {product.description || "Tidak ada deskripsi untuk produk ini."}
                                    </div>
                                </>
                            )}
                            
                            {infoTab === 'spesifikasi' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                                    {product.specifications && product.specifications.map((s, idx) => [
                                        <div key={`k-${idx}`} style={{ color: 'var(--muted)' }}>{s.key}:</div>,
                                        <div key={`v-${idx}`}>{s.value}</div>
                                    ])}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bagian Ulasan dipindah ke bawah layout grid */}

                </div>

                {/* KOLOM 3: Sticky Card (Atur jumlah dan catatan) */}
                <div style={{ position: 'sticky', top: '24px' }}>

                    {hasDisc && (
                        <div className="wavyGradient" style={{ borderRadius: '8px', padding: '12px 16px', color: '#fff', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: '1rem' }}>Spesial Diskon</div>
                            {!isUnlimited && (
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Berakhir dalam</div>
                                    <div style={{ background: '#fff', color: '#ef144a', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, display: 'inline-block' }}>{discountEndText}</div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px', color: '#111827' }}>Atur jumlah dan catatan</h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <img src={img} alt="thumb" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                            <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{product.name}</div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', margin: '20px 0' }}></div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', background: '#fff' }}>
                                <button style={{ border: 'none', background: 'transparent', width: '32px', height: '32px', fontSize: '1.2rem', cursor: 'pointer', color: qty <= 1 ? '#cbd5e1' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
                                <div style={{ width: '40px', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>{qty}</div>
                                <button style={{ border: 'none', background: 'transparent', width: '32px', height: '32px', fontSize: '1.2rem', cursor: 'pointer', color: qty >= stockTotal ? '#cbd5e1' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setQty(Math.min(stockTotal, qty + 1))} disabled={isOut}>+</button>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                                Stok: <span style={{ fontWeight: 700, color: isOut ? 'var(--danger)' : stockTotal <= 10 ? 'var(--warn)' : '#111827' }}>{isOut ? 'Habis' : `Sisa ${stockTotal}`}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ color: 'var(--muted)', fontSize: '1rem' }}>Subtotal</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827' }}>Rp{(finalPrice * qty).toLocaleString('id-ID')}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                className="btn btnPrimary"
                                style={{ width: '100%', padding: '10px', fontSize: '0.9rem', borderRadius: '8px', fontWeight: 700 }}
                                onClick={handleAddToCart}
                                disabled={isOut}
                            >
                                + Keranjang
                            </button>
                            <button
                                style={{ width: '100%', padding: '10px', fontSize: '0.9rem', borderRadius: '8px', fontWeight: 700, border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', cursor: isOut ? 'not-allowed' : 'pointer' }}
                                onClick={handleBuyNow}
                                disabled={isOut}
                            >
                                Beli Langsung
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--muted)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}><i className="far fa-comment-dots"></i> Chat</div>
                            <div style={{ borderLeft: '1px solid var(--border)', height: '16px' }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }} onClick={() => toggleWishlist(product.id)}><i className={wishlist.includes(product.id) ? "fas fa-heart" : "far fa-heart"} style={{ color: wishlist.includes(product.id) ? 'var(--danger)' : 'inherit' }}></i> Wishlist</div>
                            <div style={{ borderLeft: '1px solid var(--border)', height: '16px' }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}><i className="fas fa-share-alt"></i> Share</div>
                        </div>
                    </div>
                </div>

            </div>

            {/* NEW ULASAN SECTION */}
            <div id="ulasan-section" style={{ marginTop: '40px', borderTop: '4px solid var(--border)', paddingTop: '40px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '24px', textTransform: 'uppercase' }}>Ulasan Pembeli</h2>

                <div style={{ display: 'flex', gap: '40px', alignItems: 'center', marginBottom: '32px', padding: '24px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ color: 'var(--warn)', fontSize: '2.5rem' }}>★</span>
                            <span style={{ fontSize: '3.5rem', fontWeight: 800 }}>{displayRating}</span>
                            <span style={{ fontSize: '1rem', color: 'var(--muted)', fontWeight: 700 }}>/5.0</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{reviewCount > 0 ? "96% pembeli merasa puas" : "Belum ada penilaian"}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{reviewCount} rating • {reviewCount} ulasan</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = ratingDist[star];
                            const pct = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
                            return (
                                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
                                    <div style={{ color: 'var(--warn)', width: '30px' }}>★ {star}</div>
                                    <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)' }}></div>
                                    </div>
                                    <div style={{ color: 'var(--muted)', width: '60px', textAlign: 'right' }}>({count})</div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px' }}>
                    {/* LEFT FILTER */}
                    <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '16px' }}>FILTER ULASAN</h3>
                        <div style={{ border: '1px solid var(--border)', borderRadius: '8px' }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px' }}>Media</div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                                    <input type="checkbox" style={{ width: '18px', height: '18px' }} /> Dengan Foto & Video
                                </label>
                            </div>
                            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px' }}>Rating</div>
                                {[5, 4, 3, 2, 1].map(r => (
                                    <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer', marginBottom: '8px' }}>
                                        <input type="checkbox" style={{ width: '18px', height: '18px' }} /> <span style={{ color: 'var(--warn)' }}>★</span> {r}
                                    </label>
                                ))}
                            </div>
                            <div style={{ padding: '16px' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px' }}>Topik Ulasan</div>
                                {['Kualitas Barang', 'Pelayanan Penjual', 'Kemasan Barang', 'Harga Barang', 'Sesuai Deskripsi', 'Pengiriman'].map(t => (
                                    <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer', marginBottom: '8px' }}>
                                        <input type="checkbox" style={{ width: '18px', height: '18px' }} /> {t}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT REVIEWS */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '4px' }}>ULASAN PILIHAN</h3>
                                <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Menampilkan {reviewCount} ulasan</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700 }}>
                                Urutkan
                                <select style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none' }}>
                                    <option>Paling Membantu</option>
                                    <option>Terbaru</option>
                                </select>
                            </div>
                        </div>

                        {/* Dynamic Reviews */}
                        {reviews.length > 0 ? reviews.map((rev) => (
                            <div key={rev.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <div style={{ color: 'var(--warn)', fontSize: '0.9rem' }}>{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</div>
                                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{new Date(rev.created_at).toLocaleDateString('id-ID')}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                                    {rev.avatar_url ? (
                                        <img src={rev.avatar_url} alt="user" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{rev.user_name?.charAt(0).toUpperCase() || 'U'}</div>
                                    )}
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{rev.user_name}</div>
                                </div>
                                <div style={{ fontSize: '0.95rem', color: '#334155', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{rev.comment}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
                                    <div style={{ color: 'var(--muted)', cursor: 'pointer' }}><i className="fas fa-thumbs-up"></i> {rev.helpful_count} orang terbantu</div>
                                </div>
                            </div>
                        )) : (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                                Belum ada ulasan untuk produk ini.
                            </div>
                        )}

                        {/* Pagination Section */}
                        {reviews.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingTop: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>
                                    <i className="fas fa-chevron-left" style={{ cursor: 'not-allowed', color: '#cbd5e1', fontSize: '0.8rem' }}></i>
                                    <span style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '4px' }}>1</span>
                                    <span style={{ cursor: 'pointer', paddingBottom: '4px' }}>2</span>
                                    <span style={{ cursor: 'pointer', paddingBottom: '4px' }}>3</span>
                                    <span style={{ cursor: 'pointer', paddingBottom: '4px' }}>4</span>
                                    <span style={{ cursor: 'pointer', paddingBottom: '4px' }}>5</span>
                                    <span style={{ cursor: 'pointer', paddingBottom: '4px' }}>6</span>
                                    <span style={{ cursor: 'pointer', paddingBottom: '4px' }}>7</span>
                                    <span>...</span>
                                    <span style={{ cursor: 'pointer', paddingBottom: '4px' }}>50</span>
                                    <i className="fas fa-chevron-right" style={{ cursor: 'pointer', color: '#64748b', fontSize: '0.8rem' }}></i>
                                </div>
                                <div style={{ color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>
                                    Lihat Semua Ulasan
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Produk Serupa */}
            {relatedProducts.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>Pilihan lainnya untukmu</h2>
                        <Link href="/" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>Lihat Semua &gt;</Link>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                        {relatedProducts.map(p => {
                            const hasDisc = Number(p.discount || 0) > 0
                            const relPrice = Number(p.price || 0)
                            const finalRelPrice = hasDisc ? relPrice - (relPrice * (p.discount / 100)) : relPrice
                            const isWish = wishlist.includes(p.id)
                            const relImg = p.image_url || "https://cdn-icons-png.flaticon.com/512/3081/3081840.png"
                            const relQtyInCart = getCartQty(p.id)
                            const relStockTotal = Number(p.stock || 0)
                            const relIsOut = relStockTotal <= 0
                            const relRating = Math.max(1, Math.min(5, Number(p.rating || 5)))
                            const relStars = "★".repeat(relRating) + "☆".repeat(5 - relRating)

                            return (
                                <div className="prod" style={{ cursor: 'pointer' }} onClick={() => router.push(`/product/${p.slug || makeSlug(p.name, p.id)}`)} key={p.id}>
                                    {hasDisc && <div className="tag">Diskon {p.discount}%</div>}
                                    <button
                                        className={`wish ${isWish ? "active" : ""}`}
                                        onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id) }}
                                        title="Wishlist"
                                    >
                                        <i className="fas fa-heart"></i>
                                    </button>
                                    <div className="thumb">
                                        {relIsOut && <div className="stockOverlay"><div className="stockOverlayText">STOK HABIS</div></div>}
                                        <img src={relImg} alt={p.name} onError={(e) => e.target.src = 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png'} />
                                    </div>
                                    <div className="prodName">{p.name}</div>
                                    <div>
                                        {hasDisc && <span className="strike">Rp {relPrice.toLocaleString('id-ID')}</span>}
                                        <span className="price">Rp {finalRelPrice.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="meta" style={{ color: 'var(--warn)', fontWeight: 900 }}>{relStars}</div>
                                    <div className="meta">
                                        Stok tersedia: <b style={{ color: relStockTotal <= 10 && relStockTotal > 0 ? 'var(--warn)' : relStockTotal <= 0 ? 'var(--danger)' : '#111827' }}>{relStockTotal}</b>
                                    </div>
                                    <div className="prodFooter" onClick={(e) => e.stopPropagation()}>
                                        {relQtyInCart <= 0 ? (
                                            <button className="btn btnPrimary" onClick={(e) => { e.stopPropagation(); addToCart(p); }} disabled={relStockTotal <= 0}>
                                                <i className="fas fa-cart-plus"></i> Tambah
                                            </button>
                                        ) : (
                                            <div className="qtyStepper">
                                                <button className="qtyMiniBtn" onClick={() => changeQty(p.id, -1, relStockTotal)}>-</button>
                                                <div className="qtyStepperVal">{relQtyInCart}</div>
                                                <button className="qtyMiniBtn" onClick={() => changeQty(p.id, 1, relStockTotal)} disabled={relQtyInCart >= relStockTotal}>+</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </main>
    )
}
