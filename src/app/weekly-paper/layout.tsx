import { Metadata } from "next"
import { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Weekly Paper",
  description: "Weekly bulletins from New Seoul Church.",
}

export default function WeeklyPaperLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
