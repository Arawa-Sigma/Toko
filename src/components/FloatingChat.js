"use client"
import { useState, useEffect, useRef } from 'react'
import { useStore, useUIStore } from '@/lib/store'
import { createClient } from '@/lib/supabaseClient'

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [message, setMessage] = useState("")
  
  const [unreadCount, setUnreadCount] = useState(0)
  const [chatHistory, setChatHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  
  const messagesEndRef = useRef(null)
  
  const { session } = useStore()
  const showToast = useUIStore((state) => state.showToast)

  // Fetch history & subscribe to Realtime
  useEffect(() => {
    if (!session?.user?.id) {
      setChatHistory([])
      setUnreadCount(0)
      return;
    }

    const supabase = createClient()
    
    const fetchMessages = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })
        
      if (!error && data) {
        const formatted = data.map(msg => ({
          id: msg.id,
          sender: msg.sender,
          text: msg.text,
          time: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          is_read: msg.is_read
        }))
        setChatHistory(formatted)
        
        const count = data.filter(msg => (msg.sender === 'admin' || msg.sender === 'bot') && !msg.is_read).length
        setUnreadCount(count)
      }
      setIsLoading(false)
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel('realtime:chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${session.user.id}`
      }, (payload) => {
        const newMsg = payload.new
        const formatted = {
          id: newMsg.id,
          sender: newMsg.sender,
          text: newMsg.text,
          time: new Date(newMsg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          is_read: newMsg.is_read
        }
        
        setChatHistory(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, formatted]
        })
        
        if (newMsg.sender === 'admin' || newMsg.sender === 'bot') {
          setUnreadCount(prev => prev + 1)
        }
        scrollToBottom()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Handle open chat & mark as read
  useEffect(() => {
    if (isOpen && unreadCount > 0 && session?.user?.id) {
      setUnreadCount(0)
      if (chatHistory.some(m => (m.sender === 'admin' || m.sender === 'bot') && !m.is_read)) {
        const supabase = createClient()
        supabase
          .from('chat_messages')
          .update({ is_read: true })
          .eq('user_id', session.user.id)
          .in('sender', ['admin', 'bot'])
          .eq('is_read', false)
          .then()
      }
    }
  }, [isOpen, unreadCount, session, chatHistory])

  const handleOpenChat = () => {
    if (!session) {
      showToast("Silakan Masuk/Daftar terlebih dahulu untuk memulai obrolan dengan CS.", "warn")
      return
    }
    setIsOpen(true)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!message.trim() || !session?.user?.id) return

    const msgText = message;
    setMessage("")

    const supabase = createClient()
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: session.user.id,
        sender: 'user',
        text: msgText
      })
      .select()
      .single()

    if (error) {
      showToast("Gagal mengirim pesan", "danger")
      return
    }

    const formattedMsg = {
      id: data.id,
      sender: data.sender,
      text: data.text,
      time: new Date(data.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      is_read: data.is_read
    }
    setChatHistory(prev => {
      if (prev.find(m => m.id === data.id)) return prev;
      return [...prev, formattedMsg]
    })
    scrollToBottom()

    // Simulate auto reply from admin ONLY for the first message
    if (chatHistory.length === 0) {
        setTimeout(async () => {
          await supabase.from('chat_messages').insert({
            user_id: session.user.id,
            sender: 'bot',
            text: 'Terima kasih atas pesan Anda! Kami akan segera membalasnya.'
          })
        }, 1500)
    }
  }

  // Floating Bubble View
  if (!isOpen) {
    return (
      <button 
        className="chat-bubble"
        onClick={handleOpenChat}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--primary)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 9990,
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isHovered ? 'translateY(-5px) scale(1.05)' : 'translateY(0) scale(1)',
        }}
        title="Chat dengan CS"
      >
        <i className="fas fa-comment-dots"></i>
        {/* Red dot indicator with number */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            width: '20px',
            height: '20px',
            background: '#ef4444',
            borderRadius: '50%',
            border: '2px solid var(--primary)',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>{unreadCount}</span>
        )}
      </button>
    )
  }

  // Expanded CS Chat Window View
  return (
    <>
      <div className="chat-window">
        {/* Header */}
        <div style={{
          background: 'var(--primary)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'white'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{position: 'relative'}}>
              <div style={{width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <i className="fas fa-headset" style={{fontSize: '1.2rem'}}></i>
              </div>
              <div style={{position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', background: '#22c55e', borderRadius: '50%', border: '2px solid var(--primary)'}}></div>
            </div>
            <div>
              <div style={{fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2}}>CS Sembako Berkah</div>
              <div style={{fontSize: '0.8rem', opacity: 0.9}}>Sedang Online (2)</div>
            </div>
          </div>
          <div style={{display: 'flex', gap: '16px', fontSize: '1.2rem', opacity: 0.8}}>
            <i 
              className="fas fa-times" 
              style={{cursor: 'pointer', transition: 'opacity 0.2s'}} 
              onClick={() => setIsOpen(false)} 
              onMouseOver={(e) => e.target.style.opacity = 1}
              onMouseOut={(e) => e.target.style.opacity = 0.8}
              title="Tutup Obrolan"
            ></i>
          </div>
        </div>

        {/* Chat History Area */}
        <div style={{flex: 1, background: '#f8fafc', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <div style={{textAlign: 'center', margin: '10px 0 20px', fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600}}>
            Hari Ini
          </div>
          
          {isLoading ? (
            <div style={{textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem'}}>Memuat pesan...</div>
          ) : chatHistory.length === 0 ? (
            <div style={{textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem', marginTop: '20px'}}>
              Belum ada pesan. Mulai obrolan Anda sekarang!
            </div>
          ) : (
            chatHistory.map((chat) => (
              <div key={chat.id} style={{
                display: 'flex', 
                alignItems: 'flex-start',
                justifyContent: chat.sender === 'user' ? 'flex-end' : 'flex-start'
              }}>
                {chat.sender !== 'user' && (
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, marginRight: '10px',
                    background: chat.sender === 'bot' ? '#10b981' : 'var(--primary)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: '4px'
                  }}>
                    <i className={chat.sender === 'bot' ? "fas fa-robot" : "fas fa-headset"} style={{ fontSize: '0.8rem' }}></i>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: chat.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '100%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    borderBottomRightRadius: chat.sender === 'user' ? '4px' : '16px',
                    borderBottomLeftRadius: chat.sender !== 'user' ? '4px' : '16px',
                    background: chat.sender === 'user' ? 'var(--primary)' : 'white',
                    color: chat.sender === 'user' ? 'white' : 'var(--dark)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    wordBreak: 'break-word'
                  }}>
                    {chat.text}
                  </div>
                  <div style={{fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px', padding: '0 4px'}}>
                    {chat.sender === 'bot' ? 'Sistem Otomatis' : (chat.sender === 'admin' ? 'Admin' : '')} {chat.sender !== 'user' ? '• ' : ''}{chat.time} {chat.sender === 'user' && <i className="fas fa-check-double" style={{marginLeft: '4px', color: 'var(--primary)', opacity: 0.8}}></i>}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: '16px', 
          background: 'white', 
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <button style={{background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.2rem', cursor: 'pointer', padding: '4px'}}>
            <i className="fas fa-paperclip"></i>
          </button>
          <form onSubmit={handleSend} style={{flex: 1, display: 'flex', gap: '10px'}}>
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ketik pesan..." 
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '999px',
                border: '1px solid var(--border)',
                background: '#f1f5f9',
                outline: 'none',
                fontSize: '0.95rem'
              }}
            />
            <button 
              type="submit"
              disabled={!message.trim()}
              style={{
                background: message.trim() ? 'var(--primary)' : '#cbd5e1',
                color: 'white',
                border: 'none',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: message.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
                fontSize: '1.1rem'
              }}
            >
              <i className="fas fa-paper-plane" style={{transform: 'translateX(-1px) translateY(1px)'}}></i>
            </button>
          </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dropdown-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .chat-window {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 380px;
          height: 600px;
          max-height: calc(100vh - 48px);
          background: var(--card);
          border-radius: 20px;
          box-shadow: 0 15px 50px -10px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          z-index: 9990;
          overflow: hidden;
          border: 1px solid var(--border);
          animation: dropdown-slide-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        /* Responsif untuk Mobile (Android/iOS) */
        @media (max-width: 640px) {
          .chat-window {
            bottom: 0;
            right: 0;
            width: 100%;
            height: 100%;
            max-height: 100vh;
            border-radius: 0;
            border: none;
            box-shadow: none;
            z-index: 99999; /* Pastikan di atas navbar mobile */
          }
          .chat-bubble {
            bottom: 16px !important;
            right: 16px !important;
          }
        }
      `}} />
    </>
  )
}
