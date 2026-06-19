"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useStore, useUIStore } from "@/lib/store"
import { createClient } from "@/lib/supabaseClient"

export default function Storefront() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { cart, addToCart, removeFromCart, updateCartQty, landingCategory, setLandingCategory, landingSearch, setLandingSearch, wishlist, toggleWishlist } = useStore()
  const showToast = useUIStore((state) => state.showToast)


  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true })
      if (data) setProducts(data)
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

  const ProductCard = ({ p }) => {
    const hasDisc = Number(p.discount || 0) > 0
    const price = Number(p.price || 0)
    const finalPrice = hasDisc ? price - (price * (p.discount / 100)) : price
    const isWish = wishlist.includes(p.id)
    const img = p.img ? p.img : "https://cdn-icons-png.flaticon.com/512/3081/3081840.png"
    const qtyInCart = getCartQty(p.id)
    const stockTotal = Number(p.stock || 0)
    const stockLeft = Math.max(0, stockTotal - qtyInCart)
    const isOut = stockLeft <= 0
    const rating = Math.max(1, Math.min(5, Number(p.rating || 5)))
    const stars = "★".repeat(rating) + "☆".repeat(5 - rating)

    return (
      <div className="prod">
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
        <div className="meta" style={{color:'var(--warn)', fontWeight:900}}>{stars}</div>
        <div className="meta">
            Stok tersedia: <b style={{color: stockLeft < 10 ? 'var(--danger)' : '#111827'}}>{stockLeft}</b>
        </div>
        <div className="prodFooter">
            {qtyInCart <= 0 ? (
                <button className="btn btnPrimary" onClick={() => addToCart(p)} disabled={stockTotal <= 0}>
                    <i className="fas fa-cart-plus"></i> Tambah ke Keranjang
                </button>
            ) : (
                <div className="qtyStepper">
                    <button className="qtyMiniBtn" onClick={() => changeQty(p.id, -1, stockTotal)}>-</button>
                    <div className="qtyStepperVal">{qtyInCart}</div>
                    <button className="qtyMiniBtn" onClick={() => changeQty(p.id, 1, stockTotal)} disabled={stockLeft <= 0}>+</button>
                </div>
            )}
        </div>
      </div>
    )
  }

  return (
    <>
      <main className="contentArea" id="mainContent">
        <section id="pageEtalase">
            <div className="hero" style={{
              background: "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url('https://picsum.photos/id/1018/2000/1200')", 
              backgroundSize: "cover", 
              backgroundPosition: "center", 
              minHeight: "380px", 
              display: "flex", 
              alignItems: "center", 
              borderRadius: "22px", 
              color: "white", 
              position: "relative"
            }}>
                <div style={{padding: "40px 50px", maxWidth: "620px"}}>
                    <div style={{display: "inline-block", background: "rgba(255,255,255,0.2)", padding: "4px 14px", borderRadius: "999px", fontSize: "0.85rem", marginBottom: "12px"}}>
                        <i className="fas fa-store"></i> Toko Kelontong Terpercaya
                    </div>
                    <h2 style={{fontSize: "2.6rem", lineHeight: 1.1, margin: "0 0 12px 0", fontWeight: 900}}>Belanja Sembako<br/>Mudah &amp; Terjangkau</h2>
                    <p style={{fontSize: "1.05rem", opacity: 0.95, maxWidth: "420px"}}>Ribuan pelanggan sudah percaya kepada kami. Nikmati pengalaman belanja yang cepat, aman, dan hemat.</p>
                    <div style={{display: "flex", gap: "12px", marginTop: "24px", flexWrap: "wrap"}}>
                        <button className="btn btnPrimary" style={{padding: "13px 26px", fontSize: "1rem"}} onClick={() => document.getElementById('landingGrid').scrollIntoView({behavior:'smooth'})}>
                            <i className="fas fa-shopping-bag"></i> Mulai Belanja
                        </button>
                        <Link href="/keranjang">
                            <button className="btn" style={{background: "white", color: "#111827", padding: "13px 26px", fontSize: "1rem", border: "none"}}>
                                <i className="fas fa-receipt"></i> Lihat Keranjang
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            <div style={{marginTop: "30px"}}>
                <div className="titleRow" style={{marginBottom: "16px"}}>
                    <div>
                        <h3 className="h1" style={{fontSize: "1.35rem"}}>Kenapa Memilih Kami?</h3>
                    </div>
                </div>
                <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px"}}>
                    <div className="card sectionPad" style={{textAlign: "center", padding: "22px 18px"}}>
                        <div style={{width: "52px", height: "52px", background: "#dcfce7", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px"}}>
                            <i className="fas fa-truck" style={{fontSize: "1.6rem", color: "#16a34a"}}></i>
                        </div>
                        <div style={{fontWeight: 900, fontSize: "1.05rem"}}>Pengiriman Cepat</div>
                        <div className="p" style={{marginTop: "6px"}}>Kurir JNE, J&amp;T, Grab, GoSend tersedia. Bisa ambil sendiri juga.</div>
                    </div>
                    <div className="card sectionPad" style={{textAlign: "center", padding: "22px 18px"}}>
                        <div style={{width: "52px", height: "52px", background: "#fef3c7", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px"}}>
                            <i className="fas fa-shield-alt" style={{fontSize: "1.6rem", color: "#ca8a04"}}></i>
                        </div>
                        <div style={{fontWeight: 900, fontSize: "1.05rem"}}>Kualitas Terjamin</div>
                        <div className="p" style={{marginTop: "6px"}}>Semua produk fresh dan dicek kualitasnya sebelum dikirim.</div>
                    </div>
                    <div className="card sectionPad" style={{textAlign: "center", padding: "22px 18px"}}>
                        <div style={{width: "52px", height: "52px", background: "#dbeafe", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px"}}>
                            <i className="fas fa-tags" style={{fontSize: "1.6rem", color: "#2563eb"}}></i>
                        </div>
                        <div style={{fontWeight: 900, fontSize: "1.05rem"}}>Harga Paling Kompetitif</div>
                        <div className="p" style={{marginTop: "6px"}}>Harga lebih murah dibanding supermarket dengan kualitas yang sama.</div>
                    </div>
                    <div className="card sectionPad" style={{textAlign: "center", padding: "22px 18px"}}>
                        <div style={{width: "52px", height: "52px", background: "#fce7f3", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px"}}>
                            <i className="fas fa-headset" style={{fontSize: "1.6rem", color: "#db2777"}}></i>
                        </div>
                        <div style={{fontWeight: 900, fontSize: "1.05rem"}}>Layanan Ramah 24/7</div>
                        <div className="p" style={{marginTop: "6px"}}>Tim customer service siap membantu kapan saja via WhatsApp.</div>
                    </div>
                </div>
            </div>

            <div className="card sectionPad" style={{marginTop:"16px"}}>
                <div className="titleRow">
                    <div>
                        <h3 className="h1" id="etalaseTitle">Kategori Pilihan</h3>
                        <div className="p" id="etalaseSub">Klik kategori untuk melihat produk. Semua produk bisa diedit di Dashboard Pemilik.</div>
                    </div>
                    <div style={{display:"flex", gap:"10px", flexWrap:"wrap"}}>
                        <Link href="/keranjang" style={{textDecoration: 'none'}}>
                            <span className="badge" id="cartBadge" style={{cursor:"pointer"}}>
                                <i className="fas fa-shopping-cart"></i> Keranjang: <span id="cartCount">{cartItemCount}</span>
                            </span>
                        </Link>
                        <button className="btn btnOutline" onClick={() => { setLandingCategory("Semua Barang"); setLandingSearch(""); }}><i className="fas fa-undo"></i> Reset Filter</button>
                    </div>
                </div>
                
                <div className="categoryBar" id="categoryBar">
                  {categories.map(cat => (
                    <div 
                      key={cat.name} 
                      className={`catCard ${landingCategory === cat.name ? 'active' : ''}`}
                      onClick={() => setLandingCategory(cat.name)}
                    >
                      <i className={`fas ${cat.icon}`}></i>
                      <span>{cat.name}</span>
                    </div>
                  ))}
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
    </>
  )
}
