"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function DiscountsPage() {
    const [activeTab, setActiveTab] = useState('produk') // 'produk' or 'voucher'
    const [products, setProducts] = useState([])
    const [vouchers, setVouchers] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingVouchers, setLoadingVouchers] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    
    // Toast state
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })

    const supabase = createClient()

    useEffect(() => {
        fetchProducts()
        fetchVouchers()
    }, [])

    async function fetchProducts() {
        setLoading(true)
        const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true })
        if (data) setProducts(data)
        setLoading(false)
    }

    async function fetchVouchers() {
        setLoadingVouchers(true)
        try {
            const { data, error } = await supabase.from('vouchers').select('*').order('created_at', { ascending: false })
            if (data) setVouchers(data)
        } catch (err) {
            console.log("Vouchers table not found or error fetching")
        }
        setLoadingVouchers(false)
    }

    function showToast(msg, type='success') {
        setToast({ show: true, msg, type })
        setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000)
    }

    // ==========================================
    // DISKON PRODUK LOGIC
    // ==========================================
    const [bulkDiscount, setBulkDiscount] = useState('')
    const [bulkEndDate, setBulkEndDate] = useState('')
    const [editValues, setEditValues] = useState({})
    const [editEndDates, setEditEndDates] = useState({})

    const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))

    function formatRupiah(n) {
        if (!n) return "Rp 0"
        return "Rp " + Number(n).toLocaleString('id-ID')
    }

    async function handleSaveDiscount(id, newDiscount, newEndDate) {
        let val = parseInt(newDiscount) || 0
        if (val < 0) val = 0
        if (val > 100) val = 100

        const payload = { discount: val, discount_end_date: newEndDate || null }

        const { error } = await supabase.from('products').update(payload).eq('id', id)
        if (error) {
            showToast("Gagal menyimpan diskon", "error")
        } else {
            setProducts(products.map(p => p.id === id ? { ...p, ...payload } : p))
            showToast("Diskon berhasil disimpan")
        }
    }

    async function handleBulkDiscount() {
        let val = parseInt(bulkDiscount) || 0
        if (val < 0) val = 0
        if (val > 100) val = 100

        if(!confirm(`Apakah Anda yakin ingin menerapkan diskon ${val}% ke ${filteredProducts.length} produk yang tampil?`)) return;

        setLoading(true)
        let successCount = 0
        for (const p of filteredProducts) {
            const payload = { discount: val, discount_end_date: bulkEndDate || null }
            const { error } = await supabase.from('products').update(payload).eq('id', p.id)
            if (!error) successCount++
        }
        await fetchProducts()
        setBulkDiscount('')
        setBulkEndDate('')
        showToast(`Berhasil menerapkan diskon ke ${successCount} produk`)
    }

    function handleLocalChange(id, val) {
        setEditValues(prev => ({ ...prev, [id]: val }))
    }

    function handleLocalEndDateChange(id, val) {
        setEditEndDates(prev => ({ ...prev, [id]: val }))
    }

    // ==========================================
    // VOUCHER LOGIC
    // ==========================================
    const [isAddingVoucher, setIsAddingVoucher] = useState(false)
    const [newVoucher, setNewVoucher] = useState({
        code: '',
        discount_amount: '',
        discount_type: 'percent',
        min_purchase: 0,
        max_discount: '',
        quota: '',
        valid_until: ''
    })

    async function handleCreateVoucher(e) {
        e.preventDefault()
        const payload = {
            code: newVoucher.code,
            discount_amount: Number(newVoucher.discount_amount),
            discount_type: newVoucher.discount_type,
            min_purchase: Number(newVoucher.min_purchase) || 0,
            max_discount: newVoucher.discount_type === 'percent' && newVoucher.max_discount ? Number(newVoucher.max_discount) : null,
            quota: newVoucher.quota ? Number(newVoucher.quota) : null,
            valid_until: newVoucher.valid_until || null
        }
        
        try {
            const { data, error } = await supabase.from('vouchers').insert([payload]).select()
            if (error) {
                if (error.code === '23505') showToast("Kode Promo sudah digunakan!", "error")
                else showToast("Gagal membuat voucher: Tabel belum dibuat?", "error")
            } else {
                showToast("Berhasil membuat kode promo baru!")
                setIsAddingVoucher(false)
                setNewVoucher({ code: '', discount_amount: '', discount_type: 'percent', min_purchase: 0, max_discount: '', quota: '', valid_until: '' })
                fetchVouchers()
            }
        } catch (err) {
            showToast("Error sistem", "error")
        }
    }

    async function handleDeleteVoucher(id) {
        if(!confirm("Yakin ingin menghapus voucher ini?")) return;
        const { error } = await supabase.from('vouchers').delete().eq('id', id)
        if (error) {
            showToast("Gagal menghapus voucher", "error")
        } else {
            showToast("Voucher berhasil dihapus")
            fetchVouchers()
        }
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            
            {/* Toast Notification */}
            {toast.show && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
                    background: toast.type === 'success' ? '#10b981' : '#ef4444',
                    color: '#fff', padding: '12px 24px', borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 600,
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Diskon & Promosi</h1>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Kelola potongan harga dan kode promo pelanggan.</p>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
                <button 
                    onClick={() => setActiveTab('produk')}
                    style={{ 
                        padding: '12px 24px', background: 'transparent', border: 'none', fontWeight: 700, cursor: 'pointer',
                        borderBottom: activeTab === 'produk' ? '2px solid #10b981' : '2px solid transparent',
                        color: activeTab === 'produk' ? '#10b981' : '#64748b',
                        marginBottom: '-2px', transition: 'all 0.2s'
                    }}
                >
                    <i className="fas fa-tags" style={{ marginRight: '8px' }}></i> Diskon Produk Langsung
                </button>
                <button 
                    onClick={() => setActiveTab('voucher')}
                    style={{ 
                        padding: '12px 24px', background: 'transparent', border: 'none', fontWeight: 700, cursor: 'pointer',
                        borderBottom: activeTab === 'voucher' ? '2px solid #10b981' : '2px solid transparent',
                        color: activeTab === 'voucher' ? '#10b981' : '#64748b',
                        marginBottom: '-2px', transition: 'all 0.2s'
                    }}
                >
                    <i className="fas fa-ticket-alt" style={{ marginRight: '8px' }}></i> Manajemen Kode Voucher
                </button>
            </div>

            {/* CONTENT: DISKON PRODUK */}
            {activeTab === 'produk' && (
                <div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }}></i>
                            <input 
                                type="text" 
                                placeholder="Cari produk untuk didiskon..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderLeft: '1px solid #e2e8f0', paddingLeft: '16px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Diskon Massal:</span>
                            <input 
                                type="number" 
                                placeholder="%" 
                                value={bulkDiscount}
                                onChange={e => setBulkDiscount(e.target.value)}
                                style={{ width: '70px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                                min="0" max="100"
                            />
                            <input 
                                type="datetime-local" 
                                value={bulkEndDate}
                                onChange={e => setBulkEndDate(e.target.value)}
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.85rem' }}
                                title="Batas Waktu (Kosongkan jika Unlimited)"
                            />
                            <button 
                                onClick={handleBulkDiscount}
                                style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Terapkan
                            </button>
                        </div>
                    </div>

                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}><i className="fas fa-circle-notch fa-spin fa-2x mb-2"></i></div>
                        ) : filteredProducts.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Tidak ada produk yang ditemukan.</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <tr>
                                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>PRODUK</th>
                                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>HARGA ASLI</th>
                                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b', fontWeight: 700, width: '150px' }}>DISKON (%)</th>
                                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>BATAS WAKTU</th>
                                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>HARGA AKHIR</th>
                                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b', fontWeight: 700, textAlign: 'right' }}>AKSI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map(p => {
                                            const currentDiscount = editValues[p.id] !== undefined ? editValues[p.id] : (p.discount || 0)
                                            const origDateStr = p.discount_end_date ? new Date(p.discount_end_date).toISOString().slice(0, 16) : ''
                                            const currentEndDate = editEndDates[p.id] !== undefined ? editEndDates[p.id] : origDateStr
                                            const finalPrice = Math.round(p.price - (p.price * (currentDiscount / 100)))
                                            const hasChanged = (editValues[p.id] !== undefined && editValues[p.id] !== String(p.discount || 0)) || (editEndDates[p.id] !== undefined && editEndDates[p.id] !== origDateStr)

                                            return (
                                                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', overflow: 'hidden', flexShrink: 0 }}>
                                                                <img src={p.image_url || 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png'} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            </div>
                                                            <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{p.name}</div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px', color: '#64748b', fontWeight: 500, fontSize: '0.9rem' }}>{formatRupiah(p.price)}</td>
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <input 
                                                                type="number" min="0" max="100" value={currentDiscount}
                                                                onChange={(e) => handleLocalChange(p.id, e.target.value)}
                                                                style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', textAlign: 'center' }}
                                                            />
                                                            <span style={{ color: '#64748b', fontWeight: 600 }}>%</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <input 
                                                                type="datetime-local" value={currentEndDate}
                                                                onChange={(e) => handleLocalEndDateChange(p.id, e.target.value)}
                                                                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.8rem', width: '100%', minWidth: '130px' }}
                                                            />
                                                            {currentEndDate && <span style={{ fontSize: '0.75rem', color: '#ef4444', cursor: 'pointer', display: 'inline-block', marginTop: '2px' }} onClick={() => handleLocalEndDateChange(p.id, '')}>Hapus Waktu</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ fontWeight: 700, color: currentDiscount > 0 ? '#10b981' : '#334155', fontSize: '0.95rem' }}>{formatRupiah(finalPrice)}</div>
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                                        {hasChanged ? (
                                                            <button 
                                                                onClick={() => {
                                                                    handleSaveDiscount(p.id, currentDiscount, currentEndDate)
                                                                    setEditValues(prev => { const next = {...prev}; delete next[p.id]; return next; })
                                                                    setEditEndDates(prev => { const next = {...prev}; delete next[p.id]; return next; })
                                                                }}
                                                                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
                                                            >
                                                                Simpan
                                                            </button>
                                                        ) : (
                                                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Tersimpan</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* CONTENT: VOUCHER */}
            {activeTab === 'voucher' && (
                <div>
                    {!isAddingVoucher ? (
                        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => setIsAddingVoucher(true)}
                                style={{ background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <i className="fas fa-plus"></i> Buat Promo Baru
                            </button>
                        </div>
                    ) : (
                        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px' }}>Buat Kode Voucher Baru</h3>
                            <form onSubmit={handleCreateVoucher}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px' }}>Kode Promo (Unik)</label>
                                        <input required type="text" placeholder="Misal: Ramadan20" value={newVoucher.code} onChange={e => setNewVoucher({...newVoucher, code: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px' }}>Tipe Diskon</label>
                                        <select value={newVoucher.discount_type} onChange={e => setNewVoucher({...newVoucher, discount_type: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                                            <option value="percent">Persentase (%)</option>
                                            <option value="fixed">Nominal Rupiah (Rp)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px' }}>Besar Diskon</label>
                                        <input required type="number" min="1" placeholder={newVoucher.discount_type === 'percent' ? "Misal: 10" : "Misal: 15000"} value={newVoucher.discount_amount} onChange={e => setNewVoucher({...newVoucher, discount_amount: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px' }}>Minimal Pembelian (Rp)</label>
                                        <input type="number" min="0" placeholder="Opsional" value={newVoucher.min_purchase} onChange={e => setNewVoucher({...newVoucher, min_purchase: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                                    </div>
                                    {newVoucher.discount_type === 'percent' && (
                                        <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px' }}>Maksimal Diskon (Rp)</label>
                                        <input type="number" min="0" placeholder="Opsional" value={newVoucher.max_discount} onChange={e => setNewVoucher({...newVoucher, max_discount: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px' }}>Kuota Penggunaan Total</label>
                                        <input type="number" min="1" placeholder="Kosongkan jika tidak terbatas" value={newVoucher.quota} onChange={e => setNewVoucher({...newVoucher, quota: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px' }}>Tanggal Berlaku (Opsional)</label>
                                        <input type="date" value={newVoucher.valid_until} onChange={e => setNewVoucher({...newVoucher, valid_until: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                                    </div>
                                </div>
                            </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setIsAddingVoucher(false)} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #cbd5e1', color: 'var(--dark)', fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}>Batal</button>
                                    <button type="submit" style={{ padding: '12px 24px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}>Simpan Promo</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        {loadingVouchers ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}><i className="fas fa-circle-notch fa-spin fa-2x mb-2"></i></div>
                        ) : vouchers.length === 0 ? (
                            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                                <i className="fas fa-ticket-alt" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '16px' }}></i>
                                <h3 style={{ fontSize: '1.1rem', color: 'var(--dark)', fontWeight: 700, marginBottom: '8px' }}>Belum ada kode promo</h3>
                                <p style={{ fontSize: '0.9rem' }}>Buat kode pertamamu untuk dibagikan ke pelanggan!</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <tr>
                                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>KODE PROMO</th>
                                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>BESAR DISKON</th>
                                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>SYARAT BELANJA</th>
                                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>KUOTA / BERLAKU HINGGA</th>
                                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b', fontWeight: 700, textAlign: 'right' }}>AKSI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vouchers.map(v => (
                                            <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'inline-block', background: '#ecfdf5', color: '#10b981', border: '1px dashed #10b981', padding: '6px 12px', borderRadius: '6px', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '1px' }}>
                                                        {v.code}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', fontWeight: 700, color: 'var(--dark)' }}>
                                                    {v.discount_type === 'percent' ? `${v.discount_amount}%` : formatRupiah(v.discount_amount)}
                                                    {v.discount_type === 'percent' && v.max_discount && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500, marginTop: '4px' }}>Maks. {formatRupiah(v.max_discount)}</div>}
                                                </td>
                                                <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--muted)' }}>
                                                    {v.min_purchase > 0 ? `Min. ${formatRupiah(v.min_purchase)}` : 'Tanpa minimum'}
                                                </td>
                                                <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--muted)' }}>
                                                    <div>Kuota: {v.quota ? `${v.used_count || 0} / ${v.quota}` : 'Tidak terbatas'}</div>
                                                    <div style={{ marginTop: '4px' }}>Berlaku s/d: {v.valid_until ? new Date(v.valid_until).toLocaleDateString('id-ID') : 'Tidak terbatas'}</div>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                                    <button onClick={() => handleDeleteVoucher(v.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
