"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useStore, useUIStore } from "@/lib/store"
import { createClient } from "@/lib/supabaseClient"
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '@/lib/cropImage'

export default function ProfilePage() {
    const { session, setSession } = useStore()
    const showToast = useUIStore((state) => state.showToast)
    
    // Tab State
    const [activeTab, setActiveTab] = useState("profil")

    // Profil Form States
    const [username, setUsername] = useState("")
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")

    const [gender, setGender] = useState("")
    const [birthDate, setBirthDate] = useState("")
    const [address, setAddress] = useState("")
    const [avatarUrl, setAvatarUrl] = useState("")
    
    // Password States
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

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
            setAddress(meta.address || "")
            setAvatarUrl(meta.avatar_url || "")
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
                showToast("Foto berhasil diunggah! Jangan lupa klik Simpan.", "success")
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
        try {
            setSaving(true)
            const supabase = createClient()
            const updates = {
                username, full_name: fullName, phone,
                gender, birth_date: birthDate, address, avatar_url: avatarUrl
            }
            const { data, error } = await supabase.auth.updateUser({ data: updates })
            if (error) throw error
            
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

    const handlePasswordChange = async () => {
        if (password !== confirmPassword) {
            showToast("Password dan konfirmasi tidak cocok!", "error")
            return
        }
        if (password.length < 6) {
            showToast("Password minimal 6 karakter!", "error")
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
        <main className="contentArea" id="mainContent" style={{ width: '100%', maxWidth: '1200px', margin: '40px auto', display: 'flex', gap: '40px', padding: '0 20px', alignItems: 'flex-start' }}>
            {/* SIDEBAR */}
            <aside style={{ width: '250px', flexShrink: 0, paddingRight: '20px', borderRight: '1px solid #e2e8f0', minHeight: '60vh' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <img src={avatarUrl || "/people.png"} alt="Avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--dark)' }}>{username || fullName || 'User'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => setActiveTab('profil')}>
                            <i className="fas fa-pen"></i> Ubah Profil
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px', fontSize: '1.05rem' }}>
                            <i className="fas fa-user" style={{ width: '24px', textAlign: 'center' }}></i> Akun Saya
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '32px', fontSize: '0.95rem' }}>
                            <div style={{ color: activeTab === 'profil' ? 'var(--primary)' : 'var(--muted)', fontWeight: activeTab === 'profil' ? 700 : 500, cursor: 'pointer', padding: '8px 0', transition: 'all 0.2s' }} onClick={() => setActiveTab('profil')}>Profil</div>
                            <div style={{ color: activeTab === 'alamat' ? 'var(--primary)' : 'var(--muted)', fontWeight: activeTab === 'alamat' ? 700 : 500, cursor: 'pointer', padding: '8px 0', transition: 'all 0.2s' }} onClick={() => setActiveTab('alamat')}>Alamat</div>
                            <div style={{ color: activeTab === 'password' ? 'var(--primary)' : 'var(--muted)', fontWeight: activeTab === 'password' ? 700 : 500, cursor: 'pointer', padding: '8px 0', transition: 'all 0.2s' }} onClick={() => setActiveTab('password')}>Ubah Password</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: activeTab === 'riwayat' ? 800 : 600, color: activeTab === 'riwayat' ? 'var(--primary)' : '#475569', cursor: 'pointer', padding: '8px 0', fontSize: '1.05rem', transition: 'all 0.2s' }} onClick={() => setActiveTab('riwayat')}>
                        <i className="fas fa-clipboard-list" style={{ width: '24px', color: '#3b82f6', textAlign: 'center' }}></i> Riwayat Pesanan
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: activeTab === 'notifikasi' ? 800 : 600, color: activeTab === 'notifikasi' ? 'var(--primary)' : '#475569', cursor: 'pointer', padding: '8px 0', fontSize: '1.05rem', transition: 'all 0.2s' }} onClick={() => setActiveTab('notifikasi')}>
                        <i className="fas fa-bell" style={{ width: '24px', color: '#f59e0b', textAlign: 'center' }}></i> Notifikasi
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="card" style={{ flex: 1, padding: '40px', borderRadius: '12px', background: '#ffffff', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                {activeTab === 'profil' && (
                    <>
                        <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '32px' }}>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Profil Saya</h1>
                            <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '6px' }}>Kelola informasi profil Anda untuk mengontrol, melindungi dan mengamankan akun</p>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <div style={{ flex: '1', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '120px', textAlign: 'right', paddingRight: '20px', fontSize: '0.9rem', color: '#555' }}>Username</div>
                                    <div style={{ flex: 1 }}>
                                        <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', maxWidth: '400px' }} />
                                        <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>Username hanya dapat diubah satu (1) kali.</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '120px', textAlign: 'right', paddingRight: '20px', fontSize: '0.9rem', color: '#555' }}>Nama</div>
                                    <div style={{ flex: 1 }}><input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: '100%', maxWidth: '400px' }} /></div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '120px', textAlign: 'right', paddingRight: '20px', fontSize: '0.9rem', color: '#555' }}>Email</div>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.9rem', color: '#333' }}>{maskedEmail}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '120px', textAlign: 'right', paddingRight: '20px', fontSize: '0.9rem', color: '#555' }}>Nomor Telepon</div>
                                    <div style={{ flex: 1 }}>
                                        <input 
                                            type="tel"
                                            className="input" 
                                            value={phone} 
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} 
                                            placeholder="Contoh: 08123456789" 
                                            style={{ width: '100%', maxWidth: '250px' }} 
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '120px', textAlign: 'right', paddingRight: '20px', fontSize: '0.9rem', color: '#555' }}>Jenis Kelamin</div>
                                    <div style={{ flex: 1, display: 'flex', gap: '16px', fontSize: '0.9rem', color: '#333' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="radio" name="gender" value="Laki-laki" checked={gender === 'Laki-laki'} onChange={(e) => setGender(e.target.value)} /> Laki-laki</label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="radio" name="gender" value="Perempuan" checked={gender === 'Perempuan'} onChange={(e) => setGender(e.target.value)} /> Perempuan</label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="radio" name="gender" value="Lainnya" checked={gender === 'Lainnya'} onChange={(e) => setGender(e.target.value)} /> Lainnya</label>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '120px', textAlign: 'right', paddingRight: '20px', fontSize: '0.9rem', color: '#555' }}>Tanggal lahir</div>
                                    <div style={{ flex: 1 }}><input type="date" className="input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={{ width: '100%', maxWidth: '200px' }} /></div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                                    <div style={{ width: '120px', paddingRight: '20px' }}></div>
                                    <button className="btn btnPrimary" style={{ padding: '10px 24px', background: '#ee4d2d', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.95rem' }} onClick={handleSaveMetadata} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
                                </div>
                            </div>
                            <div style={{ width: '280px', borderLeft: '1px solid #efefef', paddingLeft: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#333', margin: 0 }}>Alamat Saya</h1>
                            <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '4px' }}>Pastikan alamat terisi dengan benar untuk pengiriman pesanan.</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                <div style={{ width: '120px', textAlign: 'right', paddingRight: '20px', fontSize: '0.9rem', color: '#555', marginTop: '10px' }}>Alamat Lengkap</div>
                                <div style={{ flex: 1 }}>
                                    <textarea className="input" value={address} onChange={(e) => setAddress(e.target.value)} rows="5" style={{ width: '100%', resize: 'vertical' }} placeholder="Contoh: Jl. Sudirman No. 123, RT 01/02, Kec. Melati, Kota Jakarta Selatan" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                                <div style={{ width: '120px', paddingRight: '20px' }}></div>
                                <button className="btn btnPrimary" style={{ padding: '10px 24px', background: '#ee4d2d', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.95rem' }} onClick={handleSaveMetadata} disabled={saving}>{saving ? "Menyimpan..." : "Simpan Alamat"}</button>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'password' && (
                    <>
                        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#333', margin: 0 }}>Ubah Password</h1>
                            <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '4px' }}>Untuk keamanan akun Anda, mohon tidak menyebarkan password Anda kepada orang lain.</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: '150px', textAlign: 'right', paddingRight: '20px', fontSize: '0.9rem', color: '#555' }}>Password Baru</div>
                                <div style={{ flex: 1 }}>
                                    <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: '150px', textAlign: 'right', paddingRight: '20px', fontSize: '0.9rem', color: '#555' }}>Konfirmasi Password</div>
                                <div style={{ flex: 1 }}>
                                    <input type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ketik ulang password baru" style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                                <div style={{ width: '150px', paddingRight: '20px' }}></div>
                                <button className="btn btnPrimary" style={{ padding: '10px 24px', background: '#ee4d2d', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.95rem' }} onClick={handlePasswordChange} disabled={saving}>{saving ? "Memproses..." : "Konfirmasi"}</button>
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
                        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                            <i className="fas fa-clipboard-list fa-3x" style={{ marginBottom: '16px', color: '#cbd5e1' }}></i>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--dark)' }}>Belum Ada Pesanan</div>
                            <p style={{ marginTop: '8px' }}>Sepertinya Anda belum membuat pesanan sama sekali.</p>
                            <Link href="/">
                                <button className="btn btnPrimary" style={{ marginTop: '20px', background: '#ee4d2d', border: 'none', color: '#fff' }}>Belanja Sekarang</button>
                            </Link>
                        </div>
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
        </main>
    )
}
