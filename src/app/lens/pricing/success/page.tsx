"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BillingButton } from "@/components/product/billing-button";

const PLAN_LABELS: Record<string, string> = { starter: "Starter", growth: "Growth" };

export default function LensCheckoutSuccessPage() {
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lens/sync-plan", { method: "POST" })
      .then((r) => r.json())
      .then((d: { plan: string }) => setPlan(d.plan))
      .catch(() => null);
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="text-center space-y-6 max-w-md">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">You&apos;re all set!</h1>
          <p className="text-muted-foreground">
            {plan && PLAN_LABELS[plan]
              ? `Your Lens ${PLAN_LABELS[plan]} subscription is now active.`
              : "Your Lens subscription is now active. Run compatibility analyses and explore your migration path to EU sovereign cloud."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* Hard navigation so sidebar re-mounts and badge reflects new plan */}
          <Button onClick={() => { window.location.href = "/lens"; }}>
            Go to Lens
          </Button>
          <BillingButton />
        </div>
      </div>
    </div>
  );
}
