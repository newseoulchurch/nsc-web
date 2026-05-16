import "./globals.css"
import { ReactNode } from "react"
import { Analytics } from "@vercel/analytics/next"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "New Seoul Church",
    template: "%s | New Seoul Church",
  },
  description:
    "New Seoul Church is a gospel-centered church in Seoul, Korea. Join us Sundays at 11:00am.",
  metadataBase: new URL("https://newseoulchurch.org"),
  openGraph: {
    title: "New Seoul Church",
    description:
      "New Seoul Church is a gospel-centered church in Seoul, Korea. Join us Sundays at 11:00am.",
    url: "https://newseoulchurch.org",
    siteName: "New Seoul Church",
    type: "website",
  },
}

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
