"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"

interface CheckoutButtonProps {
  slug: string
  label: string
  variant?: "default" | "outline"
  className?: string
}

export function CheckoutButton({ slug, label, variant = "default", className }: CheckoutButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!session) {
      router.push(`/login?redirect=/pricing`)
      return
    }

    setLoading(true)
    try {
      const orgId = session.session?.activeOrganizationId
      const res = await fetch("/api/auth/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, referenceId: orgId ?? undefined }),
      })

      const data = await res.json() as { url?: string; message?: string }
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} variant={variant} className={className} disabled={loading}>
      {loading ? "Loading…" : label}
    </Button>
  )
}
