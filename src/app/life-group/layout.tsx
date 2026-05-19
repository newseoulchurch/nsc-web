import { Metadata } from "next"
import { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Life Groups",
  description: "Connect with others through Life Groups at New Seoul Church.",
}

export default function LifeGroupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
