"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"

interface CheckoutButtonProps {
  slug: string
  label: string
  variant?: "default" | "outline"
  className?: string
}

export function CheckoutButton({ slug, label, variant = "default", className }: CheckoutButtonProps) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (isPending) return

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

      const data = await res.json() as { url?: string; message?: string; error?: string }

      if (!res.ok) {
        toast.error(data.message ?? data.error ?? "Checkout failed. Please try again.")
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error("No checkout URL returned. Please try again.")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} variant={variant} className={className} disabled={loading || isPending}>
      {loading ? "Loading…" : label}
    </Button>
  )
}
