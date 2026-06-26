"use client"
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useUIStore } from '@/lib/store'

export default function ChatPage() {
  const [conversations, setConversations] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [profilesMap, setProfilesMap] = useState({})
  const [isMobile, setIsMobile] = useState(false)
  
  const messagesEndRef = useRef(null)
  const supabase = createClient()
  const showToast = useUIStore((state) => state.showToast)

  useEffect(() => {
    // Handle responsive layout
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    handleResize()
    window.addEventListener('resize', handleResize)

    // Request notification permission if not granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    fetchData()

    // Realtime subscription
    const channel = supabase
      .channel('admin_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
        const newMsg = payload.new
        
        // Notification for incoming user messages
        if (newMsg.sender === 'user') {
          showToast("Pesan baru masuk dari pelanggan!", "info")
          
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification("Pesan Baru", {
              body: newMsg.text,
              icon: '/favicon.ico' // fallback icon
            })
          }
        }

        // Update messages if the active chat matches
        setMessages(prev => {
          // Check if we are currently looking at this user's chat
          if (selectedUserId === newMsg.user_id) {
            // Check for duplicates
            if (prev.find(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          }
          return prev
        })

        // Update the conversations sidebar to push this user to the top
        setConversations(prev => {
          const exists = prev.find(c => c.user_id === newMsg.user_id)
          const updatedChat = exists ? { ...exists, lastMessage: newMsg.text, updated_at: newMsg.created_at, is_read: newMsg.sender === 'admin' } : { user_id: newMsg.user_id, lastMessage: newMsg.text, updated_at: newMsg.created_at, is_read: newMsg.sender === 'admin' }
          return [updatedChat, ...prev.filter(c => c.user_id !== newMsg.user_id)]
        })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, payload => {
        const oldMsg = payload.old
        setMessages(prev => prev.filter(m => m.id !== oldMsg.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('resize', handleResize)
    }
  }, [selectedUserId])

  async function fetchData() {
    // 1. Fetch all profiles to map user_id to names
    let { data: profilesData, error } = await supabase.from('profiles').select('id, name, avatar_url')
    
    // Fallback if avatar_url column hasn't been created yet
    if (error && error.code === '42703') {
      console.warn("Kolom avatar_url belum dibuat di Supabase! Menggunakan fallback...")
      const res = await supabase.from('profiles').select('id, name')
      profilesData = res.data
      error = res.error
    }

    if (error) console.error("Profiles fetch error:", error)
    
    const pMap = {}
    if (profilesData) {
      profilesData.forEach(p => {
        pMap[p.id] = { ...p, full_name: p.name } // mapping name to full_name for compatibility
      })
    }
    setProfilesMap(pMap)

    // 2. Fetch all chat messages, order by latest
    const { data: chatData } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: false })
    
    if (chatData) {
      // Group by user_id
      const grouped = {}
      chatData.forEach(msg => {
        if (!grouped[msg.user_id]) {
          grouped[msg.user_id] = {
            user_id: msg.user_id,
            lastMessage: msg.text,
            updated_at: msg.created_at,
            is_read: msg.is_read || msg.sender === 'admin' // If admin sent last, it's considered read
          }
        }
      })
      
      const convList = Object.values(grouped).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      setConversations(convList)
    }
  }

  useEffect(() => {
    if (selectedUserId) {
      fetchMessagesForUser(selectedUserId)
    }
  }, [selectedUserId])

  async function fetchMessagesForUser(userId) {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      
    if (data) {
      setMessages(data)
      scrollToBottom()

      // Mark unread user messages as read
      const unreadIds = data.filter(m => m.sender === 'user' && !m.is_read).map(m => m.id)
      if (unreadIds.length > 0) {
        await supabase.from('chat_messages').update({ is_read: true }).in('id', unreadIds)
        // Update local state
        setConversations(prev => prev.map(c => c.user_id === userId ? { ...c, is_read: true } : c))
      }
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || !selectedUserId) return

    const msgText = inputText
    setInputText("")

    const { error } = await supabase.from('chat_messages').insert([{
      user_id: selectedUserId,
      sender: 'admin',
      text: msgText,
      is_read: false
    }])
    
    if (error) {
      console.error("Failed to send message", error)
    }
  }

  const handleDeleteMessage = async (msgId) => {
    if (!confirm("Hapus pesan ini?")) return
    
    // Optimistic UI update
    setMessages(prev => prev.filter(m => m.id !== msgId))
    
    const { error } = await supabase.from('chat_messages').delete().eq('id', msgId)
    if (error) {
      console.error("Failed to delete message", error)
      showToast("Gagal menghapus pesan", "error")
    }
  }

  const handleClearHistory = async () => {
    if (!selectedUserId) return
    if (!confirm("Hapus seluruh riwayat chat dengan pelanggan ini? Tindakan ini tidak dapat dibatalkan!")) return

    // Optimistic UI update
    setMessages([])

    const { error } = await supabase.from('chat_messages').delete().eq('user_id', selectedUserId)
    if (error) {
      console.error("Failed to clear history", error)
      showToast("Gagal menghapus riwayat", "error")
    } else {
      showToast("Riwayat chat berhasil dihapus", "success")
    }
  }

  const filteredConversations = conversations.filter(c => {
    const profile = profilesMap[c.user_id]
    const name = profile?.full_name || profile?.username || "Pengguna Anonim"
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 51px)', margin: '-20px' }}>
      <div style={{ flex: 1, background: '#fff', display: 'flex', overflow: 'hidden' }}>
        
        {/* Sidebar Kontak */}
        <div style={{ 
            width: isMobile ? '100%' : '320px', 
            borderRight: isMobile ? 'none' : '1px solid #e2e8f0', 
            display: (isMobile && selectedUserId) ? 'none' : 'flex', 
            flexDirection: 'column', 
            background: '#f8fafc' 
        }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                <div style={{ position: 'relative' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}></i>
                    <input 
                      type="text" 
                      placeholder="Cari pelanggan..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                    />
                </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredConversations.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                        <i className="fas fa-inbox" style={{ fontSize: '2rem', marginBottom: '12px', color: '#cbd5e1' }}></i>
                        <div>Belum ada obrolan.</div>
                    </div>
                ) : (
                    filteredConversations.map(conv => {
                        const profile = profilesMap[conv.user_id]
                        const name = profile?.full_name || profile?.username || "Pengguna Anonim"
                        const isActive = selectedUserId === conv.user_id
                        
                        return (
                            <div 
                                key={conv.user_id}
                                onClick={() => setSelectedUserId(conv.user_id)}
                                style={{ 
                                    padding: '16px', 
                                    borderBottom: '1px solid #e2e8f0', 
                                    cursor: 'pointer',
                                    background: isActive ? '#eff6ff' : '#fff',
                                    display: 'flex',
                                    gap: '12px',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                        <div style={{ fontWeight: isActive ? 700 : 600, color: 'var(--dark)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                            {new Date(conv.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '0.85rem', color: !conv.is_read ? 'var(--dark)' : '#64748b', fontWeight: !conv.is_read ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {conv.lastMessage}
                                        </div>
                                        {!conv.is_read && (
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ee4d2d', flexShrink: 0, marginLeft: '8px' }}></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>

        {/* Area Percakapan */}
        <div style={{ 
            flex: 1, 
            display: (isMobile && !selectedUserId) ? 'none' : 'flex', 
            flexDirection: 'column', 
            background: '#f8fafc',
            width: isMobile ? '100%' : 'auto'
        }}>
            {!selectedUserId ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    <div style={{ width: '80px', height: '80px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <i className="far fa-comments" style={{ fontSize: '2rem', color: '#cbd5e1' }}></i>
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px' }}>Pilih Obrolan</h3>
                    <p style={{ fontSize: '0.9rem', maxWidth: '300px', textAlign: 'center' }}>Klik salah satu kontak di menu kiri untuk membaca dan membalas pesan.</p>
                </div>
            ) : (
                <>
                    {/* Header Chat */}
                    <div style={{ padding: isMobile ? '12px 16px' : '16px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
                        {isMobile && (
                            <button onClick={() => setSelectedUserId(null)} style={{ background: 'none', border: 'none', color: 'var(--dark)', fontSize: '1.2rem', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Kembali ke daftar">
                                <i className="fas fa-arrow-left"></i>
                            </button>
                        )}
                        {profilesMap[selectedUserId] ? (
                            <>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                    {profilesMap[selectedUserId].avatar_url ? (
                                        <img src={profilesMap[selectedUserId].avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (profilesMap[selectedUserId].full_name || profilesMap[selectedUserId].username || "A").charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: isMobile ? '1rem' : '1.1rem', color: 'var(--dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {profilesMap[selectedUserId].full_name || profilesMap[selectedUserId].username || "Pengguna Anonim"}
                                    </div>
                                    {!isMobile && (
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                            Pelanggan SembakoBerkah
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={handleClearHistory}
                                    style={{ marginLeft: 'auto', flexShrink: 0, background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', padding: isMobile ? '8px 12px' : '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: isMobile ? '0' : '8px', transition: 'all 0.2s' }}
                                    title="Hapus seluruh riwayat chat"
                                >
                                    <i className="fas fa-trash-alt"></i> {!isMobile && 'Bersihkan Chat'}
                                </button>
                            </>
                        ) : (
                            <div style={{ fontWeight: 700, color: 'var(--dark)' }}>Memuat Profil...</div>
                        )}
                    </div>

                    {/* Chat Messages */}
                    <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {messages.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px' }}>Belum ada pesan.</div>
                        ) : (
                            messages.map(msg => {
                                const isAdmin = msg.sender === 'admin'
                                return (
                                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {isAdmin && (
                                                <button onClick={() => handleDeleteMessage(msg.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', opacity: 0.7, padding: '4px', alignSelf: 'center' }} title="Hapus pesan">
                                                    <i className="fas fa-trash-alt" style={{ fontSize: '0.75rem' }}></i>
                                                </button>
                                            )}
                                            <div style={{ 
                                                maxWidth: isMobile ? '85%' : '70%', 
                                                padding: '10px 14px', 
                                                background: isAdmin ? 'var(--primary)' : '#fff', 
                                                color: isAdmin ? '#fff' : 'var(--dark)', 
                                                borderRadius: '16px', 
                                                borderBottomRightRadius: isAdmin ? '4px' : '16px',
                                                borderBottomLeftRadius: isAdmin ? '16px' : '4px',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                border: isAdmin ? 'none' : '1px solid #e2e8f0',
                                                fontSize: '0.9rem',
                                                lineHeight: 1.4,
                                                wordBreak: 'break-word'
                                            }}>
                                                {msg.text}
                                            </div>
                                            {!isAdmin && (
                                                <button onClick={() => handleDeleteMessage(msg.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', opacity: 0.7, padding: '4px', alignSelf: 'center' }} title="Hapus pesan">
                                                    <i className="fas fa-trash-alt" style={{ fontSize: '0.75rem' }}></i>
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', padding: '0 4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {isAdmin && <i className="fas fa-check-double" style={{ color: msg.is_read ? 'var(--primary)' : '#94a3b8', opacity: 0.8 }}></i>}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div style={{ padding: isMobile ? '12px' : '20px', paddingLeft: isMobile ? '56px' : '20px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
                        <form onSubmit={handleSend} style={{ display: 'flex', gap: isMobile ? '8px' : '12px' }}>
                            <input 
                                type="text" 
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                placeholder="Ketik balasan Anda..." 
                                style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', background: '#f8fafc' }}
                            />
                            <button 
                                type="submit"
                                disabled={!inputText.trim()}
                                style={{ 
                                    background: inputText.trim() ? 'var(--primary)' : '#cbd5e1', 
                                    color: '#fff', 
                                    border: 'none', 
                                    padding: '0 24px', 
                                    borderRadius: '8px', 
                                    fontWeight: 600, 
                                    cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                                    transition: 'background 0.2s'
                                }}
                            >
                                Kirim
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
        
      </div>
    </div>
  )
}
