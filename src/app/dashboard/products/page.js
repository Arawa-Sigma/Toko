"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function ProductsPage() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    
    // Modal State
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [isUploading, setIsUploading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        cost: '',
        stock: '',
        category: '',
        image_url: '',
        description: ''
    })

    const supabase = createClient()

    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        setLoading(true)
        const { data, error } = await supabase.from('products').select('*')
        if (data) setProducts(data)
        setLoading(false)
    }

    const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))

    function formatRupiah(n) {
        if (!n) return "Rp 0"
        return "Rp " + Number(n).toLocaleString('id-ID')
    }

    function openAddModal() {
        setEditingId(null)
        setFormData({ name: '', price: '', cost: '', stock: '', category: '', image_url: '', description: '' })
        setShowModal(true)
    }

    function openEditModal(product) {
        setEditingId(product.id)
        setFormData({
            name: product.name || '',
            price: product.price || '',
            cost: product.cost || '',
            stock: product.stock || '',
            category: product.category || '',
            image_url: product.image_url || '',
            description: product.description || ''
        })
        setShowModal(true)
    }

    async function handleFileUpload(e) {
        const file = e.target.files[0]
        if (!file) return

        setIsUploading(true)
        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            // Upload to supabase storage 'products' bucket
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file)

            if (uploadError) {
                console.error('Error uploading image: ', uploadError)
                alert("Gagal mengunggah gambar. Pastikan bucket 'products' sudah dibuat di Supabase.")
                setIsUploading(false)
                return
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath)

            setFormData({ ...formData, image_url: publicUrl })

        } catch (err) {
            console.error("Unknown error during upload: ", err)
        }
        setIsUploading(false)
    }

    async function handleSave(e) {
        e.preventDefault()

        const cleanName = formData.name.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const slug = editingId ? null : `${cleanName}-${Math.random().toString(36).substr(2, 6)}` // Only generate random suffix on create. Update can keep old slug or we just create a slug.

        const payload = {
            name: formData.name,
            price: Number(formData.price),
            cost: Number(formData.cost),
            stock: Number(formData.stock),
            category: formData.category || null,
            image_url: formData.image_url || null,
            description: formData.description || null
        }

        if (!editingId) {
            payload.slug = slug
        }

        if (editingId) {
            const { error } = await supabase.from('products').update(payload).eq('id', editingId)
            if (error) {
                console.error("Update error: ", error)
                alert("Gagal mengupdate produk: " + error.message)
                return
            }
        } else {
            const { error } = await supabase.from('products').insert([payload])
            if (error) {
                console.error("Insert error: ", error)
                alert("Gagal menambahkan produk: " + error.message)
                return
            }
        }

        setShowModal(false)
        fetchProducts()
    }

    async function handleDelete(id) {
        if(confirm('Yakin ingin menghapus produk ini?')) {
            await supabase.from('products').delete().eq('id', id)
            fetchProducts()
        }
    }

    async function handleToggleStatus(prod) {
        const newStatus = prod.status === 'nonaktif' ? 'aktif' : 'nonaktif'
        if(confirm(`Yakin ingin men-${newStatus}kan produk ini?`)) {
            const { error } = await supabase.from('products').update({ status: newStatus }).eq('id', prod.id)
            if (error) {
                alert("Gagal merubah status: " + error.message)
            } else {
                fetchProducts()
            }
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
            {/* Header Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
                <button onClick={openAddModal} style={{ background: 'linear-gradient(135deg, #05c112, #028e0b)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 8px 16px rgba(3,172,14,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-plus"></i> Tambah Produk
                </button>
            </div>

            {/* Controls Row */}
            <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                    <input 
                        type="text" 
                        placeholder="Cari nama produk..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#f8fafc' }}
                    />
                </div>
            </div>

            {/* Table Card */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px', textAlign: 'left', minWidth: '900px' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '0 20px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>Produk</th>
                                <th style={{ padding: '0 20px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>Kategori</th>
                                <th style={{ padding: '0 20px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>Harga Jual</th>
                                <th style={{ padding: '0 20px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>Stok</th>
                                <th style={{ padding: '0 20px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '0 20px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '10px' }}></i>
                                        <div>Memuat produk...</div>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                                        <i className="fas fa-box-open" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '16px' }}></i>
                                        <h3 style={{ margin: '0 0 8px', color: '#64748b' }}>Belum ada produk</h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem' }}>Klik "Tambah Produk" untuk mulai mengisi katalog jualanmu.</p>
                                    </td>
                                </tr>
                            ) : filteredProducts.map(prod => {
                                const isCritical = Number(prod.stock) <= 5
                                const isOut = Number(prod.stock) <= 0
                                const finalPrice = prod.price - (prod.price * (prod.discount || 0) / 100)
                                return (
                                <tr key={prod.id} style={{ background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <td style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }} />
                                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                                {prod.image_url ? <img src={prod.image_url} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-image" style={{ color: '#cbd5e1' }}></i>}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#334155', fontSize: '0.95rem' }}>{prod.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>
                                                    Jual: {formatRupiah(finalPrice)} &bull; Modal: {formatRupiah(prod.cost || 0)} &bull; Diskon: {prod.discount || 0}% &bull; Rating: 0
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '0.85rem', fontWeight: 500, borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>{prod.category || '-'}</td>
                                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '0.85rem', fontWeight: 500, borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>{formatRupiah(prod.price)}</td>
                                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '0.85rem', fontWeight: 500, borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>{prod.stock}</td>
                                    <td style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                                        {prod.status === 'nonaktif' ? (
                                            <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '999px', color: '#64748b', border: '1px solid #cbd5e1', fontSize: '0.7rem', fontWeight: 700, background: '#f8fafc' }}>nonaktif</span>
                                        ) : isOut ? (
                                            <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '999px', color: '#ef4444', border: '1px solid #fca5a5', fontSize: '0.7rem', fontWeight: 700 }}>habis</span>
                                        ) : isCritical ? (
                                            <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '999px', color: '#d97706', border: '1px solid #fcd34d', fontSize: '0.7rem', fontWeight: 700 }}>menipis</span>
                                        ) : (
                                            <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '999px', color: '#16a34a', border: '1px solid #86efac', fontSize: '0.7rem', fontWeight: 700 }}>aktif</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleToggleStatus(prod)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: prod.status === 'nonaktif' ? '#f0fdf4' : '#fff7ed', color: prod.status === 'nonaktif' ? '#16a34a' : '#ea580c', border: `1px solid ${prod.status === 'nonaktif' ? '#bbf7d0' : '#fed7aa'}`, padding: '6px 14px', borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                                                <i className={`fas ${prod.status === 'nonaktif' ? 'fa-eye' : 'fa-eye-slash'}`}></i> {prod.status === 'nonaktif' ? 'Aktifkan' : 'Nonaktifkan'}
                                            </button>
                                            <button onClick={() => openEditModal(prod)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '6px 14px', borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                                                <i className="fas fa-pencil-alt"></i> Edit
                                            </button>
                                            <button onClick={() => handleDelete(prod.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 14px', borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                                                <i className="fas fa-trash"></i> Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '540px', boxShadow: '0 24px 50px rgba(0,0,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
                        </div>
                        <div style={{ padding: '24px', overflowY: 'auto' }}>
                            <form id="productForm" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Nama Produk *</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }} placeholder="Contoh: Beras Ramos 5kg" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Kategori</label>
                                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', background: '#fff' }}>
                                            <option value="">-- Pilih Kategori --</option>
                                            <option value="Sembako">Sembako</option>
                                            <option value="Minuman">Minuman</option>
                                            <option value="Cemilan">Cemilan</option>
                                            <option value="Kebersihan">Kebersihan</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Sisa Stok *</label>
                                        <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }} placeholder="0" />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Harga Modal (Rp) *</label>
                                        <input required type="number" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }} placeholder="Contoh: 10000" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Harga Jual (Rp) *</label>
                                        <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }} placeholder="Contoh: 15000" />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Foto Produk (Opsional)</label>
                                    <div style={{ position: 'relative', width: '100%', height: '140px', border: '2px dashed #cbd5e1', borderRadius: '12px', background: formData.image_url ? `url(${formData.image_url}) center/contain no-repeat #f8fafc` : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                                        <input 
                                            type="file" 
                                            accept="image/png, image/jpeg, image/jpg" 
                                            onChange={handleFileUpload} 
                                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                                            title="Klik atau seret gambar ke sini"
                                        />
                                        {isUploading ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 5, background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '8px' }}>
                                                <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}></i>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>Mengunggah...</span>
                                            </div>
                                        ) : !formData.image_url && (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 5, color: '#94a3b8' }}>
                                                <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2rem' }}></i>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Klik atau Seret file JPG/PNG ke sini</span>
                                            </div>
                                        )}
                                    </div>
                                    {formData.image_url && !isUploading && (
                                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <i className="fas fa-check-circle"></i> Gambar berhasil diunggah
                                            <span 
                                                onClick={() => setFormData({...formData, image_url: ''})} 
                                                style={{ marginLeft: 'auto', color: '#ef4444', cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                Hapus
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Deskripsi</label>
                                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', resize: 'none' }} placeholder="Keterangan opsional mengenai produk..."></textarea>
                                </div>
                            </form>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc' }}>
                            <button onClick={() => setShowModal(false)} type="button" style={{ padding: '10px 20px', borderRadius: '10px', background: '#fff', border: '1px solid #cbd5e1', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>Batal</button>
                            <button type="submit" form="productForm" disabled={isUploading} style={{ padding: '10px 24px', borderRadius: '10px', background: isUploading ? '#94a3b8' : 'var(--primary)', border: 'none', fontWeight: 700, color: '#fff', cursor: isUploading ? 'not-allowed' : 'pointer', boxShadow: isUploading ? 'none' : '0 4px 12px rgba(3,172,14,0.2)' }}>Simpan Produk</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
