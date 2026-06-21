"use client"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { usePathname } from "next/navigation"

export default function LayoutWrapper({ children }) {
    const pathname = usePathname()
    const isDashboard = pathname?.startsWith('/dashboard')

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
