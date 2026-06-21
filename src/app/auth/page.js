"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useStore, useUIStore } from "@/lib/store"
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

export default function AuthPage() {
  const router = useRouter()
  const showToast = useUIStore((state) => state.showToast)
  const setSession = useStore((state) => state.setSession)
  const [isRegister, setIsRegister] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      if (error === 'CouldNotAuthenticate') {
        showToast("Gagal Login: Client Secret di Supabase salah atau belum dikonfigurasi.", "error");
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (error) {
        showToast("Gagal Login: " + error, "error");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [showToast]);

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) {
      showToast("Gagal login dengan Google: " + error.message, "error")
    }
  }

  // Handlers for inputs
  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Validation states
  const [regEmailErr, setRegEmailErr] = useState("")
  const [regPasswordErr, setRegPasswordErr] = useState("")
  const [loginEmailErr, setLoginEmailErr] = useState("")
  const [loginPasswordErr, setLoginPasswordErr] = useState("")

  const validateEmail = (email) => {
    if (!email) return "Email wajib diisi"
    if (!email.endsWith("@gmail.com")) return "Gunakan akun @gmail.com"
    return ""
  }

  const validatePassword = (password) => {
    if (!password) return "Password wajib diisi"
    if (password.length < 8) return "Password minimal 8 karakter"
    if (!/[A-Z]/.test(password)) return "Password harus mengandung huruf kapital"
    if (!/\d/.test(password)) return "Password harus mengandung angka"
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)) return "Password harus mengandung simbol"
    return ""
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    
    const emailErr = validateEmail(regEmail)
    const passErr = validatePassword(regPassword)
    
    setRegEmailErr(emailErr)
    setRegPasswordErr(passErr)

    if (emailErr || passErr || !regName) {
      showToast("Harap lengkapi & perbaiki data pendaftaran yang merah!", "error")
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: {
          full_name: regName
        }
      }
    })

    if (error) {
      showToast("Gagal mendaftar: " + error.message, "error")
      return
    }

    showToast(`Pendaftaran berhasil! Selamat datang, ${regName}.`, "success")
    setTimeout(() => {
        router.push('/')
    }, 1000)
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    const emailErr = validateEmail(loginEmail)
    const passErr = loginPassword ? "" : "Password wajib diisi"

    setLoginEmailErr(emailErr)
    setLoginPasswordErr(passErr)

    if (emailErr || passErr) {
      showToast("Harap perbaiki email/password Anda!", "error")
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })

    if (error) {
      showToast("Email atau Password salah!", "error")
      return
    }

    showToast(`Berhasil login!`, "success")
    
    setTimeout(() => {
        const role = data.session?.user?.user_metadata?.role
        if (role === 'owner') {
            router.push('/dashboard') 
        } else {
            router.push('/') 
        }
    }, 1000)
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header ala Shopee */}
        <header style={{ background: '#fff', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', zIndex: 10 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: '#fff', width: '36px', height: '36px', borderRadius: '10px', fontWeight: 'bold', fontSize: '20px' }}>
                    S
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>SembakoBerkah</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 500, color: '#333', marginLeft: '10px' }}>
                    {isRegister ? 'Daftar' : 'Masuk'}
                </span>
            </Link>
            <a href="/bantuan" style={{ fontSize: '0.9rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Butuh bantuan?</a>
        </header>

        {/* Body Background ala Shopee */}
        <div style={{ flex: 1, background: 'var(--primary)', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', position: 'relative', zIndex: 2 }}>
                
                {/* Left Side: SVG Animation */}
                <div style={{ width: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff' }}>
                    
                    {/* SVG ANIMATION BLOCK */}
                    <div className="svg-animation-wrapper" style={{ position: 'relative', width: '400px', height: '300px' }}>
                        <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                            <defs>
                                <style>
                                    {`
                                        @keyframes tapFinger {
                                            0%, 100% { transform: translate(0, 0); }
                                            50% { transform: translate(-5px, 10px); }
                                        }
                                        @keyframes popPackage {
                                            0% { transform: scale(0) translateY(0); opacity: 0; }
                                            30% { transform: scale(1.2) translateY(-40px); opacity: 1; }
                                            50% { transform: scale(1) translateY(-30px); opacity: 1; }
                                            80% { transform: scale(0.6) translate(200px, 80px); opacity: 1; }
                                            90% { transform: scale(0) translate(200px, 80px); opacity: 0; }
                                            100% { transform: scale(0) translate(200px, 80px); opacity: 0; }
                                        }
                                        @keyframes driveTruck {
                                            0% { transform: translateX(400px); }
                                            30% { transform: translateX(120px); }
                                            70% { transform: translateX(120px); }
                                            100% { transform: translateX(-400px); }
                                        }
                                        @keyframes floatCloud {
                                            0% { transform: translateX(0); }
                                            50% { transform: translateX(-20px); }
                                            100% { transform: translateX(0); }
                                        }
                                        .finger { animation: tapFinger 4s infinite ease-in-out; }
                                        .package-anim { animation: popPackage 4s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94); transform-origin: center; }
                                        .truck-anim { animation: driveTruck 4s infinite ease-in-out; }
                                        .cloud1 { animation: floatCloud 6s infinite ease-in-out; }
                                        .cloud2 { animation: floatCloud 8s infinite ease-in-out reverse; }
                                        @keyframes fadeInForm {
                                            0% { opacity: 0; transform: translateY(10px); }
                                            100% { opacity: 1; transform: translateY(0); }
                                        }
                                    `}
                                </style>
                            </defs>
                            {/* Clouds */}
                            <path className="cloud1" d="M50 80 Q60 60 80 80 Q100 70 110 90 Q120 100 100 100 L50 100 Q30 100 40 80 Z" fill="rgba(255,255,255,0.2)" />
                            <path className="cloud2" d="M250 120 Q260 100 280 120 Q300 110 310 130 Q320 140 300 140 L250 140 Q230 140 240 120 Z" fill="rgba(255,255,255,0.15)" />

                            {/* Person & Phone */}
                            <g transform="translate(40, 130)">
                                {/* Body */}
                                <path d="M40 150 Q40 80 80 80 Q120 80 120 150 Z" fill="#ffffff" opacity="0.95" />
                                {/* Head */}
                                <circle cx="80" cy="50" r="30" fill="#ffffff" />
                                {/* Phone */}
                                <rect x="85" y="70" width="30" height="50" rx="5" fill="#1e293b" />
                                <rect x="88" y="73" width="24" height="44" rx="2" fill="#f8fafc" />
                                {/* App UI Line */}
                                <line x1="92" y1="85" x2="108" y2="85" stroke="#cbd5e1" strokeWidth="2" />
                                <line x1="92" y1="95" x2="100" y2="95" stroke="#cbd5e1" strokeWidth="2" />
                                <rect x="92" y="105" width="16" height="6" rx="2" fill="#03ac0e" />
                                {/* Arm holding phone */}
                                <path d="M50 100 Q80 120 90 100" fill="none" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" />
                                {/* Tapping Finger */}
                                <g className="finger">
                                    <path d="M120 130 Q105 110 100 95" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" />
                                </g>
                            </g>

                            {/* The Package */}
                            <g className="package-anim" transform="translate(130, 180)">
                                <path d="M-20 -20 L20 -20 L20 20 L-20 20 Z" fill="#fef08a" />
                                <path d="M-20 -20 L0 -30 L20 -20" fill="#fde047" />
                                <line x1="0" y1="-30" x2="0" y2="20" stroke="#ca8a04" strokeWidth="2" />
                                <line x1="-20" y1="-20" x2="20" y2="-20" stroke="#ca8a04" strokeWidth="2" />
                            </g>

                            {/* The Truck */}
                            <g className="truck-anim" transform="translate(0, 160)">
                                {/* Road */}
                                <line x1="-400" y1="70" x2="800" y2="70" stroke="rgba(255,255,255,0.3)" strokeWidth="4" strokeDasharray="20 10" />
                                {/* Back box */}
                                <rect x="200" y="0" width="90" height="60" rx="4" fill="#ffffff" />
                                <rect x="210" y="10" width="70" height="40" fill="#f8fafc" />
                                {/* Logo on truck */}
                                <circle cx="245" cy="30" r="14" fill="var(--primary)" />
                                <text x="245" y="34" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">S</text>
                                {/* Front cabin */}
                                <path d="M290 20 L320 20 Q330 20 335 35 L340 60 L290 60 Z" fill="#ffffff" />
                                <path d="M295 25 L315 25 L320 35 L295 35 Z" fill="#e2e8f0" />
                                {/* Wheels */}
                                <circle cx="220" cy="65" r="12" fill="#1e293b" />
                                <circle cx="220" cy="65" r="6" fill="#cbd5e1" />
                                <circle cx="320" cy="65" r="12" fill="#1e293b" />
                                <circle cx="320" cy="65" r="6" fill="#cbd5e1" />
                            </g>
                        </svg>
                    </div>

                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '10px', letterSpacing: '-0.5px' }}>Lebih Hemat Lebih Cepat</h2>
                    <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)', marginTop: '8px' }}>Pesan sembako sekarang, langsung diantar!</p>
                </div>

                {/* Right Side: Login Card (Premium Style) */}
                <div style={{ width: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    {isRegister ? (
                        <form onSubmit={handleRegister} style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', animation: 'fadeInForm 0.3s ease-out forwards' }}>
                            <Link href="/" style={{alignSelf: 'flex-start', textDecoration: 'none', color: 'var(--muted)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px'}}>
                                <i className="fas fa-arrow-left"></i> Kembali ke Etalase
                            </Link>
                            <h1 style={{marginBottom: '16px', color: 'var(--dark)', textAlign: 'center', fontSize: '1.6rem'}}>Buat Akun</h1>
                            
                            <button type="button" onClick={handleGoogleLogin} style={{width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ddd', background: '#fff', color: '#444', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', marginBottom: '16px', fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', textTransform: 'uppercase'}}>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="18" alt="Google" />
                                Lanjutkan dengan Google
                            </button>

                            <div style={{display: 'flex', alignItems: 'center', width: '100%', marginBottom: '16px'}}>
                                <div style={{flex: 1, height: '1px', background: '#eee'}}></div>
                                <span style={{padding: '0 12px', color: 'var(--muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Atau daftar email</span>
                                <div style={{flex: 1, height: '1px', background: '#eee'}}></div>
                            </div>

                            <div style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                {/* Nama Lengkap */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left'}}>
                                    <label style={{fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark)'}}>Nama Lengkap</label>
                                    <input 
                                        type="text" 
                                        placeholder="Masukkan nama Anda" 
                                        value={regName}
                                        onChange={(e) => setRegName(e.target.value)}
                                        style={{margin: 0, borderRadius: '10px', border: '1px solid #ddd', background: '#f8fafc', padding: '12px 14px', fontSize: '0.9rem', fontFamily: 'var(--font)', outline: 'none'}}
                                    />
                                </div>

                                {/* Email */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left'}}>
                                    <label style={{fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark)'}}>Alamat Email</label>
                                    <input 
                                        type="email" 
                                        placeholder="Contoh: budi@gmail.com" 
                                        value={regEmail}
                                        onChange={(e) => {
                                            setRegEmail(e.target.value)
                                            setRegEmailErr(validateEmail(e.target.value))
                                        }}
                                        style={{margin: 0, borderRadius: '10px', border: regEmailErr ? '1px solid #ef4444' : '1px solid #ddd', background: '#f8fafc', padding: '12px 14px', fontSize: '0.9rem', fontFamily: 'var(--font)', outline: 'none'}}
                                    />
                                    <div style={{fontSize: '0.7rem', color: '#64748b', marginTop: '2px'}}>(Wajib menggunakan format @gmail.com)</div>
                                    {regEmailErr && <span style={{color: '#ef4444', fontSize: '0.75rem', fontWeight: 600}}><i className="fas fa-exclamation-circle"></i> {regEmailErr}</span>}
                                </div>

                                {/* Password */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left'}}>
                                    <label style={{fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark)'}}>Password</label>
                                    <input 
                                        type="password" 
                                        placeholder="Buat password yang kuat" 
                                        value={regPassword}
                                        onChange={(e) => {
                                            setRegPassword(e.target.value)
                                            setRegPasswordErr(validatePassword(e.target.value))
                                        }}
                                        style={{margin: 0, borderRadius: '10px', border: regPasswordErr ? '1px solid #ef4444' : '1px solid #ddd', background: '#f8fafc', padding: '12px 14px', fontSize: '0.9rem', fontFamily: 'var(--font)', outline: 'none'}}
                                    />
                                    <div style={{fontSize: '0.7rem', color: '#64748b', marginTop: '2px'}}>(Min 1 capital, min 1 symbol, min 1 angka)</div>
                                    {regPasswordErr && <span style={{color: '#ef4444', fontSize: '0.75rem', fontWeight: 600}}><i className="fas fa-exclamation-circle"></i> {regPasswordErr}</span>}
                                </div>
                            </div>

                            <button type="submit" style={{width: '100%', marginTop: '20px', padding: '12px', borderRadius: '10px', fontSize: '0.95rem', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', background: 'var(--primary)', color: '#fff', fontWeight: 800}}>DAFTAR</button>
                            
                            <div style={{marginTop: '16px', fontSize: '0.85rem', textAlign: 'center'}}>
                                <span style={{color: 'var(--muted)'}}>Sudah punya akun? </span>
                                <a onClick={() => setIsRegister(false)} style={{cursor: 'pointer', color: 'var(--primary)', fontWeight: 700}}>Masuk di sini</a>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', animation: 'fadeInForm 0.3s ease-out forwards' }}>
                            <Link href="/" style={{alignSelf: 'flex-start', textDecoration: 'none', color: 'var(--muted)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px'}}>
                                <i className="fas fa-arrow-left"></i> Kembali ke Etalase
                            </Link>
                            <h1 style={{marginBottom: '16px', color: 'var(--dark)', textAlign: 'center', fontSize: '1.6rem'}}>Masuk</h1>
                            
                            <button type="button" onClick={handleGoogleLogin} style={{width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ddd', background: '#fff', color: '#444', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', marginBottom: '16px', fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', textTransform: 'uppercase'}}>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="18" alt="Google" />
                                Lanjutkan dengan Google
                            </button>

                            <div style={{display: 'flex', alignItems: 'center', width: '100%', marginBottom: '16px'}}>
                                <div style={{flex: 1, height: '1px', background: '#eee'}}></div>
                                <span style={{padding: '0 12px', color: 'var(--muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Atau masuk dengan email</span>
                                <div style={{flex: 1, height: '1px', background: '#eee'}}></div>
                            </div>

                            <div style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                {/* Email */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left'}}>
                                    <label style={{fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark)'}}>Alamat Email</label>
                                    <input 
                                        type="email" 
                                        placeholder="Contoh: budi@gmail.com" 
                                        value={loginEmail}
                                        onChange={(e) => {
                                            setLoginEmail(e.target.value)
                                            setLoginEmailErr(validateEmail(e.target.value))
                                        }}
                                        style={{margin: 0, borderRadius: '10px', border: loginEmailErr ? '1px solid #ef4444' : '1px solid #ddd', background: '#f8fafc', padding: '12px 14px', fontSize: '0.9rem', fontFamily: 'var(--font)', outline: 'none'}}
                                    />
                                    <div style={{fontSize: '0.7rem', color: '#64748b', marginTop: '2px'}}>(Wajib menggunakan format @gmail.com)</div>
                                    {loginEmailErr && <span style={{color: '#ef4444', fontSize: '0.75rem', fontWeight: 600}}><i className="fas fa-exclamation-circle"></i> {loginEmailErr}</span>}
                                </div>

                                {/* Password */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left'}}>
                                    <label style={{fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark)'}}>Password</label>
                                    <input 
                                        type="password" 
                                        placeholder="Masukkan password Anda" 
                                        value={loginPassword}
                                        onChange={(e) => {
                                            setLoginPassword(e.target.value)
                                            setLoginPasswordErr(e.target.value ? "" : "Password wajib diisi")
                                        }}
                                        style={{margin: 0, borderRadius: '10px', border: loginPasswordErr ? '1px solid #ef4444' : '1px solid #ddd', background: '#f8fafc', padding: '12px 14px', fontSize: '0.9rem', fontFamily: 'var(--font)', outline: 'none'}}
                                    />
                                    <div style={{fontSize: '0.7rem', color: '#64748b', marginTop: '2px'}}>(Min 1 capital, min 1 symbol, min 1 angka)</div>
                                    {loginPasswordErr && <span style={{color: '#ef4444', fontSize: '0.75rem', fontWeight: 600}}><i className="fas fa-exclamation-circle"></i> {loginPasswordErr}</span>}
                                </div>
                            </div>

                            <div style={{width: '100%', textAlign: 'right', marginTop: '8px'}}>
                                <a href="#" onClick={(e) => { e.preventDefault(); showToast('Silakan hubungi admin untuk reset password', 'info'); }} style={{fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none'}}>Lupa password?</a>
                            </div>

                            <button type="submit" style={{width: '100%', marginTop: '16px', padding: '12px', borderRadius: '10px', fontSize: '0.95rem', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', background: 'var(--primary)', color: '#fff', fontWeight: 800}}>MASUK</button>
                            
                            <div style={{marginTop: '16px', fontSize: '0.85rem', textAlign: 'center'}}>
                                <span style={{color: 'var(--muted)'}}>Belum punya akun? </span>
                                <a onClick={() => setIsRegister(true)} style={{cursor: 'pointer', color: 'var(--primary)', fontWeight: 700}}>Daftar sekarang</a>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    </div>
  )
}
