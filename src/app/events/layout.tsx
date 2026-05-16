import { Metadata } from "next"
import { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming events at New Seoul Church.",
}

export default function EventsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
