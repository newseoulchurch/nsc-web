import { Bebas_Neue, Black_Han_Sans, Caveat, Gaegu, Playfair_Display } from "next/font/google"

const hand = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-hand",
  display: "swap",
})

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
  display: "swap",
})

const gaegu = Gaegu({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-gaegu",
  display: "swap",
  preload: false,
})

const blackHan = Black_Han_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-blackhan",
  display: "swap",
  preload: false,
})

export const noteFontVariables: string = [hand, bebas, playfair, gaegu, blackHan]
  .map((font) => font.variable)
  .join(" ")
