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

  // Show/hide password
  const [showRegPass, setShowRegPass] = useState(false)
  const [showLoginPass, setShowLoginPass] = useState(false)

  const validateEmail = (email) => {
    if (!email) return "Email wajib diisi"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Format email tidak valid"
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

    if (data.session) {
      setSession(data.session)
      showToast(`Pendaftaran berhasil! Selamat datang, ${regName}.`, "success")
      setTimeout(() => {
          router.push('/')
      }, 1000)
    } else {
      showToast(`Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi sebelum login.`, "success")
      setRegEmail("")
      setRegPassword("")
      setRegName("")
      setIsRegister(false)
    }
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

    let role = data.session?.user?.user_metadata?.role
    if (data.session?.user?.id) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.session.user.id).single()
        if (profile?.role) role = profile.role
    }

    showToast(`Berhasil login!`, "success")
    
    setTimeout(() => {
        if (role?.toLowerCase() === 'owner') {
            router.push('/dashboard') 
        } else {
            router.push('/') 
        }
    }, 1000)
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatBubble {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-18px) scale(1.04); }
        }
        @keyframes tapFinger {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(-5px, 10px); }
        }
        @keyframes popPackage {
          0%   { transform: scale(0) translateY(0); opacity: 0; }
          30%  { transform: scale(1.2) translateY(-40px); opacity: 1; }
          50%  { transform: scale(1) translateY(-30px); opacity: 1; }
          80%  { transform: scale(0.6) translate(200px, 80px); opacity: 1; }
          90%  { transform: scale(0) translate(200px, 80px); opacity: 0; }
          100% { transform: scale(0) translate(200px, 80px); opacity: 0; }
        }
        @keyframes driveTruck {
          0%   { transform: translateX(400px); }
          30%  { transform: translateX(120px); }
          70%  { transform: translateX(120px); }
          100% { transform: translateX(-400px); }
        }
        @keyframes floatCloud {
          0%, 100% { transform: translateX(0); }
          50%       { transform: translateX(-20px); }
        }
        .finger        { animation: tapFinger 4s infinite ease-in-out; }
        .package-anim  { animation: popPackage 4s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94); transform-origin: center; }
        .truck-anim    { animation: driveTruck 4s infinite ease-in-out; }
        .cloud1        { animation: floatCloud 6s infinite ease-in-out; }
        .cloud2        { animation: floatCloud 8s infinite ease-in-out reverse; }

        /* ===== AUTH PAGE ===== */
        .auth-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f1f5f9;
        }

        /* Header */
        .auth-header {
          background: #fff;
          padding: 12px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          position: sticky;
          top: 0;
          z-index: 30;
          gap: 8px;
        }
        .auth-header-brand {
          display: flex;
          align-items: center;
          gap: 7px;
          text-decoration: none;
          min-width: 0;
          flex: 1;
        }
        .auth-header-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--primary);
          color: #fff;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          flex-shrink: 0;
        }
        .auth-header-title {
          font-size: 1rem;
          font-weight: 800;
          color: var(--primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .auth-header-sub {
          font-size: 0.9rem;
          font-weight: 500;
          color: #334155;
          margin-left: 4px;
          white-space: nowrap;
          /* Hidden on very small screens */
          display: none;
        }
        .auth-header-help {
          font-size: 0.78rem;
          color: var(--primary);
          text-decoration: none;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Body */
        .auth-body {
          flex: 1;
          background: var(--primary);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 16px 12px 32px;
          position: relative;
          overflow: hidden;
        }
        .auth-body::before {
          content: '';
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 70%, rgba(255,255,255,0.06) 0%, transparent 60%);
        }

        /* Bubbles decoration - desktop only */
        .auth-bubble {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          animation: floatBubble 6s ease-in-out infinite;
        }

        /* Inner layout */
        .auth-inner {
          width: 100%;
          max-width: 1100px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 40px;
          position: relative;
          z-index: 2;
        }

        /* Left side - only desktop */
        .auth-left {
          display: none;
          flex-direction: column;
          align-items: center;
          color: #fff;
          flex: 1;
        }
        .auth-left h2 {
          font-size: 1.8rem;
          font-weight: 800;
          margin-top: 10px;
          letter-spacing: -0.5px;
        }
        .auth-left p {
          font-size: 1rem;
          color: rgba(255,255,255,0.9);
          margin-top: 8px;
        }

        /* Card */
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.18);
          overflow: hidden;
          animation: fadeInUp 0.4s ease-out forwards;
        }

        /* Form */
        .auth-form {
          padding: 20px 18px 24px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .auth-back-link {
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          color: var(--muted);
          font-weight: 700;
          font-size: 0.82rem;
          margin-bottom: 18px;
          width: fit-content;
          padding: 6px 10px;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .auth-back-link:hover { background: #f1f5f9; }

        .auth-form-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--dark);
          text-align: center;
          margin: 0 0 20px;
        }

        /* Google button */
        .auth-google-btn {
          width: 100%;
          padding: 11px 16px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          color: #374151;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          font-size: 0.875rem;
          font-family: var(--font);
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s, border-color 0.2s;
          margin-bottom: 18px;
        }
        .auth-google-btn:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        /* Divider */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }
        .auth-divider-line {
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        .auth-divider-text {
          font-size: 0.7rem;
          color: var(--muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        /* Input group */
        .auth-fields {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .auth-label {
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--dark);
        }
        .auth-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .auth-input {
          width: 100%;
          margin: 0;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          padding: 12px 14px;
          font-size: 0.95rem;
          font-family: var(--font);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          color: var(--dark);
          -webkit-appearance: none;
          appearance: none;
        }
        .auth-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.12);
          background: #fff;
        }
        .auth-input.has-toggle {
          padding-right: 44px;
        }
        .auth-input.err {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
        }
        .auth-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: var(--muted);
          font-size: 0.9rem;
          line-height: 1;
          display: flex;
          align-items: center;
        }
        .auth-hint {
          font-size: 0.68rem;
          color: #94a3b8;
          margin-top: 2px;
        }
        .auth-err-msg {
          font-size: 0.73rem;
          color: #ef4444;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 2px;
        }

        /* Submit button */
        .auth-submit-btn {
          width: 100%;
          margin-top: 22px;
          padding: 13px;
          border-radius: 12px;
          font-size: 0.95rem;
          border: none;
          cursor: pointer;
          font-family: var(--font);
          background: var(--primary);
          color: #fff;
          font-weight: 800;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 14px rgba(16,185,129,0.35);
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
        }
        .auth-submit-btn:hover {
          background: var(--primaryHover);
          box-shadow: 0 6px 20px rgba(16,185,129,0.4);
        }
        .auth-submit-btn:active {
          transform: scale(0.98);
        }

        /* Forgot password */
        .auth-forgot {
          width: 100%;
          text-align: right;
          margin-top: 8px;
        }
        .auth-forgot a {
          font-size: 0.83rem;
          font-weight: 700;
          color: var(--primary);
          text-decoration: none;
          cursor: pointer;
        }

        /* Switch link */
        .auth-switch {
          margin-top: 18px;
          font-size: 0.85rem;
          text-align: center;
          color: var(--muted);
        }
        .auth-switch a {
          color: var(--primary);
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
        }

        /* ===== RESPONSIVE ===== */

        /* Small phones: iPhone SE, 375px+ */
        @media (min-width: 375px) {
          .auth-header-sub   { display: inline; }
          .auth-header-logo  { width: 32px; height: 32px; }
          .auth-header-title { font-size: 1.05rem; }
        }

        /* Medium phones: 480px+ */
        @media (min-width: 480px) {
          .auth-header       { padding: 14px 20px; }
          .auth-header-logo  { width: 34px; height: 34px; font-size: 18px; }
          .auth-header-title { font-size: 1.15rem; }
          .auth-header-sub   { font-size: 1rem; margin-left: 6px; }
          .auth-body         { padding: 24px 20px 40px; align-items: center; }
          .auth-form         { padding: 24px 24px 28px; }
        }

        /* Desktop: 800px+ */
        @media (min-width: 800px) {
          .auth-header-title { font-size: 1.4rem; }
          .auth-header-sub   { font-size: 1.25rem; }
          .auth-body         { padding: 40px 24px 60px; }
          .auth-inner        { justify-content: space-between; }
          .auth-left         { display: flex; }
          .auth-card         { max-width: 420px; flex-shrink: 0; }
          .auth-form         { padding: 30px 32px 36px; }
        }
      `}</style>

      <div className="auth-page">
        {/* Header */}
        <header className="auth-header">
          <Link href="/" className="auth-header-brand">
            <div className="auth-header-logo">S</div>
            <span className="auth-header-title">SembakoBerkah</span>
            <span className="auth-header-sub">{isRegister ? 'Daftar' : 'Masuk'}</span>
          </Link>
          <a href="/bantuan" className="auth-header-help">Butuh bantuan?</a>
        </header>

        {/* Body */}
        <div className="auth-body">
          {/* Decorative bubbles */}
          <div className="auth-bubble" style={{ width: 180, height: 180, top: '-60px', left: '-60px', animationDelay: '0s' }} />
          <div className="auth-bubble" style={{ width: 120, height: 120, bottom: '40px', right: '-40px', animationDelay: '2s' }} />
          <div className="auth-bubble" style={{ width: 80, height: 80, top: '40%', left: '10%', animationDelay: '1s' }} />

          <div className="auth-inner">
            {/* Left — only visible on desktop */}
            <div className="auth-left">
              <div style={{ position: 'relative', width: '400px', height: '300px' }}>
                <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                  <path className="cloud1" d="M50 80 Q60 60 80 80 Q100 70 110 90 Q120 100 100 100 L50 100 Q30 100 40 80 Z" fill="rgba(255,255,255,0.2)" />
                  <path className="cloud2" d="M250 120 Q260 100 280 120 Q300 110 310 130 Q320 140 300 140 L250 140 Q230 140 240 120 Z" fill="rgba(255,255,255,0.15)" />
                  <g transform="translate(40, 130)">
                    <path d="M40 150 Q40 80 80 80 Q120 80 120 150 Z" fill="#ffffff" opacity="0.95" />
                    <circle cx="80" cy="50" r="30" fill="#ffffff" />
                    <rect x="85" y="70" width="30" height="50" rx="5" fill="#1e293b" />
                    <rect x="88" y="73" width="24" height="44" rx="2" fill="#f8fafc" />
                    <line x1="92" y1="85" x2="108" y2="85" stroke="#cbd5e1" strokeWidth="2" />
                    <line x1="92" y1="95" x2="100" y2="95" stroke="#cbd5e1" strokeWidth="2" />
                    <rect x="92" y="105" width="16" height="6" rx="2" fill="#03ac0e" />
                    <path d="M50 100 Q80 120 90 100" fill="none" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" />
                    <g className="finger">
                      <path d="M120 130 Q105 110 100 95" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" />
                    </g>
                  </g>
                  <g className="package-anim" transform="translate(130, 180)">
                    <path d="M-20 -20 L20 -20 L20 20 L-20 20 Z" fill="#fef08a" />
                    <path d="M-20 -20 L0 -30 L20 -20" fill="#fde047" />
                    <line x1="0" y1="-30" x2="0" y2="20" stroke="#ca8a04" strokeWidth="2" />
                    <line x1="-20" y1="-20" x2="20" y2="-20" stroke="#ca8a04" strokeWidth="2" />
                  </g>
                  <g className="truck-anim" transform="translate(0, 160)">
                    <line x1="-400" y1="70" x2="800" y2="70" stroke="rgba(255,255,255,0.3)" strokeWidth="4" strokeDasharray="20 10" />
                    <rect x="200" y="0" width="90" height="60" rx="4" fill="#ffffff" />
                    <rect x="210" y="10" width="70" height="40" fill="#f8fafc" />
                    <circle cx="245" cy="30" r="14" fill="var(--primary)" />
                    <text x="245" y="34" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">S</text>
                    <path d="M290 20 L320 20 Q330 20 335 35 L340 60 L290 60 Z" fill="#ffffff" />
                    <path d="M295 25 L315 25 L320 35 L295 35 Z" fill="#e2e8f0" />
                    <circle cx="220" cy="65" r="12" fill="#1e293b" />
                    <circle cx="220" cy="65" r="6" fill="#cbd5e1" />
                    <circle cx="320" cy="65" r="12" fill="#1e293b" />
                    <circle cx="320" cy="65" r="6" fill="#cbd5e1" />
                  </g>
                </svg>
              </div>
              <h2>Lebih Hemat Lebih Cepat</h2>
              <p>Pesan sembako sekarang, langsung diantar!</p>
            </div>

            {/* Right — Card */}
            <div className="auth-card">
              {isRegister ? (
                <form onSubmit={handleRegister} className="auth-form" key="register">
                  <Link href="/" className="auth-back-link">
                    <i className="fas fa-arrow-left"></i> Kembali ke Etalase
                  </Link>
                  <h1 className="auth-form-title">Buat Akun</h1>

                  <button type="button" onClick={handleGoogleLogin} className="auth-google-btn">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="18" alt="Google" />
                    Lanjutkan dengan Google
                  </button>

                  <div className="auth-divider">
                    <div className="auth-divider-line"></div>
                    <span className="auth-divider-text">Atau daftar email</span>
                    <div className="auth-divider-line"></div>
                  </div>

                  <div className="auth-fields">
                    {/* Nama */}
                    <div className="auth-field">
                      <label className="auth-label">Nama Lengkap</label>
                      <div className="auth-input-wrap">
                        <input
                          type="text"
                          placeholder="Masukkan nama Anda"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className={`auth-input${!regName && regEmailErr ? ' err' : ''}`}
                        />
                      </div>
                      {!regName && regEmailErr !== "" && (
                        <span className="auth-err-msg">
                          <i className="fas fa-exclamation-circle"></i> Nama wajib diisi
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="auth-field">
                      <label className="auth-label">Alamat Email</label>
                      <div className="auth-input-wrap">
                        <input
                          type="email"
                          placeholder="Contoh: budi@gmail.com"
                          value={regEmail}
                          onChange={(e) => {
                            setRegEmail(e.target.value)
                            setRegEmailErr(validateEmail(e.target.value))
                          }}
                          className={`auth-input${regEmailErr ? ' err' : ''}`}
                        />
                      </div>
                      <span className="auth-hint">Wajib menggunakan format @gmail.com</span>
                      {regEmailErr && (
                        <span className="auth-err-msg">
                          <i className="fas fa-exclamation-circle"></i> {regEmailErr}
                        </span>
                      )}
                    </div>

                    {/* Password */}
                    <div className="auth-field">
                      <label className="auth-label">Password</label>
                      <div className="auth-input-wrap">
                        <input
                          type={showRegPass ? "text" : "password"}
                          placeholder="Buat password yang kuat"
                          value={regPassword}
                          onChange={(e) => {
                            setRegPassword(e.target.value)
                            setRegPasswordErr(validatePassword(e.target.value))
                          }}
                          className={`auth-input has-toggle${regPasswordErr ? ' err' : ''}`}
                        />
                        <button type="button" className="auth-toggle-btn" onClick={() => setShowRegPass(v => !v)} tabIndex={-1}>
                          <i className={`fas fa-eye${showRegPass ? '-slash' : ''}`}></i>
                        </button>
                      </div>
                      <span className="auth-hint">Min 8 karakter, 1 kapital, 1 angka, 1 simbol</span>
                      {regPasswordErr && (
                        <span className="auth-err-msg">
                          <i className="fas fa-exclamation-circle"></i> {regPasswordErr}
                        </span>
                      )}
                    </div>
                  </div>

                  <button type="submit" className="auth-submit-btn">DAFTAR</button>

                  <div className="auth-switch">
                    <span>Sudah punya akun? </span>
                    <a onClick={() => setIsRegister(false)}>Masuk di sini</a>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="auth-form" key="login">
                  <Link href="/" className="auth-back-link">
                    <i className="fas fa-arrow-left"></i> Kembali ke Etalase
                  </Link>
                  <h1 className="auth-form-title">Masuk</h1>

                  <button type="button" onClick={handleGoogleLogin} className="auth-google-btn">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="18" alt="Google" />
                    Lanjutkan dengan Google
                  </button>

                  <div className="auth-divider">
                    <div className="auth-divider-line"></div>
                    <span className="auth-divider-text">Atau masuk dengan email</span>
                    <div className="auth-divider-line"></div>
                  </div>

                  <div className="auth-fields">
                    {/* Email */}
                    <div className="auth-field">
                      <label className="auth-label">Alamat Email</label>
                      <div className="auth-input-wrap">
                        <input
                          type="email"
                          placeholder="Contoh: budi@gmail.com"
                          value={loginEmail}
                          onChange={(e) => {
                            setLoginEmail(e.target.value)
                            setLoginEmailErr(validateEmail(e.target.value))
                          }}
                          className={`auth-input${loginEmailErr ? ' err' : ''}`}
                        />
                      </div>
                      <span className="auth-hint">Wajib menggunakan format @gmail.com</span>
                      {loginEmailErr && (
                        <span className="auth-err-msg">
                          <i className="fas fa-exclamation-circle"></i> {loginEmailErr}
                        </span>
                      )}
                    </div>

                    {/* Password */}
                    <div className="auth-field">
                      <label className="auth-label">Password</label>
                      <div className="auth-input-wrap">
                        <input
                          type={showLoginPass ? "text" : "password"}
                          placeholder="Masukkan password Anda"
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value)
                            setLoginPasswordErr(e.target.value ? "" : "Password wajib diisi")
                          }}
                          className={`auth-input has-toggle${loginPasswordErr ? ' err' : ''}`}
                        />
                        <button type="button" className="auth-toggle-btn" onClick={() => setShowLoginPass(v => !v)} tabIndex={-1}>
                          <i className={`fas fa-eye${showLoginPass ? '-slash' : ''}`}></i>
                        </button>
                      </div>
                      {loginPasswordErr && (
                        <span className="auth-err-msg">
                          <i className="fas fa-exclamation-circle"></i> {loginPasswordErr}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="auth-forgot">
                    <a href="#" onClick={(e) => { e.preventDefault(); showToast('Silakan hubungi admin untuk reset password', 'info'); }}>
                      Lupa password?
                    </a>
                  </div>

                  <button type="submit" className="auth-submit-btn">MASUK</button>

                  <div className="auth-switch">
                    <span>Belum punya akun? </span>
                    <a onClick={() => setIsRegister(true)}>Daftar sekarang</a>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
