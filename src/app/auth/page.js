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
    <div style={{position: 'relative', minHeight: '100vh', margin: 0, padding: 0}}>
      <div className="auth-page-wrapper" style={{ minHeight: '100vh' }}>
          <div className={`auth-box ${isRegister ? 'right-panel-active' : ''}`} id="authSliderContainer">

              {/* SIGN UP FORM */}
              <div className="auth-form-container auth-sign-up" style={{backgroundColor: '#fff'}}>
                    <form onSubmit={handleRegister} style={{ padding: '0 32px', width: '100%', maxWidth: '420px', margin: '0 auto' }}>
                      <Link href="/" style={{alignSelf: 'flex-start', textDecoration: 'none', color: 'var(--muted)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px'}}>
                          <i className="fas fa-arrow-left"></i> Kembali ke Etalase
                      </Link>
                      <h1 style={{marginBottom: '20px', color: 'var(--dark)'}}>Buat Akun</h1>
                      
                      <button type="button" onClick={handleGoogleLogin} style={{width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', background: '#fff', color: '#444', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', marginBottom: '20px', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
                          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="18" alt="Google" />
                          Lanjutkan dengan Google
                      </button>

                      <div style={{display: 'flex', alignItems: 'center', width: '100%', marginBottom: '20px'}}>
                          <div style={{flex: 1, height: '1px', background: '#eee'}}></div>
                          <span style={{padding: '0 12px', color: 'var(--muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Atau daftar email</span>
                          <div style={{flex: 1, height: '1px', background: '#eee'}}></div>
                      </div>

                      <div style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '14px'}}>
                          {/* Nama Lengkap */}
                          <div style={{display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left'}}>
                              <label style={{fontSize: '0.8rem', fontWeight: 700, color: 'var(--dark)'}}>Nama Lengkap</label>
                              <input 
                                type="text" 
                                placeholder="Masukkan nama Anda" 
                                value={regName}
                                onChange={(e) => setRegName(e.target.value)}
                                style={{margin: 0, borderRadius: '10px', border: '1px solid #ddd', background: '#f8fafc', padding: '12px 14px', fontSize: '0.9rem', fontFamily: 'var(--font)'}}
                              />
                          </div>

                          {/* Email */}
                          <div style={{display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left'}}>
                              <label style={{fontSize: '0.8rem', fontWeight: 700, color: 'var(--dark)'}}>Alamat Email</label>
                              <input 
                                type="email" 
                                placeholder="Contoh: budi@gmail.com" 
                                value={regEmail}
                                onChange={(e) => {
                                    setRegEmail(e.target.value)
                                    setRegEmailErr(validateEmail(e.target.value))
                                }}
                                style={{margin: 0, borderRadius: '10px', border: regEmailErr ? '1px solid #ef4444' : '1px solid #ddd', background: '#f8fafc', padding: '12px 14px', fontSize: '0.9rem', fontFamily: 'var(--font)'}}
                              />
                              <div style={{fontSize: '0.7rem', color: '#64748b', marginTop: '2px'}}>(Wajib menggunakan format @gmail.com)</div>
                              {regEmailErr && <span style={{color: '#ef4444', fontSize: '0.75rem', fontWeight: 600}}><i className="fas fa-exclamation-circle"></i> {regEmailErr}</span>}
                          </div>

                          {/* Password */}
                          <div style={{display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left'}}>
                              <label style={{fontSize: '0.8rem', fontWeight: 700, color: 'var(--dark)'}}>Password</label>
                              <input 
                                type="password" 
                                placeholder="Buat password yang kuat" 
                                value={regPassword}
                                onChange={(e) => {
                                    setRegPassword(e.target.value)
                                    setRegPasswordErr(validatePassword(e.target.value))
                                }}
                                style={{margin: 0, borderRadius: '10px', border: regPasswordErr ? '1px solid #ef4444' : '1px solid #ddd', background: '#f8fafc', padding: '12px 14px', fontSize: '0.9rem', fontFamily: 'var(--font)'}}
                              />
                              <div style={{fontSize: '0.7rem', color: '#64748b', marginTop: '2px'}}>(Min 1 capital, min 1 symbol, min 1 angka)</div>
                              {regPasswordErr && <span style={{color: '#ef4444', fontSize: '0.75rem', fontWeight: 600}}><i className="fas fa-exclamation-circle"></i> {regPasswordErr}</span>}
                          </div>
                      </div>

                      <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '24px', padding: '12px', borderRadius: '10px', fontSize: '0.9rem', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)'}}>Daftar Sekarang</button>
                      <div className="auth-mobile-switch" style={{marginTop: '20px', fontSize: '0.85rem'}}>
                          Sudah punya akun? <a onClick={() => setIsRegister(false)} style={{cursor: 'pointer', color: 'var(--primary)', fontWeight: 700}}>Masuk di sini</a>
                      </div>
                    </form>
              </div>

              {/* SIGN IN FORM */}
              <div className="auth-form-container auth-sign-in" style={{backgroundColor: '#fff'}}>
                  <form onSubmit={handleLogin} style={{ padding: '0 32px', width: '100%', maxWidth: '420px', margin: '0 auto' }}>
                      <Link href="/" style={{alignSelf: 'flex-start', textDecoration: 'none', color: 'var(--muted)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px'}}>
                          <i className="fas fa-arrow-left"></i> Kembali ke Etalase
                      </Link>
                      <h1 style={{marginBottom: '20px', color: 'var(--dark)'}}>Masuk</h1>
                      
                      <button type="button" onClick={handleGoogleLogin} style={{width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', background: '#fff', color: '#444', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', marginBottom: '20px', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
                          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="18" alt="Google" />
                          Lanjutkan dengan Google
                      </button>

                      <div style={{display: 'flex', alignItems: 'center', width: '100%', marginBottom: '20px'}}>
                          <div style={{flex: 1, height: '1px', background: '#eee'}}></div>
                          <span style={{padding: '0 12px', color: 'var(--muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Atau masuk dengan email</span>
                          <div style={{flex: 1, height: '1px', background: '#eee'}}></div>
                      </div>

                      <div style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '14px'}}>
                          {/* Email */}
                          <div style={{display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left'}}>
                              <label style={{fontSize: '0.8rem', fontWeight: 700, color: 'var(--dark)'}}>Alamat Email</label>
                              <input 
                                type="email" 
                                placeholder="Contoh: budi@gmail.com" 
                                value={loginEmail}
                                onChange={(e) => {
                                    setLoginEmail(e.target.value)
                                    setLoginEmailErr(validateEmail(e.target.value))
                                }}
                                style={{margin: 0, borderRadius: '10px', border: loginEmailErr ? '1px solid #ef4444' : '1px solid #ddd', background: '#f8fafc', padding: '12px 14px', fontSize: '0.9rem', fontFamily: 'var(--font)'}}
                              />
                              <div style={{fontSize: '0.7rem', color: '#64748b', marginTop: '2px'}}>(Wajib menggunakan format @gmail.com)</div>
                              {loginEmailErr && <span style={{color: '#ef4444', fontSize: '0.75rem', fontWeight: 600}}><i className="fas fa-exclamation-circle"></i> {loginEmailErr}</span>}
                          </div>

                          {/* Password */}
                          <div style={{display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left'}}>
                              <label style={{fontSize: '0.8rem', fontWeight: 700, color: 'var(--dark)'}}>Password</label>
                              <input 
                                type="password" 
                                placeholder="Masukkan password Anda" 
                                value={loginPassword}
                                onChange={(e) => {
                                    setLoginPassword(e.target.value)
                                    setLoginPasswordErr(e.target.value ? "" : "Password wajib diisi")
                                }}
                                style={{margin: 0, borderRadius: '10px', border: loginPasswordErr ? '1px solid #ef4444' : '1px solid #ddd', background: '#f8fafc', padding: '12px 14px', fontSize: '0.9rem', fontFamily: 'var(--font)'}}
                              />
                              <div style={{fontSize: '0.7rem', color: '#64748b', marginTop: '2px'}}>(Min 1 capital, min 1 symbol, min 1 angka)</div>
                              {loginPasswordErr && <span style={{color: '#ef4444', fontSize: '0.75rem', fontWeight: 600}}><i className="fas fa-exclamation-circle"></i> {loginPasswordErr}</span>}
                          </div>
                      </div>

                      <div style={{width: '100%', textAlign: 'right', marginTop: '6px'}}>
                          <a href="#" onClick={(e) => { e.preventDefault(); showToast('Silakan hubungi admin untuk reset password', 'info'); }} style={{fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none'}}>Lupa password?</a>
                      </div>

                      <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '24px', padding: '12px', borderRadius: '10px', fontSize: '0.9rem', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)'}}>Masuk</button>
                      
                      <div className="auth-mobile-switch" style={{marginTop: '20px', fontSize: '0.85rem'}}>
                          Belum punya akun? <a onClick={() => setIsRegister(true)} style={{cursor: 'pointer', color: 'var(--primary)', fontWeight: 700}}>Daftar sekarang</a>
                      </div>
                  </form>
              </div>

              {/* TOGGLE PANEL */}
              <div className="toggle-container">
                  <div className="toggle">
                      <div className="toggle-panel toggle-left">
                          <h1>Selamat Datang Kembali!</h1>
                          <p>Masuk dengan akun Anda untuk melanjutkan belanja sembako hemat dan berkualitas</p>
                          <button className="ghost" type="button" onClick={() => setIsRegister(false)}>Masuk</button>
                      </div>
                      <div className="toggle-panel toggle-right">
                          <h1>Halo, Pelanggan!</h1>
                          <p>Daftarkan diri Anda dan mulai perjalanan belanja bersama SembakoBerkah</p>
                          <button className="ghost" type="button" onClick={() => setIsRegister(true)}>Daftar</button>
                      </div>
                  </div>
              </div>

          </div>
      </div>
    </div>
  )
}
