"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"

export default function loginPage() {
  const [id, setId] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    document.cookie = `adminToken=mock-admin-token; path=/; max-age=3600`
  }, [])

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
        credentials: "include",
      })

      if (res.ok) {
        window.location.href = "/admin"
      }
    } catch (err) {
      console.error("❌ 로그인 에러:", err)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-sm p-6 shadow-xl rounded-2xl">
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-center">Admin Login</h2>

          <div className="grid w-full gap-2">
            <Label htmlFor="id">ID</Label>
            <Input id="id" value={id} onChange={(e) => setId(e.target.value)} />
          </div>

          <div className="grid w-full gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button className="mt-4 w-full" onClick={handleLogin}>
            Login
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
