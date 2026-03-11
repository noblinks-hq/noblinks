import Link from "next/link";
import {
  MessageSquare,
  Bell,
  Terminal,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Shield,
  Zap,
  Server,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function MockDashboard() {
  const points = [40, 55, 45, 70, 65, 80, 72, 90, 85, 95, 78, 88];
  const max = 100;
  const w = 300;
  const h = 80;
  const pts = points
    .map((v, i) => `${(i / (points.length - 1)) * w},${h - (v / max) * h}`)
    .join(" ");

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40 overflow-hidden text-sm select-none">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-slate-800/60">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-xs text-slate-400 font-mono">noblinks.com/overview</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Metric cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "CPU", value: "78%", color: "bg-orange-400", width: "w-[78%]", trend: "+4%" },
            { label: "Memory", value: "61%", color: "bg-blue-400", width: "w-[61%]", trend: "stable" },
            { label: "Disk I/O", value: "23%", color: "bg-green-400", width: "w-[23%]", trend: "-2%" },
          ].map((m) => (
            <div key={m.label} className="rounded-lg bg-slate-800 p-2.5">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{m.label}</p>
              <p className="text-base font-semibold text-white mt-0.5">{m.value}</p>
              <div className="mt-1.5 h-1 rounded-full bg-slate-700">
                <div className={`h-1 rounded-full ${m.color} ${m.width}`} />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{m.trend}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="rounded-lg bg-slate-800 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Request Rate — last 1h</p>
            <span className="text-[10px] text-green-400 font-medium">Live</span>
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              points={pts}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <polygon
              points={`0,${h} ${pts} ${w},${h}`}
              fill="url(#chartGrad)"
            />
          </svg>
        </div>

        {/* Alert */}
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 flex items-start gap-2.5">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white">High CPU on prod-web-01</p>
            <p className="text-[10px] text-slate-400 mt-0.5">CPU &gt; 90% for 3 min · 2 minutes ago</p>
          </div>
          <span className="text-[10px] text-red-400 font-medium shrink-0">Critical</span>
        </div>

        {/* AI suggestion */}
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2.5 flex items-start gap-2.5">
          <Sparkles className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-white">AI suggestion</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              A Node.js process is consuming 87% of CPU. Run{" "}
              <code className="text-blue-300 font-mono">pm2 restart app</code> to recover.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const integrations = [
  "AWS", "GCP", "Azure", "Docker", "Kubernetes", "PostgreSQL",
  "Redis", "MySQL", "MongoDB", "Nginx", "Node.js", "Python",
  "Go", "Prometheus", "Grafana", "Slack",
];

const testimonials = [
  {
    quote: "We went from a 40-minute alert-to-fix cycle to under 8 minutes. Noblinks basically replaced our on-call playbooks.",
    author: "Arjun Mehta",
    title: "Head of Infrastructure · Finstack",
  },
  {
    quote: "The AI incident assistant is like having a senior SRE available at 3am. It explains what's wrong and tells you exactly what to run.",
    author: "Sofia Reyes",
    title: "Platform Engineer · Loopline",
  },
  {
    quote: "Setup took 4 minutes. We pasted one command, described what we wanted to monitor, and dashboards appeared. Nothing else comes close.",
    author: "Thomas Okafor",
    title: "CTO · Rocketship Labs",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-blue-950 text-white">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] rounded-full bg-sky-600/10 blur-3xl" />
        </div>

        <div className="relative container mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                Now in public beta
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                From alert to fix.{" "}
                <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-blue-500 bg-clip-text text-transparent">
                  No context switching.
                </span>
              </h1>

              <p className="text-lg text-sky-100/75 leading-relaxed max-w-lg">
                Noblinks is an AI on-call engineer that monitors your infrastructure,
                explains what broke, and guides you through the fix — all in one place.
                No dashboards to build. No runbooks to maintain.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" disabled className="rounded-lg px-6 h-12 text-base">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5 rounded-lg px-6 h-12 text-base bg-transparent"
                >
                  <Link href="/overview">View live dashboard</Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-sky-100/75">
                {["No credit card required", "Free up to 3 machines", "Setup in under 5 minutes"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — mock dashboard */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-2xl bg-blue-500/5 blur-xl" />
              <div className="relative">
                <MockDashboard />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social proof ─────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30 py-10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground mb-8">
            Trusted by engineering teams at
          </p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
            {["Finstack", "Loopline", "Rocketship", "NovaByte", "Driftworks", "Archscale", "Peakflow", "Meridian"].map(
              (co) => (
                <span key={co} className="text-sm font-semibold text-muted-foreground/60 tracking-wide uppercase">
                  {co}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ─── Core value props ──────────────────────────────────────────── */}
      <section className="py-24 container mx-auto px-6">
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight">
            Everything you need to stay on top of production
          </h2>
          <p className="text-muted-foreground text-lg">
            One tool that replaces your monitoring setup, runbooks, and on-call escalation chain.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: MessageSquare,
              title: "Monitoring by conversation",
              desc: "Describe what you want to monitor in plain English. Noblinks sets up dashboards and alerts automatically.",
              color: "text-blue-500 bg-blue-500/10",
            },
            {
              icon: Bell,
              title: "Alerts with full context",
              desc: "Every alert explains what changed, why it matters, and what likely caused it — before you even open a terminal.",
              color: "text-sky-500 bg-sky-500/10",
            },
            {
              icon: Terminal,
              title: "Embedded terminal",
              desc: "Debug and remediate without switching to SSH. Run commands, view logs, and apply fixes from the same screen.",
              color: "text-cyan-500 bg-cyan-500/10",
            },
            {
              icon: Sparkles,
              title: "AI-guided fixes",
              desc: "The AI analyzes your system state and walks you through the exact steps to resolve each incident.",
              color: "text-orange-500 bg-orange-500/10",
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="group relative rounded-xl border p-6 hover:border-foreground/20 hover:shadow-sm transition-all"
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Feature: Monitoring by conversation ──────────────────────── */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                <MessageSquare className="h-4 w-4" />
                Conversational setup
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                Set up monitoring in plain English
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                No YAML. No PromQL. No Grafana panels. Just tell Noblinks what you care
                about — &ldquo;alert me if CPU stays above 80% for 5 minutes&rdquo; — and it configures
                everything instantly.
              </p>
              <ul className="space-y-3">
                {[
                  "Dashboards generated automatically from your description",
                  "Thresholds tuned to your historical baseline",
                  "Works across all your machines from day one",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground/50 cursor-not-allowed">
                Get started free <ChevronRight className="h-4 w-4" />
              </span>
            </div>

            {/* Mock chat UI */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="border-b px-4 py-3 flex items-center gap-2 bg-muted/40">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-muted-foreground">Noblinks AI</span>
              </div>
              <div className="p-4 space-y-4 text-sm">
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-tr-sm bg-blue-600 text-white px-4 py-2.5 max-w-[80%]">
                    Monitor my Node.js API and alert me if response time goes over 500ms
                  </div>
                </div>
                <div className="flex gap-3 max-w-[85%]">
                  <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-foreground">
                    Done! I&apos;ve created a dashboard tracking p50/p95/p99 latency and request rate for your API.
                    I&apos;ll alert you if p95 exceeds 500ms for more than 2 minutes.
                  </div>
                </div>
                <div className="rounded-lg border bg-background p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">API Response Time</span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">All clear</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[["p50", "48ms"], ["p95", "182ms"], ["p99", "310ms"]].map(([k, v]) => (
                      <div key={k} className="rounded bg-muted p-2 text-center">
                        <p className="text-muted-foreground">{k}</p>
                        <p className="font-semibold mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature: Alerts with context ─────────────────────────────── */}
      <section className="py-24 container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Mock alert */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden order-2 lg:order-1">
            <div className="border-b px-4 py-3 bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Critical Alert · prod-web-01</span>
              </div>
              <span className="text-xs text-muted-foreground">3 min ago</span>
            </div>
            <div className="p-5 space-y-5 text-sm">
              <div className="space-y-1">
                <p className="font-semibold text-base">CPU Usage: 94% (threshold: 85%)</p>
                <p className="text-muted-foreground">
                  CPU has been above 85% for 4 minutes on your primary web server.
                </p>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 space-y-1.5">
                <p className="font-medium text-amber-700 dark:text-amber-400 text-xs uppercase tracking-wide">What likely caused this</p>
                <p className="text-foreground">
                  A background job <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">report-generator</code> started at 14:32 and is consuming 6 of 8 CPU cores.
                  This matches a weekly scheduled task pattern.
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Suggested actions</p>
                <ul className="space-y-1.5">
                  {[
                    "Check process list: top -b -n 1 | head -20",
                    "Kill the report job if non-critical: kill -9 <pid>",
                    "Or nice the process: renice +10 <pid>",
                  ].map((a) => (
                    <li key={a} className="flex items-start gap-2">
                      <ChevronRight className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <code className="font-mono text-xs">{a}</code>
                    </li>
                  ))}
                </ul>
              </div>
              <Button size="sm" variant="outline" className="w-full">
                Open terminal to remediate
              </Button>
            </div>
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
              <Bell className="h-4 w-4" />
              Intelligent alerts
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              Alerts that explain themselves
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Stop waking up to &ldquo;CPU high on server-3&rdquo;. Noblinks alerts include what
              changed, why it probably happened, and the exact commands to fix it.
              Fewer false positives. Faster resolution.
            </p>
            <ul className="space-y-3">
              {[
                "Root cause analysis included in every alert",
                "Correlated with recent deploys and cron jobs",
                "Slack, email, and webhook delivery",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-blue-950 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Built for production speed</h2>
            <p className="text-sky-100/75 mt-3 text-lg">Real numbers from teams running Noblinks in production.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            {[
              { value: "4×", label: "Faster incident resolution" },
              { value: "<30s", label: "Alert delivery latency" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "100+", label: "Integrations supported" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-4xl font-bold bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-transparent">
                  {value}
                </p>
                <p className="text-sky-100/70 mt-2 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────── */}
      <section className="py-24 container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Up and running in minutes</h2>
          <p className="text-muted-foreground mt-3 text-lg max-w-xl mx-auto">
            No complex setup. No Kubernetes required. Works on any Linux VM.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            {
              step: "01",
              icon: Server,
              title: "Install the agent",
              desc: "One curl command. Runs on any Linux VM — bare metal, cloud, or container host.",
            },
            {
              step: "02",
              icon: MessageSquare,
              title: "Tell us what to watch",
              desc: "Chat with Noblinks and describe your stack. It creates dashboards and thresholds automatically.",
            },
            {
              step: "03",
              icon: Bell,
              title: "Get alerted with context",
              desc: "Receive alerts via Slack or email — with root cause analysis, not just raw numbers.",
            },
            {
              step: "04",
              icon: Sparkles,
              title: "Fix it in one screen",
              desc: "Use the embedded terminal and AI guidance to resolve the incident without switching tools.",
            },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="relative rounded-xl border p-6 bg-card">
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-muted-foreground/20">{step}</span>
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Integrations ─────────────────────────────────────────────── */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Integrates with your stack</h2>
            <p className="text-muted-foreground mt-3">
              Works with the tools you already use. No lock-in.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {integrations.map((name) => (
              <span
                key={name}
                className="rounded-lg border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                {name}
              </span>
            ))}
            <span className="rounded-lg border border-dashed px-4 py-2 text-sm text-muted-foreground/60">
              + many more
            </span>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────── */}
      <section className="py-24 container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Teams love Noblinks</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map(({ quote, author, title }) => (
            <div key={author} className="rounded-xl border bg-card p-6 flex flex-col gap-4">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Activity key={i} className="h-4 w-4 text-blue-500 fill-blue-500" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">&ldquo;{quote}&rdquo;</p>
              <div>
                <p className="font-semibold text-sm">{author}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────── */}
      <section className="py-24 bg-blue-950 text-white">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-8">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Stop flying blind in production
          </h2>
          <p className="text-sky-100/75 text-lg mb-10">
            Join teams already using Noblinks to catch and fix incidents before they become outages.
            Free to start. No credit card needed.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" disabled className="rounded-lg px-8 h-12 text-base">
              <Zap className="mr-2 h-4 w-4" />
              Start for free
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5 rounded-lg px-8 h-12 text-base bg-transparent"
            >
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
          <p className="text-sky-100/50 text-sm mt-6">Free up to 3 machines · No credit card required · Setup in &lt;5 min</p>
        </div>
      </section>
    </div>
  );
}
