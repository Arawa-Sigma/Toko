"use client"
import { useStore, useUIStore } from "@/lib/store"
import { useRouter } from 'next/navigation'
import { makeSlug } from "@/lib/utils"
export default function ProductCard({ product, onQuickBuy }) {
    const p = product;
    const router = useRouter()
    const { wishlist, toggleWishlist, addToCart } = useStore()
    const showToast = useUIStore((state) => state.showToast)
    
    const rupiah = (num) => "Rp " + Number(num).toLocaleString('id-ID')

    const hasDisc = Number(p.discount || 0) > 0
    const price = Number(p.price || 0)
    const finalPrice = hasDisc ? Math.round(price - (price * (p.discount / 100))) : price
    const isWish = wishlist.includes(p.id)
    const img = p.image_url ? p.image_url : "https://cdn-icons-png.flaticon.com/512/3081/3081840.png"
    const stockTotal = Number(p.stock || 0)
    const isOut = stockTotal <= 0
    const ratingRaw = Number(p.rating || 0)
    const rating = Math.max(0, Math.min(5, ratingRaw))
    const filledStars = Math.floor(rating)
    const emptyStars = 5 - filledStars
    const stars = "★".repeat(filledStars) + "☆".repeat(emptyStars)

    const handleQuickBuy = async (e) => {
        e.stopPropagation();
        if (onQuickBuy) {
            onQuickBuy(p);
        } else if (p.variants && p.variants.length > 0) {
            router.push(`/product/${p.slug || makeSlug(p.name, p.id)}`)
        } else {
            const success = await addToCart(p, 1, null)
            if (success) showToast("Berhasil dimasukkan ke keranjang!", "success")
        }
    }

    return (
      <div className="prod" style={{ cursor: 'pointer' }} onClick={() => router.push(`/product/${p.slug || makeSlug(p.name, p.id)}`)}>
        {hasDisc && <div className="tag">Diskon {p.discount}%</div>}
        <button 
          className={`wish ${isWish ? "active" : ""}`} 
          onClick={async (e) => { e.stopPropagation(); await toggleWishlist(p.id) }} 
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
            <button className="btn btnPrimary" onClick={handleQuickBuy} disabled={stockTotal <= 0}>
                <i className="fas fa-shopping-basket"></i> Beli Langsung
            </button>
        </div>
      </div>
    )
}
