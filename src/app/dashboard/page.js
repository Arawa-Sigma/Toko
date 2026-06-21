"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function DashboardPage() {
    const [loading, setLoading] = useState(true)
    const [chartData, setChartData] = useState({
        income: Array(12).fill(0),
        expenses: Array(12).fill(0),
        registrations: Array(12).fill(0),
        visits: Array(12).fill(0)
    })
    
    // Additional summary stats
    const [summary, setSummary] = useState({
        totalOrders: 0,
        totalIncome: 0,
        pendingOrders: 0,
        criticalStock: 0
    })

    useEffect(() => {
        async function loadAnalytics() {
            const supabase = createClient()
            const currentYear = new Date().getFullYear()
            
            // Temporary arrays for 12 months (0-11)
            let incomeArr = Array(12).fill(0)
            let expensesArr = Array(12).fill(0)
            let regArr = Array(12).fill(0)
            let visitsArr = Array(12).fill(0)
            
            // Fetch Orders (Pemasukan)
            const { data: ordData } = await supabase.from('orders').select('created_at, total_amount, status')
            let tOrders = 0; let tIncome = 0; let pOrders = 0;
            if (ordData) {
                tOrders = ordData.length
                ordData.forEach(o => {
                    if (o.status === 'Menunggu' || o.status === 'Pending') pOrders++
                    if (o.status !== 'Dibatalkan') {
                        tIncome += Number(o.total_amount || 0)
                        const d = new Date(o.created_at)
                        if (d.getFullYear() === currentYear) {
                            incomeArr[d.getMonth()] += Number(o.total_amount || 0)
                        }
                    }
                })
            }

            // Fetch Expenses (Pengeluaran)
            try {
                const { data: expData } = await supabase.from('expenses').select('created_at, amount')
                if (expData) {
                    expData.forEach(e => {
                        const d = new Date(e.created_at)
                        if (d.getFullYear() === currentYear) {
                            expensesArr[d.getMonth()] += Number(e.amount || 0)
                        }
                    })
                }
            } catch(e) {} // Ignore if table doesn't exist yet

            // Fetch Profiles (Registrations)
            const { data: profData } = await supabase.from('profiles').select('created_at')
            if (profData) {
                profData.forEach(p => {
                    const d = new Date(p.created_at)
                    if (d.getFullYear() === currentYear) {
                        regArr[d.getMonth()]++
                    }
                })
            }

            // Fetch Site Visits (Kunjungan)
            try {
                const { data: visitData } = await supabase.from('site_visits').select('created_at')
                if (visitData) {
                    visitData.forEach(v => {
                        const d = new Date(v.created_at)
                        if (d.getFullYear() === currentYear) {
                            visitsArr[d.getMonth()]++
                        }
                    })
                }
            } catch(e) {}

            // Fetch Products for critical stock
            const { data: prodData } = await supabase.from('products').select('stock')
            let cStock = 0
            if (prodData) {
                cStock = prodData.filter(p => Number(p.stock || 0) <= 5).length
            }

            setChartData({
                income: incomeArr,
                expenses: expensesArr,
                registrations: regArr,
                visits: visitsArr
            })
            
            setSummary({
                totalOrders: tOrders,
                totalIncome: tIncome,
                pendingOrders: pOrders,
                criticalStock: cStock
            })

            setLoading(false)
        }
        
        loadAnalytics()
    }, [])

    function formatRupiah(n) {
        if (!n) return "Rp 0"
        return "Rp " + Number(n).toLocaleString('id-ID')
    }

    const monthsLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

    // Chart 1: Pemasukan vs Pengeluaran (Bar Chart)
    const financialChartData = {
        labels: monthsLabels,
        datasets: [
            {
                label: 'Pemasukan (Rp)',
                data: chartData.income,
                backgroundColor: 'rgba(16, 185, 129, 0.8)', // Emerald
                borderRadius: 4,
            },
            {
                label: 'Pengeluaran (Rp)',
                data: chartData.expenses,
                backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red
                borderRadius: 4,
            }
        ]
    }

    const financialOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: false }
        },
        scales: {
            y: { beginAtZero: true }
        }
    }

    // Chart 2: Registrasi Pengguna Baru (Line Chart)
    const registrationsData = {
        labels: monthsLabels,
        datasets: [
            {
                fill: true,
                label: 'Pengguna Baru',
                data: chartData.registrations,
                borderColor: 'rgb(59, 130, 246)', // Blue
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                tension: 0.4
            }
        ]
    }

    // Chart 3: Kunjungan Website (Line Chart)
    const visitsData = {
        labels: monthsLabels,
        datasets: [
            {
                fill: true,
                label: 'Kunjungan Halaman',
                data: chartData.visits,
                borderColor: 'rgb(245, 158, 11)', // Amber
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                tension: 0.4
            }
        ]
    }

    if (loading) return (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', marginBottom: '16px' }}></i>
            <div>Memuat Analitik & Grafik...</div>
        </div>
    )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark)', margin: '0 0 4px' }}>Analitik & Performa</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Pantau statistik toko, grafik keuangan, dan aktivitas pengguna.</p>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-wallet" style={{ color: '#10b981' }}></i> Total Pemasukan
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark)' }}>{formatRupiah(summary.totalIncome)}</div>
        </div>
        
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-shopping-bag" style={{ color: '#3b82f6' }}></i> Total Pesanan
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark)' }}>{summary.totalOrders} <span style={{ fontSize:'0.8rem', color:'#94a3b8', fontWeight:500 }}>transaksi</span></div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-clock" style={{ color: '#f59e0b' }}></i> Pesanan Tertunda
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706' }}>{summary.pendingOrders}</div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#ef4444' }}></i> Stok Kritis
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>{summary.criticalStock} <span style={{ fontSize:'0.8rem', color:'#94a3b8', fontWeight:500 }}>produk</span></div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      
      {/* Row 1: Keuangan */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark)', marginTop: 0, marginBottom: '20px' }}>Arus Kas (Pemasukan vs Pengeluaran)</h2>
        <div style={{ height: '300px', width: '100%' }}>
            <Bar options={financialOptions} data={financialChartData} />
        </div>
      </div>

      {/* Row 2: Registrasi & Kunjungan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark)', marginTop: 0, marginBottom: '20px' }}>Pendaftaran Pengguna Baru</h2>
            <div style={{ height: '250px', width: '100%' }}>
                <Line options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={registrationsData} />
            </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark)', marginTop: 0, marginBottom: '20px' }}>Kunjungan Website</h2>
            <div style={{ height: '250px', width: '100%' }}>
                <Line options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={visitsData} />
            </div>
        </div>

      </div>

    </div>
  )
}
