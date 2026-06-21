"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function FinancePage() {
    const [expenses, setExpenses] = useState([])
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    // Modal Add Expense
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], category: '', note: '', amount: '' })

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        
        // Fetch Completed Orders for Revenue
        const { data: ordData } = await supabase
            .from('orders')
            .select('*')
            .eq('status', 'Selesai')
        
        if (ordData) setOrders(ordData)

        // Fetch Expenses
        // Note: Make sure to run create_expenses_table.sql in Supabase SQL Editor first.
        try {
            const { data: expData, error } = await supabase
                .from('expenses')
                .select('*')
                .order('date', { ascending: false })
            
            if (expData) setExpenses(expData)
        } catch (e) {
            console.error("Expenses table not available yet")
        }

        setLoading(false)
    }

    function formatRupiah(n) {
        if (!n) return "Rp 0"
        return "Rp " + Number(n).toLocaleString('id-ID')
    }

    async function handleSaveExpense(e) {
        e.preventDefault()
        const payload = {
            date: formData.date,
            category: formData.category,
            note: formData.note,
            amount: Number(formData.amount)
        }
        
        await supabase.from('expenses').insert([payload])
        
        setShowModal(false)
        setFormData({ date: new Date().toISOString().split('T')[0], category: '', note: '', amount: '' })
        fetchData() // Refresh data
    }

    // Calculations
    const omzet = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    // Asumsi HPP/Modal sementara adalah 70% dari harga jual (Omzet)
    const cogs = omzet * 0.7 
    const pengeluaran = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const labaBersih = omzet - cogs - pengeluaran

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>


            {/* Premium Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                
                {/* Laba Bersih (Hero Card) */}
                <div style={{ background: 'linear-gradient(135deg, #05c112, #028e0b)', borderRadius: '20px', padding: '24px', color: '#fff', boxShadow: '0 12px 24px rgba(3,172,14,0.25)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>Estimasi Laba Bersih</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{formatRupiah(labaBersih)}</div>
                        </div>
                        <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                            <i className="fas fa-chart-pie"></i>
                        </div>
                    </div>
                    <div style={{ marginTop: '20px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fas fa-info-circle"></i> Omzet - Modal (Estimasi 70%) - Pengeluaran Operasional
                    </div>
                </div>

                {/* Omzet (Kotor) */}
                <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#eff6ff', color: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                            <i className="fas fa-arrow-down"></i>
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>Total Pemasukan (Omzet)</div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark)' }}>{formatRupiah(omzet)}</div>
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>Dari {orders.length} pesanan selesai</div>
                </div>

                {/* HPP (Modal) */}
                <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#fff7ed', color: '#f97316', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                            <i className="fas fa-boxes"></i>
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>Modal Barang (HPP)</div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark)' }}>{formatRupiah(cogs)}</div>
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>Est. 70% dari nilai jual</div>
                </div>

                {/* Pengeluaran Operasional */}
                <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#fef2f2', color: '#ef4444', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                            <i className="fas fa-arrow-up"></i>
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>Biaya Operasional</div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark)' }}>{formatRupiah(pengeluaran)}</div>
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>Listrik, Gaji, Sewa, dll</div>
                </div>

            </div>

            {/* Expenses Table Section */}
            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', marginTop: '10px' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark)', margin: 0 }}>Catatan Pengeluaran</h2>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Data operasional di luar modal barang.</p>
                    </div>
                    <button onClick={() => setShowModal(true)} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(3,172,14,0.2)', transition: 'all 0.2s', ':hover': { transform: 'translateY(-2px)' } }}>
                        <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Tambah Pengeluaran
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Tanggal</th>
                                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Kategori</th>
                                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Keterangan</th>
                                <th style={{ padding: '16px 24px', textAlign: 'right', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Nominal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Memuat data...</td></tr>
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '60px 24px', textAlign: 'center' }}>
                                        <div style={{ width: '64px', height: '64px', background: '#f1f5f9', color: '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px' }}>
                                            <i className="fas fa-receipt"></i>
                                        </div>
                                        <h3 style={{ margin: '0 0 8px', color: '#64748b', fontSize: '1.1rem' }}>Belum ada catatan</h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Klik "Tambah Pengeluaran" untuk mencatat biaya listrik, gaji, dsb.</p>
                                    </td>
                                </tr>
                            ) : (
                                expenses.map(exp => (
                                    <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', ':hover': { background: '#f8fafc' } }}>
                                        <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                                            {exp.date ? new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700 }}>
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', color: 'var(--dark)', fontSize: '0.85rem', fontWeight: 500 }}>{exp.note}</td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, color: '#ef4444', fontSize: '0.9rem' }}>
                                            - {formatRupiah(exp.amount)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Tambah Pengeluaran */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 50px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Tambah Pengeluaran</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <form id="expenseForm" onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Tanggal *</label>
                                    <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Kategori *</label>
                                    <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', background: '#fff' }}>
                                        <option value="">-- Pilih Kategori --</option>
                                        <option value="Listrik & Air">Listrik & Air</option>
                                        <option value="Gaji Karyawan">Gaji Karyawan</option>
                                        <option value="Plastik & Kemasan">Plastik & Kemasan</option>
                                        <option value="Sewa Tempat">Sewa Tempat</option>
                                        <option value="Transportasi/Bensin">Transportasi/Bensin</option>
                                        <option value="Lain-lain">Lain-lain</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Nominal (Rp) *</label>
                                    <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }} placeholder="Contoh: 50000" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Keterangan / Catatan Tambahan</label>
                                    <input type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }} placeholder="Opsional..." />
                                </div>
                            </form>
                        </div>
                        <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc' }}>
                            <button onClick={() => setShowModal(false)} type="button" style={{ padding: '12px 20px', borderRadius: '12px', background: '#fff', border: '1px solid #cbd5e1', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>Batal</button>
                            <button type="submit" form="expenseForm" style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--primary)', border: 'none', fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(3,172,14,0.2)' }}>Simpan Catatan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
