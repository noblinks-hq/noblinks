"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/product/page-header";
import { BillingButton } from "@/components/product/billing-button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession, useActiveOrganization } from "@/lib/auth-client";

const PLAN_LABELS: Record<string, string> = { none: "Free", starter: "Starter", growth: "Growth" };

export default function LensSettingsPage() {
  const { data: session, isPending } = useSession();
  const { data: activeOrg, isPending: orgPending } = useActiveOrganization();
  const [lensPlan, setLensPlan] = useState<string>("none");

  useEffect(() => {
    fetch("/api/lens/plan")
      .then((r) => r.json())
      .then((d: { plan: string }) => setLensPlan(d.plan));
  }, []);

  const members = activeOrg?.members ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4">
      <PageHeader title="Settings" icon={Settings} />

      {/* Organization */}
      <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
        <h2 className="text-base font-semibold">Organization</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Organization name</Label>
            {isPending || orgPending ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Input value={activeOrg?.name ?? session?.user?.name ?? "Personal Account"} readOnly />
            )}
          </div>
          <div className="space-y-2">
            <Label>Lens plan</Label>
            <div className="flex items-center gap-3 h-10">
              <Badge variant="secondary">{PLAN_LABELS[lensPlan] ?? lensPlan}</Badge>
              <BillingButton />
            </div>
          </div>
        </div>
      </div>

      {/* Members */}
      {(orgPending || members.length > 0) && (
        <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Members</h2>
            {!orgPending && (
              <span className="text-sm text-muted-foreground">
                {members.length} {members.length === 1 ? "member" : "members"}
              </span>
            )}
          </div>
          {orgPending ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {(m.user.name ?? m.user.email)?.[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.user.name ?? m.user.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{m.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
