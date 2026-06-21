"use client"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { createClient } from "@/lib/supabaseClient"

export default function LayoutWrapper({ children }) {
    const pathname = usePathname()
    const isDashboard = pathname?.startsWith('/dashboard')

    useEffect(() => {
        if (typeof window !== 'undefined' && !sessionStorage.getItem('site_visited')) {
            sessionStorage.setItem('site_visited', 'true')
            const supabase = createClient()
            supabase.from('site_visits').insert([{ path: pathname }]).then(() => {})
        }
    }, [])

    if (isDashboard) {
        return <main style={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column' }}>{children}</main>
    }

    return (
        <>
            <Navbar />
            <main style={{ flex: '1 0 auto' }}>
                {children}
            </main>
            <Footer />
        </>
    )
}
