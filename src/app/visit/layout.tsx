import { Metadata } from "next"
import { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Visit Us",
  description:
    "Service times, location, and directions for New Seoul Church in Seocho-gu, Seoul.",
}

export default function VisitLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
