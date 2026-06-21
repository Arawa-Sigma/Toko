import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      // Authentication State
      session: null,
      setSession: (user) => set({ session: user }),
      logout: () => set({ session: null }),

      // UI State
      landingCategory: 'Semua Barang',
      setLandingCategory: (cat) => set({ landingCategory: cat }),
      landingSearch: '',
      setLandingSearch: (query) => set({ landingSearch: query }),

      // Cart State
      cart: [],
      addToCart: (product, qty = 1, variant = null) => set((state) => {
        const uniqueId = variant ? `${product.id}-${variant.id}` : product.id;
        const existing = state.cart.find(i => (i.uniqueId || i.productId) === uniqueId)
        if (existing) {
          return { cart: state.cart.map(i => (i.uniqueId || i.productId) === uniqueId ? { ...i, qty: i.qty + qty } : i) }
        }
        return { cart: [...state.cart, { uniqueId, productId: product.id, qty, variant }] }
      }),
      removeFromCart: (uniqueId) => set((state) => ({
        cart: state.cart.filter(i => String(i.uniqueId || i.productId || i.id) !== String(uniqueId))
      })),
      updateCartQty: (uniqueId, qty) => set((state) => ({
        cart: state.cart.map(i => String(i.uniqueId || i.productId || i.id) === String(uniqueId) ? { ...i, qty } : i)
      })),
      clearCart: () => set({ cart: [] }),

      // Voucher management
      appliedVoucher: null,
      setAppliedVoucher: (voucher) => set({ appliedVoucher: voucher }),
      clearAppliedVoucher: () => set({ appliedVoucher: null }),

      // Wishlist State
      wishlist: [],
      toggleWishlist: (productId) => set((state) => {
        if (state.wishlist.includes(productId)) {
          return { wishlist: state.wishlist.filter(id => id !== productId) }
        }
        return { wishlist: [...state.wishlist, productId] }
      }),

      // Checkout State
      selectedForCheckout: [],
      setSelectedForCheckout: (items) => set({ selectedForCheckout: items }),
    }),
    {
      name: 'sembako-berkah-storage', // unique name for localStorage
    }
  )
)

export const useUIStore = create((set, get) => ({
  toastMessage: null,
  toastType: 'success', // 'success' | 'error' | 'info'
  toastTimeoutId: null,
  showToast: (msg, type = 'success') => {
    // Bersihkan timeout lama jika ada (mencegah bug hilang tiba-tiba saat di-spam klik)
    const currentTimeout = get().toastTimeoutId;
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }
    
    // Tampilkan pesan baru dan buat timer baru (7 detik agar lebih lama dibaca)
    const newTimeout = setTimeout(() => {
      set({ toastMessage: null, toastTimeoutId: null })
    }, 7000);

    set({ toastMessage: msg, toastType: type, toastTimeoutId: newTimeout })
  },
  hideToast: () => {
    const currentTimeout = get().toastTimeoutId;
    if (currentTimeout) clearTimeout(currentTimeout);
    set({ toastMessage: null, toastTimeoutId: null })
  }
}))
