import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://newseoulchurch.org"
  const routes = [
    { path: "", priority: 1.0 },
    { path: "/about", priority: 0.8 },
    { path: "/beliefs", priority: 0.8 },
    { path: "/sermon", priority: 0.8 },
    { path: "/events", priority: 0.7 },
    { path: "/visit", priority: 0.7 },
    { path: "/life-group", priority: 0.7 },
    { path: "/weekly-paper", priority: 0.6 },
  ]

  return routes.map(({ path, priority }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority,
  }))
}
