import { Metadata } from "next"
import { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Sermons",
  description: "Watch and search sermons from New Seoul Church.",
}

export default function SermonLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
