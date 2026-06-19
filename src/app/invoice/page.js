"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function InvoicePage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  // dummy invoices for now until connected to DB
  const [invoices, setInvoices] = useState([])

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
                      <option value="Diproses">Diproses</option>
                      <option value="Dikemas">Dikemas</option>
                      <option value="Siap Dikirim">Siap Dikirim</option>
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
                          {filteredInvoices.length === 0 ? (
                              <tr>
                                  <td colSpan="7" style={{textAlign:'center', padding:'20px'}}>Belum ada data transaksi.</td>
                              </tr>
                          ) : (
                              filteredInvoices.map(inv => (
                                  <tr key={inv.id}>
                                      <td><strong>{inv.id}</strong></td>
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
