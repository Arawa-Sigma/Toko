export default function Loading() {
  return (
    <div style={{ 
      position: 'fixed', inset: 0, zIndex: 9999, background: '#ffffff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      minHeight: '100vh', width: '100%'
    }}>
      <div className="loader-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Animated Box / Cart */}
        <div style={{ position: 'relative', width: '72px', height: '72px', marginBottom: '32px' }}>
          <div className="cart-bounce" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e6f7eb', borderRadius: '20px', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)' }}>
             <i className="fas fa-shopping-basket" style={{ fontSize: '32px', color: '#10b981' }}></i>
          </div>
          <div className="shadow-pulse" style={{ position: 'absolute', bottom: '-16px', left: '15%', right: '15%', height: '8px', background: 'rgba(0,0,0,0.15)', borderRadius: '50%', filter: 'blur(3px)' }}></div>
        </div>

        {/* Text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
          <span style={{ color: '#1f2937' }}>Sembako</span><span style={{ color: '#10b981' }}>Berkah</span>
        </div>
        <div className="loading-dots" style={{ marginTop: '8px', fontSize: '0.95rem', color: '#64748b', fontWeight: 600 }}>
          Menyiapkan rak toko
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-cart {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.05); }
        }
        @keyframes pulse-shadow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(0.7); opacity: 0.2; }
        }
        @keyframes dot-ellipsis {
          0% { content: "."; }
          33% { content: ".."; }
          66% { content: "..."; }
          100% { content: "."; }
        }
        .cart-bounce {
          animation: bounce-cart 1.5s ease-in-out infinite;
        }
        .shadow-pulse {
          animation: pulse-shadow 1.5s ease-in-out infinite;
        }
        .loading-dots::after {
          content: ".";
          display: inline-block;
          width: 20px;
          text-align: left;
          animation: dot-ellipsis 1.5s infinite steps(1, end);
        }
      `}} />
    </div>
  )
}
