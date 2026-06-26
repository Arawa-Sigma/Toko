import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      // Authentication State
      session: null,
      setSession: (user) => {
         set({ session: user })
         if (user) {
            get().syncCartFromSupabase()
            get().syncWishlistFromSupabase()
         } else {
            set({ cart: [], wishlist: [], selectedForCheckout: [], appliedVoucher: null })
         }
      },
      logout: () => get().setSession(null),

      // UI State
      landingCategory: 'Semua Barang',
      setLandingCategory: (cat) => set({ landingCategory: cat }),
      landingSearch: '',
      setLandingSearch: (query) => set({ landingSearch: query }),

      // Cart State
      cart: [],
      syncCartFromSupabase: async () => {
        const session = get().session;
        if (!session) return;
        try {
          const { createClient } = await import('@/lib/supabaseClient');
          const supabase = createClient();
          const { data, error } = await supabase.from('cart_items').select('*').eq('user_id', session.user.id);
          if (!error && data) {
            const formattedCart = data.map(item => ({
              dbId: item.id,
              productId: item.product_id,
              variant: item.variant_id ? { id: item.variant_id, name: item.variant_id } : null,
              qty: item.qty,
              uniqueId: item.variant_id ? `${item.product_id}-${item.variant_id}` : item.product_id
            }));
            set({ cart: formattedCart });
          }
        } catch (e) { console.error("Sync error", e); }
      },
      addToCart: async (product, qty = 1, variant = null) => {
        const session = get().session;
        if (!session) {
          useUIStore.getState().showToast("Harap login terlebih dahulu untuk memasukkan ke keranjang", "error");
          if (typeof window !== 'undefined') window.location.href = '/auth';
          return false;
        }

        const uniqueId = variant ? `${product.id}-${variant.id}` : product.id;
        const existing = get().cart.find(i => (i.uniqueId || i.productId) === uniqueId);
        
        // Optimistic UI Update
        if (existing) {
          set((state) => ({ cart: state.cart.map(i => (i.uniqueId || i.productId) === uniqueId ? { ...i, qty: i.qty + qty } : i) }));
        } else {
          set((state) => ({ cart: [...state.cart, { uniqueId, productId: product.id, qty, variant }] }));
        }

        // Background Sync to Supabase
        try {
          const { createClient } = await import('@/lib/supabaseClient');
          const supabase = createClient();
          if (existing && existing.dbId) {
            await supabase.from('cart_items').update({ qty: existing.qty + qty }).eq('id', existing.dbId);
          } else {
            let dbItem = null;
            if (existing) {
               const query = supabase.from('cart_items').select('id').eq('user_id', session.user.id).eq('product_id', product.id);
               if (variant) query.eq('variant_id', variant.id);
               else query.is('variant_id', null);
               const { data } = await query.maybeSingle();
               dbItem = data;
            }

            if (dbItem) {
               await supabase.from('cart_items').update({ qty: existing.qty + qty }).eq('id', dbItem.id);
               set((state) => ({ cart: state.cart.map(i => (i.uniqueId || i.productId) === uniqueId ? { ...i, dbId: dbItem.id } : i) }));
            } else {
                const { data, error } = await supabase.from('cart_items').insert([{
                  user_id: session.user.id,
                  product_id: product.id,
                  variant_id: variant ? variant.id : null,
                  qty: existing ? existing.qty + qty : qty
                }]).select().single();
                
                if (data) {
                   set((state) => ({ cart: state.cart.map(i => (i.uniqueId || i.productId) === uniqueId ? { ...i, dbId: data.id } : i) }));
                }
            }
          }
        } catch (e) { console.error("Sync error", e); }
        return true;
      },
      removeFromCart: async (uniqueId) => {
        const item = get().cart.find(i => String(i.uniqueId || i.productId || i.id) === String(uniqueId));
        set((state) => ({ cart: state.cart.filter(i => String(i.uniqueId || i.productId || i.id) !== String(uniqueId)) }));
        
        if (item && item.dbId) {
           try {
             const { createClient } = await import('@/lib/supabaseClient');
             const supabase = createClient();
             await supabase.from('cart_items').delete().eq('id', item.dbId);
           } catch (e) { console.error("Sync error", e); }
        }
      },
      updateCartQty: async (uniqueId, qty) => {
        const item = get().cart.find(i => String(i.uniqueId || i.productId || i.id) === String(uniqueId));
        set((state) => ({ cart: state.cart.map(i => String(i.uniqueId || i.productId || i.id) === String(uniqueId) ? { ...i, qty } : i) }));
        
        if (item && item.dbId) {
           try {
             const { createClient } = await import('@/lib/supabaseClient');
             const supabase = createClient();
             await supabase.from('cart_items').update({ qty }).eq('id', item.dbId);
           } catch (e) { console.error("Sync error", e); }
        }
      },
      clearCart: async () => {
        const session = get().session;
        set({ cart: [] });
        if (session) {
           try {
             const { createClient } = await import('@/lib/supabaseClient');
             const supabase = createClient();
             await supabase.from('cart_items').delete().eq('user_id', session.user.id);
           } catch (e) { console.error("Sync error", e); }
        }
      },

      // Voucher management
      appliedVoucher: null,
      setAppliedVoucher: (voucher) => set({ appliedVoucher: voucher }),
      clearAppliedVoucher: () => set({ appliedVoucher: null }),

      // Wishlist State
      wishlist: [],
      syncWishlistFromSupabase: async () => {
        const session = get().session;
        if (!session) return;
        try {
          const { createClient } = await import('@/lib/supabaseClient');
          const supabase = createClient();
          const { data, error } = await supabase.from('wishlists').select('*').eq('user_id', session.user.id);
          if (!error && data) {
            set({ wishlist: data.map(item => item.product_id) });
          }
        } catch (e) { console.error("Sync error", e); }
      },
      toggleWishlist: async (productId) => {
        const session = get().session;
        if (!session) {
          useUIStore.getState().showToast("Harap login terlebih dahulu untuk menyimpan ke wishlist", "error");
          if (typeof window !== 'undefined') window.location.href = '/auth';
          return false;
        }

        const isAdded = get().wishlist.includes(productId);
        // Optimistic UI
        if (isAdded) {
          set((state) => ({ wishlist: state.wishlist.filter(id => id !== productId) }));
        } else {
          set((state) => ({ wishlist: [...state.wishlist, productId] }));
        }

        // Supabase Sync
        try {
          const { createClient } = await import('@/lib/supabaseClient');
          const supabase = createClient();
          if (isAdded) {
            await supabase.from('wishlists').delete().eq('user_id', session.user.id).eq('product_id', productId);
          } else {
            await supabase.from('wishlists').insert([{ user_id: session.user.id, product_id: productId }]);
          }
        } catch (e) { console.error("Sync error", e); }
        return true;
      },

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
