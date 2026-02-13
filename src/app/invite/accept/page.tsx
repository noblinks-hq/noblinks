"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { organization, useSession } from "@/lib/auth-client";

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const invitationId = searchParams.get("id");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push(`/login?redirect=${encodeURIComponent(`/invite/accept?id=${invitationId}`)}`);
    }
  }, [session, sessionPending, router, invitationId]);

  async function handleAccept() {
    if (!invitationId) return;
    setStatus("loading");

    try {
      const { error } = await organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        setStatus("error");
        setErrorMessage(error.message || "Failed to accept invitation");
      } else {
        setStatus("success");
        setTimeout(() => router.push("/overview"), 2000);
      }
    } catch {
      setStatus("error");
      setErrorMessage("Failed to accept invitation");
    }
  }

  if (!invitationId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border p-8 text-center space-y-4 max-w-md">
          <h1 className="text-xl font-bold">Invalid Invitation</h1>
          <p className="text-sm text-muted-foreground">
            This invitation link is missing the invitation ID.
          </p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (sessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg border p-8 text-center space-y-4 max-w-md">
        <h1 className="text-xl font-bold">Organization Invitation</h1>

        {status === "idle" && (
          <>
            <p className="text-sm text-muted-foreground">
              You have been invited to join an organization. Click below to accept.
            </p>
            <Button onClick={handleAccept}>Accept Invitation</Button>
          </>
        )}

        {status === "loading" && (
          <p className="text-sm text-muted-foreground">Accepting invitation...</p>
        )}

        {status === "success" && (
          <p className="text-sm text-green-600">
            Invitation accepted! Redirecting to dashboard...
          </p>
        )}

        {status === "error" && (
          <>
            <p className="text-sm text-red-600">{errorMessage}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleAccept} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => router.push("/")}>Go Home</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
