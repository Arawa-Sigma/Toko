"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useStore, useUIStore } from "@/lib/store"
import { createClient } from "@/lib/supabaseClient"
import dynamic from 'next/dynamic'
import Cropper from 'react-easy-crop'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false, loading: () => <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}><i className="fas fa-spinner fa-spin"></i> &nbsp; Memuat Peta...</div> })
import { getCroppedImg } from '@/lib/cropImage'

export default function ProfilePage() {
    const { session, setSession } = useStore()
    const showToast = useUIStore((state) => state.showToast)
    
    // Tab State
    const [activeTab, setActiveTab] = useState("dashboard")
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const handleTabChange = (tab) => {
        setActiveTab(tab)
        setIsSidebarOpen(false)
    }

    const tabNames = {
        'dashboard': 'Dashboard',
        'riwayat': 'Riwayat Pesanan',
        'profil': 'Pengaturan Profil',
        'alamat': 'Buku Alamat',
        'password': 'Ubah Password',
        'notifikasi': 'Notifikasi'
    }

    // Profil Form States
    const [username, setUsername] = useState("")
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    
    // User Orders State
    const [userOrders, setUserOrders] = useState([])
    const [loadingOrders, setLoadingOrders] = useState(true)
    const [orderFilterStatus, setOrderFilterStatus] = useState('Semua')
    
    // Order Detail Modal State
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [orderDetailItems, setOrderDetailItems] = useState([])
    const [loadingOrderDetails, setLoadingOrderDetails] = useState(false)
    
    // Return Request State
    const [returnModalOpen, setReturnModalOpen] = useState(false)
    const [returnReason, setReturnReason] = useState("")
    const [orderToReturn, setOrderToReturn] = useState(null)
    const [submittingReturn, setSubmittingReturn] = useState(false)

    const [gender, setGender] = useState("")
    const [birthDate, setBirthDate] = useState("")
    
    // Address States
    const [addresses, setAddresses] = useState([])
    const [addressModalOpen, setAddressModalOpen] = useState(false)
    const [mapModalOpen, setMapModalOpen] = useState(false)
    const [tempCoordinates, setTempCoordinates] = useState(null)
    const [newAddress, setNewAddress] = useState({
        name: "", phone: "", region: "", street: "", detail: "", label: "Rumah", isPrimary: false, coordinates: null
    })
    const [avatarUrl, setAvatarUrl] = useState("")
    
    // Password States
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Cropper States
    const [cropModalOpen, setCropModalOpen] = useState(false)
    const [imageSrc, setImageSrc] = useState(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const [selectedFileName, setSelectedFileName] = useState("")

    // Status States
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {

        if (session?.user) {
            const meta = session.user.user_metadata || {}
            setUsername(meta.username || "")
            setFullName(meta.full_name || "")
            setEmail(session.user.email || "")
            setPhone(meta.phone || "")

            setGender(meta.gender || "")
            setBirthDate(meta.birth_date || "")
            setAddresses(meta.addresses || [])
            setAvatarUrl(meta.custom_avatar || meta.avatar_url || "")
            
            async function fetchUserOrders() {
                const supabase = createClient()
                const { data } = await supabase.from('orders').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
                if (data) {
                    setUserOrders(data)
                }
                setLoadingOrders(false)
            }
            
            fetchUserOrders()
        } else {
            setLoadingOrders(false)
        }
    }, [session])

    const onFileSelect = (file) => {
        if (!file.type.startsWith('image/')) {
            showToast("Hanya file gambar yang diperbolehkan!", "error")
            return
        }
        setSelectedFileName(file.name)
        const reader = new FileReader()
        reader.addEventListener('load', () => {
            setImageSrc(reader.result)
            setCropModalOpen(true)
        })
        reader.readAsDataURL(file)
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        onFileSelect(file)
        e.target.value = null // reset input
    }

    const handleDrop = (e) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (!file) return
        onFileSelect(file)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
    }

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }

    const handleCropSave = async () => {
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
            const croppedFile = new File([croppedBlob], selectedFileName, { type: 'image/jpeg' })
            setCropModalOpen(false)
            await uploadAvatar(croppedFile)
        } catch (e) {
            console.error(e)
            showToast("Gagal memotong gambar.", "error")
        }
    }

    const uploadAvatar = async (file) => {
        if (!file.type.startsWith('image/')) {
            showToast("Hanya file gambar yang diperbolehkan!", "error")
            return
        }
        try {
            setUploading(true)
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${session?.user?.id}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
            if (data?.publicUrl) {
                setAvatarUrl(data.publicUrl)
                
                // Auto-save the avatar URL to Supabase immediately using custom_avatar to prevent OAuth overwrite
                const { error: updateErr } = await supabase.auth.updateUser({
                    data: { custom_avatar: data.publicUrl }
                })
                
                // Save to profiles table so admin can see it
                await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', session.user.id)
                
                if (!updateErr) {
                    const { data: sessionData } = await supabase.auth.getSession()
                    if (sessionData?.session) {
                        setSession(sessionData.session)
                    }
                }
                
                showToast("Foto profil berhasil diperbarui!", "success")
            }
        } catch (error) {
            console.error("Error uploading avatar:", error)
            showToast(`Gagal mengunggah foto: ${error.message}`, "error")
        } finally {
            setUploading(false)
        }
    }

    const handleSaveMetadata = async () => {
        if (!session?.user) return
        if (phone && (!phone.startsWith("08") || phone.length !== 12)) {
            showToast("Nomor telepon harus diawali dengan 08 dan 12 digit!", "error")
            return
        }
        try {
            setSaving(true)
            const supabase = createClient()
            const updates = {
                username, full_name: fullName, phone,
                gender, birth_date: birthDate, addresses, custom_avatar: avatarUrl
            }
            const { data, error } = await supabase.auth.updateUser({ data: updates })
            if (error) throw error
            
            // Sync to profiles table
            await supabase.from('profiles').update({ name: fullName, avatar_url: avatarUrl }).eq('id', session.user.id)
            
            // Ambil session terbaru agar state aplikasi ikut terupdate tanpa logout
            const { data: sessionData } = await supabase.auth.getSession()
            if (sessionData?.session) {
                setSession(sessionData.session)
            }
            
            showToast("Data berhasil diperbarui!", "success")
        } catch (error) {
            console.error("Error updating profile:", error)
            showToast(`Gagal memperbarui profil: ${error.message}`, "error")
        } finally {
            setSaving(false)
        }
    }

    const handleSaveNewAddress = async () => {
        if (!newAddress.name || !newAddress.phone || !newAddress.street) {
            showToast("Nama lengkap, nomor telepon, dan jalan harus diisi!", "error")
            return
        }
        if (!newAddress.phone.startsWith("08") || newAddress.phone.length !== 12) {
            showToast("Nomor telepon harus diawali dengan 08 dan berjumlah 12 digit!", "error")
            return
        }
        
        try {
            setSaving(true)
            const supabase = createClient()
            
            let updatedAddresses = [...addresses]
            if (newAddress.isPrimary) {
                updatedAddresses = updatedAddresses.map(addr => ({ ...addr, isPrimary: false }))
            }
            
            if (newAddress.id) {
                // Editing existing address
                const index = updatedAddresses.findIndex(addr => addr.id === newAddress.id)
                if (index !== -1) {
                    updatedAddresses[index] = { ...newAddress }
                }
            } else {
                // Adding new address
                const addrToAdd = { 
                    ...newAddress, 
                    id: Date.now().toString(),
                    isPrimary: addresses.length === 0 ? true : newAddress.isPrimary 
                }
                updatedAddresses.push(addrToAdd)
            }
            
            const updates = {
                username, full_name: fullName, phone,
                gender, birth_date: birthDate, addresses: updatedAddresses, custom_avatar: avatarUrl
            }
            const { error } = await supabase.auth.updateUser({ data: updates })
            if (error) throw error
            
            const { data: sessionData } = await supabase.auth.getSession()
            if (sessionData?.session) {
                setSession(sessionData.session)
            }
            
            setAddresses(updatedAddresses)
            setAddressModalOpen(false)
            setNewAddress({ id: null, name: "", phone: "", region: "", street: "", detail: "", label: "Rumah", isPrimary: false, coordinates: null })
            showToast(newAddress.id ? "Alamat berhasil diperbarui!" : "Alamat berhasil ditambahkan!", "success")
        } catch (error) {
            console.error("Error saving address:", error)
            showToast(`Gagal menyimpan alamat: ${error.message}`, "error")
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteAddress = async (idToDelete) => {
        if (!confirm("Apakah Anda yakin ingin menghapus alamat ini?")) return;
        try {
            setSaving(true)
            const supabase = createClient()
            let updatedAddresses = addresses.filter(addr => addr.id !== idToDelete)
            
            // If the deleted address was primary, make the first remaining one primary
            const hadPrimary = updatedAddresses.some(addr => addr.isPrimary)
            if (!hadPrimary && updatedAddresses.length > 0) {
                updatedAddresses[0].isPrimary = true
            }

            const updates = {
                username, full_name: fullName, phone,
                gender, birth_date: birthDate, addresses: updatedAddresses, custom_avatar: avatarUrl
            }
            const { error } = await supabase.auth.updateUser({ data: updates })
            if (error) throw error
            
            const { data: sessionData } = await supabase.auth.getSession()
            if (sessionData?.session) {
                setSession(sessionData.session)
            }
            
            setAddresses(updatedAddresses)
            showToast("Alamat berhasil dihapus!", "success")
        } catch (error) {
            console.error("Error deleting address:", error)
            showToast(`Gagal menghapus alamat: ${error.message}`, "error")
        } finally {
            setSaving(false)
        }
    }

    const validatePassword = (pass) => {
        if (!pass) return "Password wajib diisi"
        if (pass.length < 8) return "Password minimal 8 karakter"
        if (!/[A-Z]/.test(pass)) return "Password harus mengandung huruf kapital"
        if (!/\d/.test(pass)) return "Password harus mengandung angka"
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(pass)) return "Password harus mengandung simbol"
        return ""
    }

    const handlePasswordChange = async () => {
        if (password !== confirmPassword) {
            showToast("Password dan konfirmasi tidak cocok!", "error")
            return
        }
        const passErr = validatePassword(password)
        if (passErr) {
            showToast(passErr, "error")
            return
        }
        try {
            setSaving(true)
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            showToast("Password berhasil diubah!", "success")
            setPassword("")
            setConfirmPassword("")
        } catch (err) {
            showToast(`Gagal merubah password: ${err.message}`, "error")
        } finally {
            setSaving(false)
        }
    }

    const filteredUserOrders = userOrders.filter(o => orderFilterStatus === 'Semua' || o.status === orderFilterStatus)

    async function handleViewDetail(order) {
        setSelectedOrder(order)
        setLoadingOrderDetails(true)
        const supabase = createClient()
        
        // Fetch items and product details
        const { data: itemsData } = await supabase.from('order_items').select('*, products(name, image_url)').eq('order_id', order.id)
        
        if (itemsData) {
            setOrderDetailItems(itemsData)
        } else {
            setOrderDetailItems([])
        }
        setLoadingOrderDetails(false)
    }

    async function handleSubmitReturn(e) {
        e.preventDefault()
        if (!returnReason.trim()) {
            showToast("Harap isi alasan pengembalian", "warn")
            return
        }
        
        setSubmittingReturn(true)
        const supabase = createClient()
        
        // 1. Update orders status
        const { error: ordErr } = await supabase.from('orders').update({
            status: 'Pengembalian Barang (Pending)',
            return_reason: returnReason
        }).eq('id', orderToReturn.id)

        // 2. Insert into returns table
        const { error: retErr } = await supabase.from('returns').insert({
            order_id: orderToReturn.id,
            user_id: session.user.id,
            user_name: fullName || username || 'Pelanggan',
            reason: returnReason,
            status: 'Pending'
        })
        
        if (ordErr || retErr) {
            console.error("Return error:", ordErr || retErr)
            showToast("Gagal mengajukan pengembalian barang", "error")
        } else {
            showToast("Pengembalian barang berhasil diajukan! Menunggu persetujuan Admin.", "success")
            setReturnModalOpen(false)
            setReturnReason("")
            
            // Update local state
            setUserOrders(prev => prev.map(o => o.id === orderToReturn.id ? { ...o, status: 'Pengembalian Barang (Pending)', return_reason: returnReason } : o))
            setOrderToReturn(null)
        }
        setSubmittingReturn(false)
    }

    function formatRupiah(n) {
        if (!n) return "Rp 0"
        return "Rp " + Number(n).toLocaleString('id-ID')
    }

    function getStatusBadge(status) {
        switch(status) {
            case 'Selesai':
            case 'Barang Sudah Sampai':
            case 'Dikirim':
                return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', fontSize: '0.7rem', fontWeight: 700 }}>{status}</span>
            case 'Dibatalkan':
            case 'Pengembalian Barang':
                return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', fontSize: '0.7rem', fontWeight: 700 }}>{status}</span>
            case 'Sedang Dikemas':
                return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', fontSize: '0.7rem', fontWeight: 700 }}>{status}</span>
            default:
                // Belum Bayar
                return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', fontSize: '0.7rem', fontWeight: 700 }}>{status || 'Belum Bayar'}</span>
        }
    }

    if (!session) {
        return (
            <main className="contentArea" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh'}}>
                <div className="card sectionPad" style={{textAlign: 'center'}}>
                    <h3 className="h1">Akses Ditolak</h3>
                    <p className="p" style={{marginTop: '10px'}}>Silakan login terlebih dahulu untuk melihat halaman profil.</p>
                </div>
            </main>
        )
    }

    const maskedEmail = email ? email.replace(/(.{2})(.*)(?=@)/, (match, p1, p2) => p1 + '*'.repeat(p2.length)) : "";

    return (
        <main className="profile-container contentArea" id="mainContent">
            <div className="profile-mobile-header" style={{ display: 'none', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <button onClick={() => setIsSidebarOpen(true)} className="btn" style={{ padding: '8px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                   <i className="fas fa-bars"></i>
                </button>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--dark)' }}>{tabNames[activeTab] || 'Profil Saya'}</h2>
            </div>
            
            <div className={`profile-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

            {/* SIDEBAR */}
            <aside className={`profile-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <img src={avatarUrl || "/people.png"} alt="Avatar" onError={(e) => { e.target.onerror = null; e.target.src = "/people.png"; }} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--dark)' }}>{username || fullName || 'User'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => handleTabChange('profil')}>
                            <i className="fas fa-pen"></i> Ubah Profil
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '12px' }}>
                    {/* SECTION: OVERVIEW */}
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '12px' }}>Overview</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'dashboard' ? '#ecfdf5' : 'transparent', color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--dark)', fontWeight: activeTab === 'dashboard' ? 800 : 600 }} onClick={() => handleTabChange('dashboard')}>
                                <i className="fas fa-home" style={{ width: '20px', textAlign: 'center', fontSize: '1.1rem' }}></i> Dashboard
                            </div>
                        </div>
                    </div>

                    {/* SECTION: TRANSAKSI */}
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '12px' }}>Transaksi</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'riwayat' ? '#ecfdf5' : 'transparent', color: activeTab === 'riwayat' ? 'var(--primary)' : 'var(--dark)', fontWeight: activeTab === 'riwayat' ? 800 : 600 }} onClick={() => handleTabChange('riwayat')}>
                                <i className="fas fa-clipboard-list" style={{ width: '20px', textAlign: 'center', fontSize: '1.1rem' }}></i> Riwayat Pesanan
                            </div>
                            <Link href="/keranjang" style={{ textDecoration: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', background: 'transparent', color: 'var(--dark)', fontWeight: 600 }}>
                                    <i className="fas fa-shopping-cart" style={{ width: '20px', textAlign: 'center', fontSize: '1.1rem' }}></i> Ke Keranjang
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* SECTION: AKUN SAYA */}
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '12px' }}>Akun Saya</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'profil' ? '#ecfdf5' : 'transparent', color: activeTab === 'profil' ? 'var(--primary)' : 'var(--dark)', fontWeight: activeTab === 'profil' ? 800 : 600 }} onClick={() => handleTabChange('profil')}>
                                <i className="fas fa-user-edit" style={{ width: '20px', textAlign: 'center', fontSize: '1.1rem' }}></i> Pengaturan Profil
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'alamat' ? '#ecfdf5' : 'transparent', color: activeTab === 'alamat' ? 'var(--primary)' : 'var(--dark)', fontWeight: activeTab === 'alamat' ? 800 : 600 }} onClick={() => handleTabChange('alamat')}>
                                <i className="fas fa-map-marked-alt" style={{ width: '20px', textAlign: 'center', fontSize: '1.1rem' }}></i> Buku Alamat
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'password' ? '#ecfdf5' : 'transparent', color: activeTab === 'password' ? 'var(--primary)' : 'var(--dark)', fontWeight: activeTab === 'password' ? 800 : 600 }} onClick={() => handleTabChange('password')}>
                                <i className="fas fa-key" style={{ width: '20px', textAlign: 'center', fontSize: '1.1rem' }}></i> Ubah Password
                            </div>
                        </div>
                    </div>

                    {/* SECTION: KOMUNIKASI */}
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '12px' }}>Komunikasi</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'notifikasi' ? '#ecfdf5' : 'transparent', color: activeTab === 'notifikasi' ? 'var(--primary)' : 'var(--dark)', fontWeight: activeTab === 'notifikasi' ? 800 : 600 }} onClick={() => handleTabChange('notifikasi')}>
                                <i className="fas fa-bell" style={{ width: '20px', textAlign: 'center', fontSize: '1.1rem' }}></i> Notifikasi
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
                {activeTab === 'dashboard' && (
                    <>
                        <div className="card profile-content-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '32px' }}>
                            <img src={avatarUrl || "/people.png"} alt="Avatar" onError={(e) => { e.target.onerror = null; e.target.src = "/people.png"; }} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                            <div>
                                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark)', margin: '0 0 4px 0' }}>Halo, {fullName || username || 'User'}!</h1>
                                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem' }}>Selamat datang di Dashboard Pengguna Anda.</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div className="card profile-content-card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                        <i className="fas fa-shopping-bag"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 600 }}>Total Pesanan</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark)' }}>{loadingOrders ? '...' : userOrders.length}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="card profile-content-card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#fef3c7', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                        <i className="fas fa-clock"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 600 }}>Menunggu</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark)' }}>{loadingOrders ? '...' : userOrders.filter(o => o.status === 'Menunggu' || o.status === 'Menunggu Pembayaran').length}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '24px', borderRadius: '16px', background: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                        <i className="fas fa-check-circle"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 600 }}>Selesai</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark)' }}>{loadingOrders ? '...' : userOrders.filter(o => o.status === 'Selesai').length}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '24px', borderRadius: '16px', background: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark)' }}>Pesanan Terbaru</h3>
                                <div style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }} onClick={() => setActiveTab('riwayat')}>Lihat Semua</div>
                            </div>
                            {loadingOrders ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>Memuat pesanan...</div>
                            ) : userOrders.length === 0 ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)' }}>Belum ada pesanan terbaru.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {userOrders.slice(0, 3).map(order => (
                                        <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                                            <div>
                                                <div style={{ fontWeight: 800, color: 'var(--dark)' }}>Order #{order.id?.substring(0, 8) || order.id}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 800, color: 'var(--primary)' }}>Rp {Number(order.total_amount).toLocaleString('id-ID')}</div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px', background: order.status === 'Selesai' ? '#ecfdf5' : order.status === 'Menunggu' ? '#fef3c7' : '#eff6ff', color: order.status === 'Selesai' ? '#10b981' : order.status === 'Menunggu' ? '#f59e0b' : '#3b82f6' }}>{order.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

            <div className="card profile-content-card" style={{ display: activeTab === 'dashboard' ? 'none' : 'block' }}>
                {activeTab === 'profil' && (
                    <>
                        <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '32px' }}>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Profil Saya</h1>
                            <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '6px' }}>Kelola informasi profil Anda untuk mengontrol, melindungi dan mengamankan akun</p>
                        </div>
                        <div className="profile-layout-split">
                            <div className="profile-content" style={{ paddingRight: '40px' }}>
                                <div className="profile-form-row">
                                    <div className="profile-form-label">Username</div>
                                    <div className="profile-form-input">
                                        <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', maxWidth: '400px' }} />
                                        <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>Username hanya dapat diubah satu (1) kali.</div>
                                    </div>
                                </div>
                                <div className="profile-form-row">
                                    <div className="profile-form-label">Nama</div>
                                    <div className="profile-form-input"><input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: '100%', maxWidth: '400px' }} /></div>
                                </div>
                                <div className="profile-form-row">
                                    <div className="profile-form-label">Email</div>
                                    <div className="profile-form-input" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.9rem', color: '#333' }}>{maskedEmail}</span>
                                    </div>
                                </div>
                                <div className="profile-form-row">
                                    <div className="profile-form-label">Nomor Telepon</div>
                                    <div className="profile-form-input">
                                        <input 
                                            type="tel"
                                            className="input" 
                                            value={phone} 
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} 
                                            placeholder="Contoh: 081234567890" 
                                            maxLength={12}
                                            style={{ width: '100%', maxWidth: '250px' }} 
                                        />
                                    </div>
                                </div>
                                <div className="profile-form-row">
                                    <div className="profile-form-label">Jenis Kelamin</div>
                                    <div className="profile-form-input" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.9rem', color: '#333' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="radio" name="gender" value="Laki-laki" checked={gender === 'Laki-laki'} onChange={(e) => setGender(e.target.value)} /> Laki-laki</label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="radio" name="gender" value="Perempuan" checked={gender === 'Perempuan'} onChange={(e) => setGender(e.target.value)} /> Perempuan</label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="radio" name="gender" value="Lainnya" checked={gender === 'Lainnya'} onChange={(e) => setGender(e.target.value)} /> Lainnya</label>
                                    </div>
                                </div>
                                <div className="profile-form-row">
                                    <div className="profile-form-label">Tanggal lahir</div>
                                    <div className="profile-form-input"><input type="date" className="input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={{ width: '100%', maxWidth: '200px' }} /></div>
                                </div>
                                <div className="profile-form-row" style={{ marginTop: '10px' }}>
                                    <div className="profile-form-label"></div>
                                    <button className="btn btnPrimary" style={{ padding: '12px 32px', fontSize: '0.9rem', borderRadius: '4px' }} onClick={handleSaveMetadata} disabled={saving}>
                                        {saving ? <><i className="fas fa-spinner fa-spin"></i> Menyimpan...</> : "Simpan"}
                                    </button>
                                </div>
                            </div>
                            <div className="profile-avatar-section">
                                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#efefef', backgroundImage: `url(${avatarUrl || '/people.png'})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '16px', position: 'relative', overflow: 'hidden' }} onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragOver}>
                                    {uploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-circle-notch fa-spin fa-2x" style={{color: '#ee4d2d'}}></i></div>}
                                </div>
                                <button className="btn btnOutline" style={{ padding: '8px 20px', borderRadius: '2px', borderColor: '#ccc', color: '#555', background: '#fff' }} onClick={() => fileInputRef.current?.click()}>Pilih Gambar</button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".jpeg,.jpg,.png" style={{display: 'none'}} />
                                <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '16px', textAlign: 'center', lineHeight: '1.5' }}>Ukuran gambar: maks. 1 MB<br/>Format gambar: .JPEG, .PNG</div>
                                <div style={{ fontSize: '0.8rem', color: '#ee4d2d', marginTop: '10px', textAlign: 'center', lineHeight: '1.5', fontStyle: 'italic' }}>(Bisa drag & drop ke foto)</div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'alamat' && (
                    <>
                        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#333', margin: 0 }}>Alamat Saya</h1>
                            <button className="btn btnPrimary" style={{ background: '#ee4d2d', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '4px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => {
                                setNewAddress({ id: null, name: "", phone: "", region: "", street: "", detail: "", label: "Rumah", isPrimary: false, coordinates: null })
                                setAddressModalOpen(true)
                            }}>
                                <i className="fas fa-plus"></i> Tambahkan Alamat
                            </button>
                        </div>
                        
                        {addresses.length === 0 ? (
                            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                                <i className="fas fa-map-marker-alt fa-4x" style={{ marginBottom: '16px', color: '#e2e8f0' }}></i>
                                <div style={{ fontSize: '1.05rem', color: 'var(--muted)' }}>Anda belum memiliki alamat.</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {addresses.map((addr) => (
                                    <div key={addr.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', position: 'relative' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--dark)' }}>{addr.name}</span>
                                            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>|</span>
                                            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{addr.phone}</span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '4px' }}>{addr.street}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '4px' }}>{addr.region}</div>
                                        {addr.detail && <div style={{ fontSize: '0.9rem', color: '#777', fontStyle: 'italic', marginBottom: '8px' }}>({addr.detail})</div>}
                                        {addr.coordinates && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#16a34a', marginBottom: '12px' }}>
                                                <i className="fas fa-map-marker-alt"></i> Sudah ditandai di peta
                                            </div>
                                        )}
                                        
                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                                                {addr.label && <span style={{ padding: '4px 8px', border: '1px solid #ee4d2d', color: '#ee4d2d', fontSize: '0.75rem', borderRadius: '2px' }}>{addr.label}</span>}
                                                {addr.isPrimary && <span style={{ padding: '4px 8px', border: '1px solid var(--border)', background: '#f8fafc', color: 'var(--muted)', fontSize: '0.75rem', borderRadius: '2px' }}>Utama</span>}
                                            </div>
                                            <div style={{ display: 'flex', gap: '16px' }}>
                                                <span style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }} onClick={() => { setNewAddress(addr); setAddressModalOpen(true); }}>Ubah</span>
                                                <span style={{ color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }} onClick={() => handleDeleteAddress(addr.id)}>Hapus</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'password' && (
                    <>
                        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#333', margin: 0 }}>Ubah Password</h1>
                            <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '4px' }}>Untuk keamanan akun Anda, mohon tidak menyebarkan password Anda kepada orang lain.</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
                            <div className="profile-form-row">
                                <div className="profile-form-label">Password Baru</div>
                                <div className="profile-form-input" style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                                    <input type={showPassword ? "text" : "password"} className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 kar, kapital, angka, simbol" style={{ width: '100%', paddingRight: '40px' }} />
                                    <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                                        <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                                    </button>
                                </div>
                            </div>
                            <div className="profile-form-row">
                                <div className="profile-form-label">Konfirmasi Password</div>
                                <div className="profile-form-input" style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                                    <input type={showConfirmPassword ? "text" : "password"} className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ketik ulang password baru" style={{ width: '100%', paddingRight: '40px' }} />
                                    <button type="button" onClick={() => setShowConfirmPassword(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                                        <i className={`fas fa-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                                    </button>
                                </div>
                            </div>
                            <div className="profile-form-row" style={{ marginTop: '10px' }}>
                                <div className="profile-form-label"></div>
                                <div className="profile-form-input">
                                    <button className="btn btnPrimary" style={{ padding: '10px 24px', background: '#ee4d2d', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.95rem' }} onClick={handlePasswordChange} disabled={saving}>{saving ? "Memproses..." : "Konfirmasi"}</button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'riwayat' && (
                    <>
                        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#333', margin: 0 }}>Riwayat Pesanan</h1>
                            <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '4px' }}>Daftar pesanan Anda yang pernah dilakukan di toko ini.</p>
                        </div>

                        {/* Order Status Tabs */}
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                            {['Semua', 'Belum Bayar', 'Sedang Dikemas', 'Dikirim', 'Barang Sudah Sampai', 'Selesai', 'Dibatalkan', 'Pengembalian Barang'].map(stat => (
                                <button 
                                    key={stat}
                                    onClick={() => setOrderFilterStatus(stat)}
                                    style={{ 
                                        padding: '8px 16px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', border: 'none', transition: 'all 0.2s',
                                        background: orderFilterStatus === stat ? 'rgba(3,172,14,0.1)' : '#f8fafc',
                                        color: orderFilterStatus === stat ? 'var(--primary)' : '#64748b',
                                        boxShadow: orderFilterStatus === stat ? 'inset 0 0 0 1px var(--primary)' : 'inset 0 0 0 1px #e2e8f0'
                                    }}
                                >
                                    {stat}
                                </button>
                            ))}
                        </div>

                        {loadingOrders ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '10px' }}></i>
                                <div>Memuat pesanan...</div>
                            </div>
                        ) : filteredUserOrders.length === 0 ? (
                            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                                <i className="fas fa-clipboard-list fa-3x" style={{ marginBottom: '16px', color: '#cbd5e1' }}></i>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--dark)' }}>Belum Ada Pesanan</div>
                                <p style={{ marginTop: '8px' }}>Sepertinya Anda belum membuat pesanan sama sekali.</p>
                                <Link href="/">
                                    <button className="btn btnPrimary" style={{ marginTop: '20px', background: '#ee4d2d', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: '4px' }}>Belanja Sekarang</button>
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {filteredUserOrders.map(order => (
                                    <div key={order.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#fff' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px', gap: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <i className="fas fa-shopping-bag" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</div>
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--dark)', fontWeight: 700 }}>{order.id?.split('-')[0] || 'INV-XXX'}</div>
                                                </div>
                                            </div>
                                            <div>
                                                {getStatusBadge(order.status)}
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Total Belanja</div>
                                                <div style={{ fontSize: '1.1rem', color: 'var(--dark)', fontWeight: 800 }}>{formatRupiah(order.total_amount)}</div>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {(order.status === 'Selesai' || order.status === 'Dikirim') && (
                                                    <button 
                                                        onClick={() => {
                                                            setOrderToReturn(order)
                                                            setReturnModalOpen(true)
                                                        }} 
                                                        style={{ padding: '8px 16px', background: '#fff', color: '#ee4d2d', border: '1px solid #ee4d2d', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                                                    >
                                                        Ajukan Pengembalian
                                                    </button>
                                                )}
                                                <button onClick={() => handleViewDetail(order)} style={{ padding: '8px 16px', background: '#fff', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Lihat Detail</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'notifikasi' && (
                    <>
                        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#333', margin: 0 }}>Riwayat Notifikasi</h1>
                            <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '4px' }}>Pemberitahuan terkait status pesanan dan promosi.</p>
                        </div>
                        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                            <i className="fas fa-bell-slash fa-3x" style={{ marginBottom: '16px', color: '#cbd5e1' }}></i>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--dark)' }}>Tidak Ada Notifikasi</div>
                            <p style={{ marginTop: '8px' }}>Anda belum menerima pemberitahuan apa pun.</p>
                        </div>
                    </>
                )}
            </div>
            </div>

            {/* ADDRESS MODAL */}
            {addressModalOpen && (
                <div style={{position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)'}}>
                    <div style={{background: '#fff', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column'}}>
                        <div style={{padding: '24px', borderBottom: '1px solid var(--border)'}}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--dark)', margin: 0 }}>{newAddress.id ? "Ubah Alamat" : "Alamat Baru"}</h2>
                        </div>
                        
                        <div style={{padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <input type="text" className="input" placeholder="Nama Lengkap" value={newAddress.name} onChange={(e) => setNewAddress({...newAddress, name: e.target.value})} style={{ width: '100%' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input type="tel" className="input" placeholder="Nomor Telepon (08...)" value={newAddress.phone} maxLength={12} onChange={(e) => setNewAddress({...newAddress, phone: e.target.value.replace(/\D/g, '')})} style={{ width: '100%' }} />
                                </div>
                            </div>
                            
                            <div>
                                <input type="text" className="input" placeholder="Provinsi, Kota, Kecamatan, Kode Pos" value={newAddress.region} onChange={(e) => setNewAddress({...newAddress, region: e.target.value})} style={{ width: '100%' }} />
                            </div>
                            
                            <div>
                                <textarea className="input" rows="3" placeholder="Nama Jalan, Gedung, No. Rumah" value={newAddress.street} onChange={(e) => setNewAddress({...newAddress, street: e.target.value})} style={{ width: '100%', resize: 'vertical' }} />
                            </div>
                            
                            <div>
                                <input type="text" className="input" placeholder="Detail Lainnya (Cth: Blok / Unit No., Patokan)" value={newAddress.detail} onChange={(e) => setNewAddress({...newAddress, detail: e.target.value})} style={{ width: '100%' }} />
                            </div>
                            
                            <div onClick={() => { setMapModalOpen(true); setTempCoordinates(newAddress.coordinates) }} style={{ height: '120px', background: newAddress.coordinates ? '#f0fdf4' : '#f8fafc', border: `1px dashed ${newAddress.coordinates ? '#22c55e' : '#cbd5e1'}`, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: newAddress.coordinates ? '#166534' : 'var(--muted)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = newAddress.coordinates ? '#dcfce7' : '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.background = newAddress.coordinates ? '#f0fdf4' : '#f8fafc'}>
                                {newAddress.coordinates ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', pointerEvents: 'none' }}>
                                        <i className="fas fa-map-marker-alt fa-2x" style={{ color: '#22c55e' }}></i>
                                        <div style={{ fontWeight: 600 }}>Lokasi Tersimpan</div>
                                        <div style={{ fontSize: '0.8rem' }}>{newAddress.coordinates.lat.toFixed(4)}, {newAddress.coordinates.lng.toFixed(4)}</div>
                                    </div>
                                ) : (
                                    <div style={{ background: '#fff', padding: '8px 16px', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
                                        <i className="fas fa-plus"></i> Tambah Lokasi Peta
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '8px' }}>Tandai Sebagai:</div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button 
                                        onClick={() => setNewAddress({...newAddress, label: 'Rumah'})} 
                                        style={{ padding: '8px 24px', background: '#fff', border: `1px solid ${newAddress.label === 'Rumah' ? '#ee4d2d' : '#cbd5e1'}`, color: newAddress.label === 'Rumah' ? '#ee4d2d' : 'var(--dark)', borderRadius: '4px', cursor: 'pointer', outline: 'none' }}
                                    >Rumah</button>
                                    <button 
                                        onClick={() => setNewAddress({...newAddress, label: 'Kantor'})} 
                                        style={{ padding: '8px 24px', background: '#fff', border: `1px solid ${newAddress.label === 'Kantor' ? '#ee4d2d' : '#cbd5e1'}`, color: newAddress.label === 'Kantor' ? '#ee4d2d' : 'var(--dark)', borderRadius: '4px', cursor: 'pointer', outline: 'none' }}
                                    >Kantor</button>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <input type="checkbox" id="isPrimary" checked={newAddress.isPrimary} onChange={(e) => setNewAddress({...newAddress, isPrimary: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#ee4d2d' }} />
                                <label htmlFor="isPrimary" style={{ color: 'var(--muted)', fontSize: '0.95rem', cursor: 'pointer' }}>Atur sebagai Alamat Pribadi</label>
                            </div>
                        </div>
                        
                        <div style={{padding: '20px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                            <button className="btn btnOutline" onClick={() => setAddressModalOpen(false)} style={{ border: 'none', background: 'transparent' }}>Nanti Saja</button>
                            <button className="btn btnPrimary" onClick={handleSaveNewAddress} disabled={saving} style={{background: '#ee4d2d', color: '#fff', border: 'none', padding: '10px 40px', borderRadius: '4px'}}>
                                {saving ? "Menyimpan..." : "OK"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAP MODAL */}
            {mapModalOpen && (
                <div style={{position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)'}}>
                    <div style={{background: '#fff', borderRadius: '8px', width: '90%', maxWidth: '600px', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                        <div style={{padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--dark)', margin: 0 }}>Pilih Lokasi</h2>
                            <button onClick={() => setMapModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--muted)' }}><i className="fas fa-times"></i></button>
                        </div>
                        
                        <div style={{ padding: '16px' }}>
                            <MapPicker position={tempCoordinates} onPositionChange={setTempCoordinates} />
                        </div>
                        
                        <div style={{padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc'}}>
                            <button className="btn btnOutline" onClick={() => setMapModalOpen(false)} style={{ border: 'none', background: 'transparent' }}>Batal</button>
                            <button className="btn btnPrimary" onClick={() => {
                                if (tempCoordinates) {
                                    setNewAddress({...newAddress, coordinates: tempCoordinates})
                                }
                                setMapModalOpen(false)
                            }} style={{background: '#ee4d2d', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '4px'}}>
                                Simpan Lokasi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CROP MODAL */}
            {cropModalOpen && (
                <div style={{position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)'}}>
                    <div style={{background: '#fff', borderRadius: '8px', width: '90%', maxWidth: '500px', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                        <div style={{padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '1.1rem'}}>Sesuaikan Gambar</div>
                        <div style={{position: 'relative', width: '100%', height: '400px', background: '#333'}}>
                            <Cropper
                              image={imageSrc}
                              crop={crop}
                              zoom={zoom}
                              aspect={1}
                              cropShape="round"
                              showGrid={false}
                              onCropChange={setCrop}
                              onCropComplete={onCropComplete}
                              onZoomChange={setZoom}
                            />
                        </div>
                        <div style={{padding: '16px', display: 'flex', alignItems: 'center', gap: '16px'}}>
                            <i className="fas fa-search-minus" style={{color: 'var(--muted)'}}></i>
                            <input
                              type="range"
                              value={zoom}
                              min={1}
                              max={3}
                              step={0.1}
                              aria-labelledby="Zoom"
                              onChange={(e) => setZoom(e.target.value)}
                              style={{flex: 1}}
                            />
                            <i className="fas fa-search-plus" style={{color: 'var(--muted)'}}></i>
                        </div>
                        <div style={{padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc'}}>
                            <button className="btn btnOutline" onClick={() => setCropModalOpen(false)}>Batal</button>
                            <button className="btn btnPrimary" onClick={handleCropSave} style={{background: '#ee4d2d', color: '#fff', border: 'none'}}>Potong & Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ORDER DETAIL MODAL */}
            {selectedOrder && (
                <div style={{position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)'}}>
                    <div style={{background: '#fff', borderRadius: '12px', width: '95%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'}}>
                        <div style={{padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc'}}>
                            <div>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--dark)', margin: 0 }}>Detail Pesanan</h2>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>{selectedOrder.id?.split('-')[0] || 'INV-XXX'}</div>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} style={{ background: '#e2e8f0', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>Status Pesanan</div>
                                    <div>{getStatusBadge(selectedOrder.status)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>Tanggal Pembelian</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--dark)', fontWeight: 600 }}>
                                        {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </div>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>Rincian Produk</h3>
                            
                            {loadingOrderDetails ? (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '10px' }}></i>
                                    <div>Memuat rincian produk...</div>
                                </div>
                            ) : orderDetailItems.length === 0 ? (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                    <i className="fas fa-box-open" style={{ fontSize: '2rem', marginBottom: '10px', color: '#cbd5e1' }}></i>
                                    <div style={{ fontSize: '0.9rem' }}>Rincian barang tidak tersedia untuk pesanan lama ini.</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                    {orderDetailItems.map(item => (
                                        <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {item.products?.image_url ? (
                                                    <img src={item.products.image_url} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <i className="fas fa-image" style={{ color: '#cbd5e1', fontSize: '1.5rem' }}></i>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: 'var(--dark)', fontSize: '0.95rem', marginBottom: '4px' }}>{item.products?.name || 'Produk Tidak Diketahui'}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.quantity} x {formatRupiah(item.price_at_purchase)}</div>
                                            </div>
                                            <div style={{ fontWeight: 700, color: 'var(--dark)', fontSize: '0.95rem' }}>
                                                {formatRupiah(item.quantity * item.price_at_purchase)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginTop: '24px' }}>Rincian Pengiriman & Pembayaran</h3>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Kurir</div>
                                    <div style={{ fontWeight: 600, color: 'var(--dark)', fontSize: '0.9rem' }}>{selectedOrder.courier || '-'}</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Metode Pembayaran</div>
                                    <div style={{ fontWeight: 600, color: 'var(--dark)', fontSize: '0.9rem' }}>{selectedOrder.payment_method || '-'}</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '12px', marginTop: '4px' }}>
                                    <div style={{ color: 'var(--dark)', fontSize: '0.95rem', fontWeight: 700 }}>Total Belanja</div>
                                    <div style={{ fontWeight: 800, color: '#ee4d2d', fontSize: '1.1rem' }}>{formatRupiah(selectedOrder.total_amount)}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div style={{padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc'}}>
                            <button onClick={() => setSelectedOrder(null)} style={{ padding: '10px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Tutup</button>
                        </div>
                    </div>
                </div>
            )}

            {/* RETURN REASON MODAL */}
            {returnModalOpen && orderToReturn && (
                <div style={{position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)'}}>
                    <div style={{background: '#fff', borderRadius: '12px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'}}>
                        <div style={{padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc'}}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--dark)', margin: 0 }}>Ajukan Pengembalian</h2>
                            <button onClick={() => { setReturnModalOpen(false); setReturnReason(""); setOrderToReturn(null) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmitReturn} style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--dark)', marginBottom: '8px' }}>Alasan Pengembalian</label>
                                <textarea 
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    placeholder="Jelaskan alasan Anda mengembalikan barang ini (misal: Barang rusak, ukuran tidak sesuai...)"
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', minHeight: '100px', fontSize: '0.95rem' }}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button type="button" onClick={() => { setReturnModalOpen(false); setReturnReason(""); setOrderToReturn(null) }} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                                <button type="submit" disabled={submittingReturn || !returnReason.trim()} style={{ padding: '10px 20px', background: '#ee4d2d', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: submittingReturn || !returnReason.trim() ? 'not-allowed' : 'pointer', opacity: submittingReturn || !returnReason.trim() ? 0.7 : 1 }}>
                                    {submittingReturn ? "Memproses..." : "Kirim Pengajuan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}
