"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, Copy, Eye, EyeOff, Mail, Plus, RefreshCw, Settings as SettingsIcon, Slack, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { BillingButton } from "@/components/product/billing-button";
import { PageHeader } from "@/components/product/page-header";
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
  const { data: session, isPending } = useSession();
  const { data: activeOrg, isPending: orgPending } = useActiveOrganization();

  const orgMetadata = activeOrg?.metadata ? (() => {
    try { return JSON.parse(activeOrg.metadata as string) as Record<string, string>; }
    catch { return null; }
  })() : null;
  const plan = orgMetadata?.plan || "Free";

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" icon={SettingsIcon} />

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
              <BillingButton />
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
      <NotificationsSection />

      {/* Notification Channels */}
      <NotificationChannelsSection />

      {/* Agent Integration */}
      <AgentIntegrationSection />

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

function AgentIntegrationSection() {
  const currentRole = useCurrentMemberRole();
  const canView = currentRole === "owner" || currentRole === "admin";

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    fetch("/api/org/agent-token")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { token: string } | null) => {
        if (data) setToken(data.token);
      })
      .finally(() => setLoading(false));
  }, [canView]);

  async function handleRotate() {
    if (!confirmRotate) { setConfirmRotate(true); return; }
    setRotating(true);
    setConfirmRotate(false);
    try {
      const r = await fetch("/api/org/agent-token", { method: "POST" });
      const data = (await r.json()) as { token: string };
      setToken(data.token);
      setVisible(true);
      toast.success("Registration token rotated");
    } catch {
      toast.error("Failed to rotate token");
    } finally {
      setRotating(false);
    }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!canView) return null;

  const masked = token ? `nbl_reg_${"•".repeat(20)}` : "Loading...";
  const installCmd = token
    ? `curl -fsSL ${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.noblinks.com"}/install.sh | sudo bash -s -- --token ${token} --name <machine-name>`
    : "";

  return (
    <div className="rounded-lg border p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Agent Integration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Use this token to connect Linux machines to your organization.
        </p>
      </div>

      {/* Token row */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Org Registration Token</label>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono truncate">
            {loading ? "Loading..." : visible ? token : masked}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisible((v) => !v)}
            disabled={loading}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => token && handleCopy(token)}
            disabled={loading || !token}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant={confirmRotate ? "destructive" : "outline"}
            size="sm"
            onClick={handleRotate}
            disabled={rotating}
          >
            <RefreshCw className={`h-4 w-4 ${rotating ? "animate-spin" : ""}`} />
            <span className="ml-1 hidden sm:inline">
              {confirmRotate ? "Confirm" : "Rotate"}
            </span>
          </Button>
        </div>
        {confirmRotate && (
          <p className="text-xs text-muted-foreground">
            Click Rotate again to confirm. Existing machines keep their agent tokens — only new registrations are affected.{" "}
            <button className="underline" onClick={() => setConfirmRotate(false)}>Cancel</button>
          </p>
        )}
      </div>

      {/* Install command */}
      {token && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Quick Install</label>
          <div className="relative">
            <pre className="rounded-md bg-muted px-4 py-3 pr-12 text-xs leading-relaxed whitespace-pre-wrap break-all">
              {installCmd}
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2"
              onClick={() => handleCopy(installCmd)}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Replace <code className="bg-muted px-1 rounded">&lt;machine-name&gt;</code> with a unique name for the machine (e.g.{" "}
            <code className="bg-muted px-1 rounded">prod-api-1</code>). Run with <code className="bg-muted px-1 rounded">sudo</code> on the target Linux machine.
          </p>
        </div>
      )}

      <div className="pt-1">
        <Button asChild variant="outline" size="sm">
          <Link href="/machines">View Connected Machines</Link>
        </Button>
      </div>
    </div>
  );
}

function NotificationsSection() {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/org/notification-email")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { notificationEmail: string | null } | null) => {
        if (data?.notificationEmail) setEmail(data.notificationEmail);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/org/notification-email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationEmail: email }),
      });
      if (r.ok) {
        toast.success("Notification email saved");
      } else {
        toast.error("Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <h2 className="text-lg font-semibold">Notifications</h2>
      <form onSubmit={handleSave} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="notif-email">Notification Email</Label>
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Input
              id="notif-email"
              type="email"
              placeholder="alerts@yourcompany.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
          <p className="text-xs text-muted-foreground">
            Alert fire and resolve notifications will be sent to this address.
          </p>
        </div>
        <Button type="submit" disabled={saving || loading}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </form>
    </div>
  );
}

interface NotifChannel {
  id: string;
  name: string;
  type: string;
  config: Record<string, string>;
  enabled: boolean;
}

function NotificationChannelsSection() {
  const [channels, setChannels] = useState<NotifChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<"email" | "slack">("email");
  const [name, setName] = useState("");
  const [configValue, setConfigValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/notification-channels")
      .then((r) => (r.ok ? r.json() : { channels: [] }))
      .then((data: { channels: NotifChannel[] }) => setChannels(data.channels))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const config = type === "email" ? { email: configValue } : { webhookUrl: configValue };
      const r = await fetch("/api/notification-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, config }),
      });
      if (r.ok) {
        const data = (await r.json()) as { channel: NotifChannel };
        setChannels((prev) => [...prev, data.channel]);
        setShowForm(false);
        setName("");
        setConfigValue("");
        toast.success("Channel added");
      } else {
        const err = (await r.json()) as { error: string };
        toast.error(err.error ?? "Failed to add channel");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(ch: NotifChannel) {
    const r = await fetch(`/api/notification-channels/${ch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !ch.enabled }),
    });
    if (r.ok) {
      const data = (await r.json()) as { channel: NotifChannel };
      setChannels((prev) => prev.map((c) => (c.id === ch.id ? data.channel : c)));
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const r = await fetch(`/api/notification-channels/${id}`, { method: "DELETE" });
      if (r.ok) {
        setChannels((prev) => prev.filter((c) => c.id !== id));
        toast.success("Channel removed");
      }
    } finally {
      setDeletingId(null);
    }
  }

  const channelLabel = (ch: NotifChannel) => {
    if (ch.type === "email") return ch.config.email ?? "";
    if (ch.type === "slack") return "Slack Webhook";
    return ch.type;
  };

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Notification Channels</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Receive alerts via email or Slack in addition to the notification email above.
          </p>
        </div>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Channel
          </Button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="rounded-md border p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="ch-type">Type</Label>
              <select
                id="ch-type"
                value={type}
                onChange={(e) => { setType(e.target.value as "email" | "slack"); setConfigValue(""); }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="email">Email</option>
                <option value="slack">Slack</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ch-name">Name</Label>
              <Input
                id="ch-name"
                placeholder="e.g. On-call email"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ch-value">
                {type === "email" ? "Email Address" : "Webhook URL"}
              </Label>
              <Input
                id="ch-value"
                type={type === "email" ? "email" : "url"}
                placeholder={type === "email" ? "alerts@company.com" : "https://hooks.slack.com/..."}
                value={configValue}
                onChange={(e) => setConfigValue(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Adding…" : "Add"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setShowForm(false); setName(""); setConfigValue(""); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Channel list */}
      {loading ? (
        <Skeleton className="h-14 w-full" />
      ) : channels.length === 0 ? (
        <div className="flex items-center gap-3 rounded-md border border-dashed px-4 py-5 text-sm text-muted-foreground">
          <Bell className="h-5 w-5 shrink-0" />
          No notification channels configured yet.
        </div>
      ) : (
        <div className="space-y-2">
          {channels.map((ch) => (
            <div key={ch.id} className="flex items-center gap-3 rounded-md border px-4 py-3">
              {ch.type === "email" ? (
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <Slack className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ch.name}</p>
                <p className="text-xs text-muted-foreground truncate">{channelLabel(ch)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(ch)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${ch.enabled ? "bg-primary" : "bg-muted-foreground/30"}`}
                title={ch.enabled ? "Disable" : "Enable"}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${ch.enabled ? "translate-x-4" : "translate-x-0"}`} />
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(ch.id)}
                disabled={deletingId === ch.id}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          ))}
        </div>
      )}
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
