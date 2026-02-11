import Link from "next/link";
import { MessageSquare, Bell, Terminal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex-1 container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            Noblinks
          </h1>
          <h2 className="text-2xl font-semibold text-muted-foreground">
            From alert to fix. No context switching.
          </h2>
          <p className="text-xl text-muted-foreground">
            Noblinks is an AI on-call engineer that helps you monitor, debug,
            and fix infrastructure in one place. Tell it what you want to watch
            — it creates the dashboards, alerts, and guides you through the fix.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Monitoring by Conversation
            </h3>
            <p className="text-sm text-muted-foreground">
              Describe what you want to monitor in plain English. Noblinks sets
              it up automatically.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alerts With Context
            </h3>
            <p className="text-sm text-muted-foreground">
              Alerts explain what changed and why — not just that something
              broke.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Embedded Terminal
            </h3>
            <p className="text-sm text-muted-foreground">
              Debug issues directly inside Noblinks without switching to SSH.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI-Guided Fixes
            </h3>
            <p className="text-sm text-muted-foreground">
              The AI suggests checks and commands and helps resolve incidents
              step by step.
            </p>
          </div>
        </div>

        <div className="space-y-6 mt-12">
          <h3 className="text-2xl font-semibold">How Noblinks Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">
                1. Install the Noblinks agent on your VM
              </h4>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">
                2. Ask Noblinks what you want to monitor
              </h4>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">
                3. Get alerted when something breaks
              </h4>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">
                4. Fix it with AI guidance — in one screen
              </h4>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-12">
          <Button size="lg">Get Early Access</Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
