"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function DiscountsPage() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [bulkDiscount, setBulkDiscount] = useState('')
    const [bulkEndDate, setBulkEndDate] = useState('')
    
    // Toast state
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })

    const supabase = createClient()

    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        setLoading(true)
        const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true })
        if (data) setProducts(data)
        setLoading(false)
    }

    const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))

    function formatRupiah(n) {
        if (!n) return "Rp 0"
        return "Rp " + Number(n).toLocaleString('id-ID')
    }

    function showToast(msg, type='success') {
        setToast({ show: true, msg, type })
        setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000)
    }

    // Handle individual discount save
    async function handleSaveDiscount(id, newDiscount, newEndDate) {
        let val = parseInt(newDiscount) || 0
        if (val < 0) val = 0
        if (val > 100) val = 100

        const payload = { discount: val, discount_end_date: newEndDate || null }

        const { error } = await supabase.from('products').update(payload).eq('id', id)
        if (error) {
            console.error(error)
            showToast("Gagal menyimpan diskon", "error")
        } else {
            setProducts(products.map(p => p.id === id ? { ...p, ...payload } : p))
            showToast("Diskon berhasil disimpan")
        }
    }

    // Handle bulk discount save
    async function handleBulkDiscount() {
        let val = parseInt(bulkDiscount) || 0
        if (val < 0) val = 0
        if (val > 100) val = 100

        if(!confirm(`Apakah Anda yakin ingin menerapkan diskon ${val}% ke ${filteredProducts.length} produk yang tampil?`)) return;

        setLoading(true)
        
        // Update each filtered product
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

    // Local state to track input changes before saving
    const [editValues, setEditValues] = useState({})
    const [editEndDates, setEditEndDates] = useState({})

    function handleLocalChange(id, val) {
        setEditValues(prev => ({ ...prev, [id]: val }))
    }

    function handleLocalEndDateChange(id, val) {
        setEditEndDates(prev => ({ ...prev, [id]: val }))
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
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Kelola potongan harga untuk menarik lebih banyak pembeli.</p>
                </div>
            </div>

            {/* Toolbar */}
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
                        style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Terapkan
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        <i className="fas fa-circle-notch fa-spin fa-2x mb-2"></i>
                        <p>Memuat data...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        <p>Tidak ada produk yang ditemukan.</p>
                    </div>
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
                                    
                                    const hasChangedDiscount = editValues[p.id] !== undefined && editValues[p.id] !== String(p.discount || 0)
                                    const hasChangedDate = editEndDates[p.id] !== undefined && editEndDates[p.id] !== origDateStr
                                    const hasChanged = hasChangedDiscount || hasChangedDate

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
                                            <td style={{ padding: '16px', color: '#64748b', fontWeight: 500, fontSize: '0.9rem' }}>
                                                {formatRupiah(p.price)}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <input 
                                                        type="number" 
                                                        min="0" max="100"
                                                        value={currentDiscount}
                                                        onChange={(e) => handleLocalChange(p.id, e.target.value)}
                                                        style={{ 
                                                            width: '60px', padding: '8px', borderRadius: '6px', 
                                                            border: hasChangedDiscount ? '1px solid var(--primary)' : '1px solid #cbd5e1', 
                                                            outline: 'none', textAlign: 'center' 
                                                        }}
                                                    />
                                                    <span style={{ color: '#64748b', fontWeight: 600 }}>%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <input 
                                                        type="datetime-local" 
                                                        value={currentEndDate}
                                                        onChange={(e) => handleLocalEndDateChange(p.id, e.target.value)}
                                                        style={{ 
                                                            padding: '8px', borderRadius: '6px', 
                                                            border: hasChangedDate ? '1px solid var(--primary)' : '1px solid #cbd5e1', 
                                                            outline: 'none', fontSize: '0.8rem', width: '100%', minWidth: '130px'
                                                        }}
                                                    />
                                                    {currentEndDate ? (
                                                        <span style={{ fontSize: '0.75rem', color: '#ef4444', cursor: 'pointer', display: 'inline-block', marginTop: '2px' }} onClick={() => handleLocalEndDateChange(p.id, '')}>Set Unlimited</span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Unlimited</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontWeight: 700, color: currentDiscount > 0 ? 'var(--secondary)' : '#334155', fontSize: '0.95rem' }}>
                                                    {formatRupiah(finalPrice)}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                {hasChanged ? (
                                                    <button 
                                                        onClick={() => {
                                                            handleSaveDiscount(p.id, currentDiscount, currentEndDate)
                                                            setEditValues(prev => { const next = {...prev}; delete next[p.id]; return next; })
                                                            setEditEndDates(prev => { const next = {...prev}; delete next[p.id]; return next; })
                                                        }}
                                                        style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
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

            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
