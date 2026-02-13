"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Server, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useNoblinks } from "@/context/noblinks-context";
import { useSession, useActiveOrganization, organization } from "@/lib/auth-client";

function useCurrentMemberRole() {
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const currentMember = activeOrg?.members?.find(
    (m) => m.userId === session?.user?.id
  );
  return currentMember?.role ?? null;
}

export default function SettingsPage() {
  const { machines } = useNoblinks();
  const { data: session, isPending } = useSession();
  const { data: activeOrg, isPending: orgPending } = useActiveOrganization();

  const orgMetadata = activeOrg?.metadata ? (() => {
    try { return JSON.parse(activeOrg.metadata as string) as Record<string, string>; }
    catch { return null; }
  })() : null;
  const plan = orgMetadata?.plan || "Free";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Organization */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Organization</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            {isPending || orgPending ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Input id="org-name" value={activeOrg?.name || session?.user?.name || "Personal Account"} readOnly />
            )}
          </div>
          <div className="space-y-2">
            <Label>Plan</Label>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{plan}</Badge>
              <Button variant="outline" size="sm" disabled>
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Members */}
      <MemberList />

      {/* Invite Members */}
      <InviteForm />

      {/* Pending Invitations */}
      <PendingInvitations />

      {/* Notifications */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="notif-email">Notification Email</Label>
            {isPending ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Input
                id="notif-email"
                type="email"
                value={session?.user?.email || ""}
                readOnly
              />
            )}
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
      <DeleteOrganizationSection />
    </div>
  );
}

function MemberList() {
  const { data: activeOrg, isPending } = useActiveOrganization();

  if (isPending) {
    return (
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Members</h2>
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  const members = activeOrg?.members ?? [];

  if (members.length === 0) return null;

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Members</h2>
        <span className="text-sm text-muted-foreground">{members.length} {members.length === 1 ? "member" : "members"}</span>
      </div>
      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-md border px-4 py-3"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {(m.user.name || m.user.email)?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.user.name || m.user.email}</p>
              <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
            </div>
            <Badge variant="secondary" className="capitalize">{m.role}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function InviteForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await organization.inviteMember({
        email,
        role,
      });

      if (error) {
        setMessage({ type: "error", text: error.message || "Failed to send invitation" });
      } else {
        setMessage({ type: "success", text: `Invitation sent to ${email}` });
        setEmail("");
      }
    } catch {
      setMessage({ type: "error", text: "Failed to send invitation" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <h2 className="text-lg font-semibold">Invite Members</h2>
      <form onSubmit={handleInvite} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="invite-email">Email Address</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "member")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-32"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <Button type="submit" disabled={loading || !email}>
          {loading ? "Sending..." : "Send Invite"}
        </Button>
      </form>
      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

function PendingInvitations() {
  const { data: activeOrg, isPending } = useActiveOrganization();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const pendingInvitations = activeOrg?.invitations?.filter(
    (inv) => inv.status === "pending"
  ) ?? [];

  async function handleCancel(invitationId: string) {
    setCancellingId(invitationId);
    try {
      await organization.cancelInvitation({ invitationId });
    } finally {
      setCancellingId(null);
    }
  }

  if (isPending) {
    return (
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Pending Invitations</h2>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (pendingInvitations.length === 0) return null;

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <h2 className="text-lg font-semibold">Pending Invitations</h2>
      <div className="space-y-2">
        {pendingInvitations.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between rounded-md border px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{inv.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{inv.role}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCancel(inv.id)}
              disabled={cancellingId === inv.id}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cancel invitation</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeleteOrganizationSection() {
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();
  const currentRole = useCurrentMemberRole();
  const isOwner = currentRole === "owner";
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!activeOrg?.id) return;
    setDeleting(true);

    try {
      const { error } = await organization.delete({
        organizationId: activeOrg.id,
      });

      if (!error) {
        setOpen(false);
        router.push("/");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-lg border border-red-500/30 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Delete Organization</p>
          <p className="text-sm text-muted-foreground">
            Permanently delete this organization and all associated data.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={!isOwner}>
              Delete Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Organization</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{activeOrg?.name}</strong>? This action
                cannot be undone. All organization data, members, and invitations will be
                permanently removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete permanently"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {!isOwner && currentRole && (
        <p className="text-xs text-muted-foreground">Only the organization owner can delete the organization.</p>
      )}
    </div>
  );
}
