import "./globals.css"
import { ReactNode } from "react"
import { Analytics } from "@vercel/analytics/next"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white text-gray-900">
        <Header />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
