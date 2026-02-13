"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { ensureOrganization } from "@/lib/org";

export default function SetupOrganizationPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [error, setError] = useState("");

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.push("/login");
      return;
    }

    let cancelled = false;

    async function setup() {
      try {
        const org = await ensureOrganization({
          name: session!.user.name,
          email: session!.user.email,
        });

        if (!cancelled && org) {
          router.push("/overview");
        }
      } catch {
        if (!cancelled) {
          setError("Failed to create organization. Please try again.");
        }
      }
    }

    setup();

    return () => {
      cancelled = true;
    };
  }, [session, isPending, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border p-8 text-center space-y-4 max-w-md">
          <h1 className="text-xl font-bold">Setup Failed</h1>
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">Setting up your organization...</p>
      </div>
    </div>
  );
}
