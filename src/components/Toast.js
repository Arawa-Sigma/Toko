"use client"
import { useEffect } from 'react'
import { useUIStore } from "@/lib/store"

export default function Toast() {
  const { toastMessage, toastType, hideToast } = useUIStore()

  useEffect(() => {
    if (!toastMessage) return

    const handleGlobalClick = () => {
      hideToast()
    }

    const timer = setTimeout(() => {
      document.addEventListener('click', handleGlobalClick)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleGlobalClick)
    }
  }, [toastMessage, hideToast])

  if (!toastMessage) return null

  // Tentukan warna berdasarkan tipe
  let bgColor = "#333"
  let icon = "fa-info-circle"
  if (toastType === "success") {
    bgColor = "#10b981" // emerald-500
    icon = "fa-check-circle"
  } else if (toastType === "error") {
    bgColor = "#ef4444" // red-500
    icon = "fa-exclamation-triangle"
  } else if (toastType === "info") {
    bgColor = "#3b82f6" // blue-500
    icon = "fa-info-circle"
  }

  return (
    <div style={{
      position: "fixed",
      top: "85px",
      right: "24px",
      backgroundColor: bgColor,
      color: "white",
      padding: "8px 16px",
      borderRadius: "999px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      zIndex: 9999,
      fontWeight: 600,
      fontSize: "0.8rem",
      animation: "toast-slide-down 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
    }}>
      <div style={{display: 'flex', alignItems: 'center', gap: '8px', flex: 1}}>
        <i className={`fas ${icon}`}></i>
        <span>{toastMessage}</span>
      </div>
      <button 
        onClick={hideToast}
        style={{
          background: "none", 
          border: "none", 
          color: "white", 
          cursor: "pointer", 
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.8
        }}
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  )
}
