"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useStore } from '@/lib/store'

export default function InvoicePage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const { session } = useStore()

  useEffect(() => {
    if (session?.user?.id) {
        const fetchOrders = async () => {
            const supabase = createClient()
            const { data, error } = await supabase.from('orders').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
            if (data) {
                const formattedInvoices = data.map(order => ({
                    id: order.id,
                    buyerName: order.buyer_name || 'Pelanggan',
                    courier: order.courier || 'Ambil Sendiri',
                    status: order.status,
                    total: order.total_amount,
                    paymentMethod: order.payment_method || 'Transfer / COD'
                }))
                setInvoices(formattedInvoices)
            }
            setLoading(false)
        }
        fetchOrders()
    } else {
        setLoading(false)
    }
  }, [session])

  const filteredInvoices = invoices.filter(inv => {
      if (statusFilter && inv.status !== statusFilter) return false
      if (search) {
          const s = search.toLowerCase()
          return inv.id.toLowerCase().includes(s) || inv.buyerName.toLowerCase().includes(s)
      }
      return true
  })

  return (
    <main className="contentArea" id="mainContent">
      <div className="card sectionPad">
          <div className="titleRow">
              <div>
                  <h3 className="h1">Invoice &amp; Monitor Pengiriman</h3>
                  <div className="p">Lihat semua pesanan, status pengiriman, resi, dan struk pembayaran. Terintegrasi
                      dengan Staff Gudang.</div>
              </div>
              <Link href="/">
                <button className="btn btnOutline">
                  <i className="fas fa-store"></i> Kembali ke Belanja
                </button>
              </Link>
          </div>
          <div style={{marginTop:'16px'}}>
              <div style={{display:'flex', gap:'12px', alignItems:'center', marginBottom:'12px'}}>
                  <input 
                    className="input" 
                    id="monitorSearch" 
                    placeholder="Cari invoice atau nama pembeli..."
                    style={{flex:1}}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <select 
                    className="select" 
                    id="monitorStatusFilter" 
                    style={{width:'220px'}}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                      <option value="">Semua Status</option>
                      <option value="Menunggu">Menunggu</option>
                      <option value="Sedang Dikemas">Sedang Dikemas</option>
                      <option value="Dikirim">Dikirim</option>
                      <option value="Barang Sudah Sampai">Barang Sudah Sampai</option>
                      <option value="Selesai">Selesai</option>
                  </select>
              </div>
              <div style={{maxHeight:'520px', overflow:'auto'}}>
                  <table className="table">
                      <thead>
                          <tr>
                              <th>Invoice / Resi</th>
                              <th>Pembeli</th>
                              <th>Ekspedisi</th>
                              <th>Status</th>
                              <th>Total</th>
                              <th>Metode Bayar</th>
                              <th style={{width:'180px'}}>Aksi</th>
                          </tr>
                      </thead>
                      <tbody id="monitorTbody">
                          {loading ? (
                              <tr>
                                  <td colSpan="7" style={{textAlign:'center', padding:'20px'}}>Memuat data...</td>
                              </tr>
                          ) : filteredInvoices.length === 0 ? (
                              <tr>
                                  <td colSpan="7" style={{textAlign:'center', padding:'20px'}}>Belum ada data transaksi.</td>
                              </tr>
                          ) : (
                              filteredInvoices.map(inv => (
                                  <tr key={inv.id}>
                                      <td><strong>{inv.id?.split('-')[0] || inv.id}</strong></td>
                                      <td>{inv.buyerName}</td>
                                      <td>{inv.courier}</td>
                                      <td><span className="badge">{inv.status}</span></td>
                                      <td>Rp {inv.total.toLocaleString('id-ID')}</td>
                                      <td>{inv.paymentMethod}</td>
                                      <td>
                                          <button className="btn btnOutline" style={{padding:'4px 8px', fontSize:'0.8rem'}}>Lihat Detail</button>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    </main>
  )
}
