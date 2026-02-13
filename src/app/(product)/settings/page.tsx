"use client";

import Link from "next/link";
import { Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNoblinks } from "@/context/noblinks-context";

export default function SettingsPage() {
  const { machines } = useNoblinks();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Organization */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Organization</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input id="org-name" value="My Organization" readOnly />
          </div>
          <div className="space-y-2">
            <Label>Plan</Label>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">Free</Badge>
              <Button variant="outline" size="sm" disabled>
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="notif-email">Notification Email</Label>
            <Input
              id="notif-email"
              type="email"
              placeholder="team@example.com"
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label>Alert Channels</Label>
            <p className="text-sm text-muted-foreground">Email only</p>
          </div>
        </div>
      </div>

      {/* Connected Machines */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Connected Machines</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Server className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{machines.length}</p>
            <p className="text-sm text-muted-foreground">
              {machines.length === 1 ? "machine" : "machines"} connected
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="ml-auto">
            <Link href="/machines">Manage Machines</Link>
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-red-500/30 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Delete Organization</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete this organization and all associated data.
            </p>
          </div>
          <Button variant="destructive" size="sm" disabled>
            Delete Organization
          </Button>
        </div>
      </div>
    </div>
  );
}
