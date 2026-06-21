"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useStore, useUIStore } from "@/lib/store"
import { createClient } from "@/lib/supabaseClient"
import HeroCarousel from "@/components/HeroCarousel"
import Loading from "@/app/loading"

export default function Storefront() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [quickBuyProduct, setQuickBuyProduct] = useState(null)
  const [quickBuyVariant, setQuickBuyVariant] = useState(null)
  const [quickBuyQty, setQuickBuyQty] = useState(1)
  const { cart, addToCart, removeFromCart, updateCartQty, landingCategory, setLandingCategory, landingSearch, setLandingSearch, wishlist, toggleWishlist } = useStore()
  const showToast = useUIStore((state) => state.showToast)
  const router = useRouter()


  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true })
      if (data) {
        const now = new Date()
        const updated = data.map(p => {
          if (p.discount > 0 && p.discount_end_date) {
            if (new Date(p.discount_end_date) - now <= 0) {
              return { ...p, discount: 0 }
            }
          }
          return p
        })
        setProducts(updated)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const categories = [
    { name: "Semua Barang", icon: "fa-th-large" },
    { name: "Sembako", icon: "fa-box" },
    { name: "Minuman", icon: "fa-wine-bottle" },
    { name: "Makanan Ringan", icon: "fa-cookie" },
    { name: "Frozen Food", icon: "fa-snowflake" },
    { name: "Bumbu Dapur", icon: "fa-mortar-pestle" },
    { name: "Kebersihan", icon: "fa-pump-soap" },
    { name: "Peralatan Rumah", icon: "fa-broom" },
    { name: "Gas LPG", icon: "fa-fire" },
    { name: "Ibu & Bayi", icon: "fa-baby" },
    { name: "Kesehatan", icon: "fa-medkit" },
    { name: "Lainnya", icon: "fa-box-open" }
  ]
  
  const filteredProducts = products.filter(p => {
    if (p.status !== "aktif" && p.status !== "Aktif" && p.status) return false // some could be undefined/null in legacy
    if (landingCategory !== "Semua Barang" && p.category !== landingCategory) return false
    if (landingSearch && !p.name.toLowerCase().includes(landingSearch.toLowerCase())) return false
    return true
  })

  const discountProducts = products.filter(p => Number(p.discount || 0) > 0 && (p.status === "aktif" || !p.status))

  const cartItemCount = cart.reduce((acc, item) => acc + item.qty, 0)
  const cartTotal = cart.reduce((acc, item) => {
    const product = products.find(p => p.id === item.productId)
    if (!product) return acc
    const price = product.price
    const finalPrice = product.discount > 0 ? price - (price * (product.discount / 100)) : price
    return acc + (finalPrice * item.qty)
  }, 0)

  function rupiah(n) {
    return "Rp" + Number(n).toLocaleString("id-ID")
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

  const makeSlug = (name, id) => {
    if (!name) return `product-${id}`;
    const cleanName = name.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    return `${cleanName}-${id}`
  }

  const ProductCard = ({ p }) => {
    const hasDisc = Number(p.discount || 0) > 0
    const price = Number(p.price || 0)
    const finalPrice = hasDisc ? Math.round(price - (price * (p.discount / 100))) : price
    const isWish = wishlist.includes(p.id)
    const img = p.image_url ? p.image_url : "https://cdn-icons-png.flaticon.com/512/3081/3081840.png"
    const qtyInCart = getCartQty(p.id)
    const stockTotal = Number(p.stock || 0)
    const isOut = stockTotal <= 0
    const ratingRaw = Number(p.rating || 0)
    const rating = Math.max(0, Math.min(5, ratingRaw))
    const filledStars = Math.floor(rating)
    const emptyStars = 5 - filledStars
    const stars = "★".repeat(filledStars) + "☆".repeat(emptyStars)

    return (
      <div className="prod" style={{ cursor: 'pointer' }} onClick={() => router.push(`/product/${p.slug || makeSlug(p.name, p.id)}`)}>
        {hasDisc && <div className="tag">Diskon {p.discount}%</div>}
        <button 
          className={`wish ${isWish ? "active" : ""}`} 
          onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id) }} 
          title="Wishlist"
        >
          <i className="fas fa-heart"></i>
        </button>
        <div className="thumb">
          {isOut && <div className="stockOverlay"><div className="stockOverlayText">STOK HABIS</div></div>}
          <img src={img} alt={p.name} onError={(e) => e.target.src='https://cdn-icons-png.flaticon.com/512/3081/3081840.png'} />
        </div>
        <div className="prodName">{p.name}</div>
        <div>
          {hasDisc && <span className="strike">{rupiah(price)}</span>}
          <span className="price">{rupiah(finalPrice)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minHeight: '20px' }}>
            {rating > 0 ? (
                <>
                    <div className="star">{stars}</div>
                    <div style={{ fontSize: '.85rem', fontWeight: 900, color: '#475569' }}>{rating.toFixed(1)}</div>
                </>
            ) : (
                <div style={{ fontSize: '.75rem', color: '#94a3b8', fontWeight: 600 }}>Belum ada ulasan</div>
            )}
        </div>
        <div className="meta">
            Stok tersedia: <b style={{color: stockTotal <= 10 && stockTotal > 0 ? 'var(--warn)' : stockTotal <= 0 ? 'var(--danger)' : '#111827'}}>{stockTotal}</b>
        </div>
        <div className="prodFooter" onClick={(e) => e.stopPropagation()}>
            <button className="btn btnPrimary" onClick={(e) => { 
                e.stopPropagation(); 
                setQuickBuyProduct(p);
                setQuickBuyVariant(p.variants && p.variants.length > 0 ? p.variants[0] : null);
                setQuickBuyQty(1);
            }} disabled={stockTotal <= 0}>
                <i className="fas fa-shopping-basket"></i> Beli Langsung
            </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <Loading />
  }

  return (
    <>
      <main className="contentArea" id="mainContent">
        <section id="pageEtalase">
            {/* Tokopedia-Style Hero Carousel */}
            <HeroCarousel />

            {/* Tokopedia-Style Combined Card */}
            <div className="card sectionPad" style={{marginTop:"30px", padding: "24px"}}>
                
                {/* Header for the section */}
                <div className="grid2" style={{marginBottom: "16px", gap: "24px"}}>
                    <div>
                        <h3 className="h1" style={{fontSize: "1.2rem", marginBottom: "4px"}}>Promo Spesial</h3>
                    </div>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                        <h3 className="h1" style={{fontSize: "1.2rem", marginBottom: "4px"}}>Kenapa Memilih Kami?</h3>
                    </div>
                </div>

                {/* Banner & Why Choose Us */}
                <div className="grid2" style={{gap: "24px", marginBottom: "24px"}}>
                    {/* LEFT: Smaller Promo Banner */}
                    <div style={{
                      background: "url('/promo_mascot.png') center right / cover no-repeat", 
                      borderRadius: "16px", 
                      color: "white", 
                      position: "relative",
                      padding: "48px 56px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}>
                        <h2 style={{fontSize: "1.8rem", fontWeight: 900, lineHeight: 1.2, marginBottom: "8px"}}>Makin Untung<br/>Belanja Disini!</h2>
                        <p style={{fontSize: "0.85rem", opacity: 0.9, marginBottom: "24px", maxWidth: "280px"}}>Dapatkan potongan harga khusus untuk produk pilihan setiap harinya.</p>
                        <div>
                            <button className="btn" style={{background: "white", color: "#059669", padding: "8px 20px", fontSize: "0.8rem", border: "none", borderRadius: "999px"}} onClick={() => document.getElementById('discountGrid')?.scrollIntoView({behavior:'smooth'})}>
                                Cek Promo Sekarang
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: Why Choose Us Grid 2x2 */}
                    <div style={{display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", alignContent: "start"}}>
                        <div style={{border: "1px solid #e2e8f0", borderRadius: "16px", textAlign: "center", padding: "20px 12px", display: "flex", flexDirection: "column", alignItems: "center", background: "#fff", transition: "all 0.3s ease", cursor: "default"}} className="hoverUp">
                            <div style={{width: "48px", height: "48px", background: "#d1fae5", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px"}}>
                                <i className="fas fa-truck" style={{fontSize: "1.2rem", color: "var(--primary)"}}></i>
                            </div>
                            <div style={{fontWeight: 800, fontSize: "0.9rem"}}>Pengiriman Cepat</div>
                            <div style={{marginTop: "6px", fontSize: "0.75rem", color: "#64748b"}}>Bisa kurir / ambil sendiri.</div>
                        </div>
                        <div style={{border: "1px solid #e2e8f0", borderRadius: "16px", textAlign: "center", padding: "20px 12px", display: "flex", flexDirection: "column", alignItems: "center", background: "#fff", transition: "all 0.3s ease", cursor: "default"}} className="hoverUp">
                            <div style={{width: "48px", height: "48px", background: "#fef3c7", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px"}}>
                                <i className="fas fa-shield-alt" style={{fontSize: "1.2rem", color: "#ca8a04"}}></i>
                            </div>
                            <div style={{fontWeight: 800, fontSize: "0.9rem"}}>Kualitas Terjamin</div>
                            <div style={{marginTop: "6px", fontSize: "0.75rem", color: "#64748b"}}>Produk fresh & dicek.</div>
                        </div>
                        <div style={{border: "1px solid #e2e8f0", borderRadius: "16px", textAlign: "center", padding: "20px 12px", display: "flex", flexDirection: "column", alignItems: "center", background: "#fff", transition: "all 0.3s ease", cursor: "default"}} className="hoverUp">
                            <div style={{width: "48px", height: "48px", background: "#dbeafe", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px"}}>
                                <i className="fas fa-tags" style={{fontSize: "1.2rem", color: "#2563eb"}}></i>
                            </div>
                            <div style={{fontWeight: 800, fontSize: "0.9rem"}}>Harga Kompetitif</div>
                            <div style={{marginTop: "6px", fontSize: "0.75rem", color: "#64748b"}}>Lebih murah dari swalayan.</div>
                        </div>
                        <div style={{border: "1px solid #e2e8f0", borderRadius: "16px", textAlign: "center", padding: "20px 12px", display: "flex", flexDirection: "column", alignItems: "center", background: "#fff", transition: "all 0.3s ease", cursor: "default"}} className="hoverUp">
                            <div style={{width: "48px", height: "48px", background: "#fce7f3", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px"}}>
                                <i className="fas fa-headset" style={{fontSize: "1.2rem", color: "#db2777"}}></i>
                            </div>
                            <div style={{fontWeight: 800, fontSize: "0.9rem"}}>Layanan 24/7</div>
                            <div style={{marginTop: "6px", fontSize: "0.75rem", color: "#64748b"}}>Customer service WA.</div>
                        </div>
                    </div>
                </div>

                <hr style={{border: "none", borderTop: "1px solid #e2e8f0", margin: "24px 0"}} />

                <div style={{marginBottom: "16px"}}>
                    <h3 className="h1" style={{fontSize: "1.2rem", marginBottom: "4px"}}>Kategori Pilihan</h3>
                </div>
                
                <div style={{display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px"}}>
                  {categories.map(cat => {
                    const isActive = landingCategory === cat.name;
                    return (
                    <div 
                      key={cat.name} 
                      className={`catCard ${isActive ? 'active' : ''}`}
                      onClick={() => setLandingCategory(cat.name)}
                    >
                      <div className="catIcon">
                        <i className={`fas ${cat.icon}`}></i>
                      </div>
                      <span>{cat.name}</span>
                    </div>
                  )})}
                </div>

                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px"}}>
                    <Link href="/keranjang" style={{textDecoration: 'none'}}>
                        <div style={{padding: "8px 16px", borderRadius: "8px", border: "1px dashed #6ee7b7", background: "#ecfdf5", color: "var(--primary)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer"}}>
                            <i className="fas fa-shopping-cart" style={{marginRight: "6px"}}></i> Keranjang: {cartItemCount}
                        </div>
                    </Link>
                    <button onClick={() => { setLandingCategory("Semua Barang"); setLandingSearch(""); }} style={{padding: "8px 16px", borderRadius: "999px", border: "1px solid #6ee7b7", background: "#fff", color: "var(--primary)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"}} className="btn">
                        <i className="fas fa-undo"></i> Reset Filter
                    </button>
                </div>

                {discountProducts.length > 0 && (
                  <div style={{marginTop: "32px"}}>
                      <div className="titleRow" style={{marginBottom: "14px"}}>
                          <div>
                              <h3 className="h1" style={{fontSize: "1.3rem"}}>🔥 Sedang Diskon Besar</h3>
                              <div className="p">Produk pilihan dengan potongan harga terbaik</div>
                          </div>
                      </div>
                      <div className="productsGrid" id="discountGrid" style={{marginBottom: "20px"}}>
                        {discountProducts.map(p => <ProductCard key={p.id} p={p} />)}
                      </div>
                  </div>
                )}

                <div style={{marginTop:"14px"}}>
                    <div className="titleRow">
                        <div>
                            <h3 className="h1" id="landingListTitle">{landingCategory === "Semua Barang" ? "Produk" : `Produk: ${landingCategory}`}</h3>
                            <div className="p" id="landingListSub">{landingSearch ? `Hasil pencarian: "${landingSearch}"` : "Menampilkan produk aktif."}</div>
                        </div>
                    </div>
                    <div className="productsGrid" id="landingGrid" style={{marginTop:"12px"}}>
                      {loading ? (
                        <div style={{gridColumn:"1/-1", textAlign:"center", padding:"24px", color:"var(--muted)", fontWeight:900}}>Memuat produk...</div>
                      ) : filteredProducts.length === 0 ? (
                        <div style={{gridColumn:"1/-1", textAlign:"center", padding:"24px", color:"var(--muted)", fontWeight:900}}>Produk tidak ditemukan.</div>
                      ) : (
                        filteredProducts.map(p => <ProductCard key={p.id} p={p} />)
                      )}
                    </div>
                </div>
            </div>
        </section>
      </main>

      {/* Quick Buy Modal */}
      {quickBuyProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setQuickBuyProduct(null)}>
            <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', width: '90%', maxWidth: '420px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setQuickBuyProduct(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}>
                    <i className="fas fa-times"></i>
                </button>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: 800 }}>Pilih Varian & Jumlah</h3>
                
                {/* Product Summary */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '16px' }}>
                    <img src={quickBuyProduct.image_url || "https://cdn-icons-png.flaticon.com/512/3081/3081840.png"} alt={quickBuyProduct.name} style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontWeight: 800, color: 'var(--dark)', fontSize: '0.95rem', marginBottom: '4px' }}>{quickBuyProduct.name}</div>
                        {(() => {
                            const p = quickBuyProduct;
                            const hasDisc = Number(p.discount || 0) > 0;
                            const basePrice = quickBuyVariant ? Number(quickBuyVariant.price) : Number(p.price);
                            const finalPrice = hasDisc ? Math.round(basePrice - (basePrice * (p.discount / 100))) : basePrice;
                            return <div style={{ color: 'var(--secondary)', fontWeight: 900, fontSize: '1.1rem', marginBottom: '2px' }}>{rupiah(finalPrice)}</div>
                        })()}
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Sisa stok: <b style={{color: 'var(--dark)'}}>{quickBuyVariant ? quickBuyVariant.stock : quickBuyProduct.stock}</b></div>
                    </div>
                </div>

                {/* Variants */}
                {quickBuyProduct.variants && quickBuyProduct.variants.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Pilih Varian: <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{quickBuyVariant?.name}</span></div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {quickBuyProduct.variants.map((v) => {
                                const isSelected = quickBuyVariant?.id === v.id;
                                return (
                                    <button key={v.id} onClick={() => { setQuickBuyVariant(v); setQuickBuyQty(1); }} style={{ padding: '8px 16px', borderRadius: '12px', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`, background: isSelected ? '#e6f7eb' : '#fff', color: isSelected ? 'var(--primary)' : 'var(--dark)', fontWeight: isSelected ? 800 : 600, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}>
                                        {v.name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Quantity */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Atur Jumlah</div>
                    <div className="qtyStepper" style={{ background: '#f8fafc', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <button className="qtyMiniBtn" style={{ background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} onClick={() => setQuickBuyQty(Math.max(1, quickBuyQty - 1))} disabled={quickBuyQty <= 1}>-</button>
                        <div className="qtyStepperVal" style={{ fontWeight: 800 }}>{quickBuyQty}</div>
                        <button className="qtyMiniBtn" style={{ background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} onClick={() => {
                            const maxStock = quickBuyVariant ? Number(quickBuyVariant.stock) : Number(quickBuyProduct.stock);
                            setQuickBuyQty(Math.min(maxStock, quickBuyQty + 1));
                        }} disabled={quickBuyQty >= (quickBuyVariant ? Number(quickBuyVariant.stock) : Number(quickBuyProduct.stock))}>+</button>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn" style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '2px solid var(--primary)', background: '#fff', color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={() => {
                        addToCart(quickBuyProduct, quickBuyQty, quickBuyVariant);
                        showToast("Produk dimasukkan ke keranjang!", "success");
                        setQuickBuyProduct(null);
                    }}>
                        <i className="fas fa-cart-plus"></i> + Keranjang
                    </button>
                    <button className="btn btnPrimary" style={{ flex: 1, padding: '12px', borderRadius: '14px', fontWeight: 800, fontSize: '0.9rem', border: '2px solid var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={() => {
                        addToCart(quickBuyProduct, quickBuyQty, quickBuyVariant);
                        setQuickBuyProduct(null);
                        router.push('/keranjang');
                    }}>
                        <i className="fas fa-shopping-basket"></i> Beli Langsung
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  )
}
