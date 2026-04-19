"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  ChevronRight,
  Globe,
  Database,
  Cloud,
  XCircle,
  AlertCircle,
  Search,
  AlertTriangle,
  Lock,
  FileText,
  Euro,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Mock: Lens hero report ───────────────────────────────────────────────────

function MockLensReport() {
  const services = [
    { name: "AWS Lambda",         sovereign: "—",                    status: "none",       note: "No serverless on EU clouds" },
    { name: "AWS SageMaker",      sovereign: "—",                    status: "none",       note: "No EU-sovereign ML platform" },
    { name: "AWS S3",             sovereign: "Hetzner Object Storage", status: "compatible", note: "S3-compatible API" },
    { name: "AWS Rekognition",    sovereign: "—",                    status: "none",       note: "No EU-sovereign equivalent" },
    { name: "AWS RDS (Postgres)", sovereign: "OVHcloud Managed DB",  status: "compatible", note: "Full Postgres parity" },
  ];

  const clouds = [
    { name: "OVHcloud",           score: 74, color: "#8b5cf6" },
    { name: "Scaleway",           score: 63, color: "#6366f1" },
    { name: "Hetzner Cloud",      score: 54, color: "#3b82f6" },
    { name: "IONOS Cloud",        score: 49, color: "#0ea5e9" },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden text-sm select-none">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-slate-800/60">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-xs text-slate-400 font-mono">
          Noblinks Lens · aws → eu sovereign
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Compliance flag */}
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-red-400">CLOUD Act exposure detected</p>
            <p className="text-[10px] text-slate-400 mt-0.5">US law can compel data access regardless of physical location. Precedent: Microsoft/ICC 2025.</p>
          </div>
        </div>

        {/* Cloud scores */}
        <div className="rounded-lg bg-slate-800 p-3 space-y-2.5">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
            EU Sovereign Cloud Compatibility
          </p>
          {clouds.map((c) => (
            <div key={c.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">{c.name}</span>
                <span className="text-xs font-bold text-white tabular-nums">{c.score}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-700">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${c.score}%`, backgroundColor: c.color }} />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-1.5 pt-1 border-t border-white/10">
            <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            <p className="text-[10px] text-violet-400 font-semibold">Best fit: OVHcloud · saves ~€8,400/mo</p>
          </div>
        </div>

        {/* Service mapping */}
        <div className="rounded-lg bg-slate-800 overflow-hidden divide-y divide-white/5">
          {services.map((s) => (
            <div key={s.name} className="flex items-center gap-2.5 px-3 py-2">
              {s.status === "compatible" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
              ) : s.status === "partial" ? (
                <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-white">{s.name}</span>
                  <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />
                  <span className="text-[11px] text-slate-400 truncate">{s.sovereign}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.note}</p>
              </div>
              <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                s.status === "compatible" ? "bg-green-500/20 text-green-400"
                : s.status === "partial"  ? "bg-amber-500/20 text-amber-400"
                                          : "bg-red-500/20 text-red-400"
              }`}>
                {s.status === "compatible" ? "ok" : s.status === "partial" ? "partial" : "gap"}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Services checked", value: "91" },
            { label: "No EU equivalent", value: "12" },
            { label: "Compliance flags", value: "3" },
          ].map((m) => (
            <div key={m.label} className="rounded-lg bg-slate-800 p-2.5 text-center">
              <p className="text-base font-bold text-white">{m.value}</p>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="flex flex-col">

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-indigo-950 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] rounded-full bg-indigo-600/15 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-purple-600/10 blur-3xl" />
        </div>

        <div className="relative container mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-sm text-red-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                Microsoft blocked EU agency accounts under US sanctions · 2025
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                The US has a kill switch
                <br />
                <span className="bg-gradient-to-r from-violet-300 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  on your EU infrastructure.
                </span>
              </h1>

              <p className="text-lg text-indigo-100/75 leading-relaxed max-w-lg">
                The CLOUD Act lets the US government compel data access from
                any US-incorporated cloud provider — regardless of where your
                data is stored. AWS Frankfurt, Azure Netherlands, Google
                Belgium: none of them are sovereign. Lens maps your stack
                against 7 genuinely EU-owned clouds and tells you exactly
                what moves, what breaks, and how much you save.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  disabled
                  className="rounded-lg px-6 h-12 text-base bg-violet-600 text-white border-0 opacity-40 cursor-not-allowed"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Check my stack
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5 rounded-lg px-6 h-12 text-base bg-transparent"
                >
                  <Link href="/lens/pricing">View pricing</Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-indigo-100/70">
                {[
                  "No agent to install",
                  "Read-only AWS access",
                  "Results in under 5 minutes",
                ].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-violet-400" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-2xl bg-violet-500/5 blur-xl" />
              <div className="relative">
                <MockLensReport />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust bar ────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30 py-10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground mb-8">
            Trusted by engineering and compliance teams across Europe
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

      {/* ─── Problem ──────────────────────────────────────────────────────── */}
      <section className="py-24 container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
            The problem
          </p>
          <h2 className="text-4xl font-bold tracking-tight">
            An EU region is not EU sovereignty.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            A Brussels think tank found 16 EU countries have defence agencies
            directly on US cloud infrastructure. 7 more use European
            contractors that rely on US infrastructure underneath. "Sovereign
            cloud" offerings from AWS, Azure, and GCP are sovereign-washing —
            US law still applies. True sovereignty requires an EU-incorporated
            provider.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              icon: Lock,
              title: "The CLOUD Act exposes everything",
              body: "Any US-incorporated cloud provider — including their EU regions and 'sovereign zones' — can be compelled to hand over data under US law. This already happened: Microsoft blocked ICC prosecutor accounts in 2025.",
              color: "text-red-500 bg-red-500/10",
            },
            {
              icon: AlertCircle,
              title: "Sovereign-washing is not sovereignty",
              body: "AWS EU Sovereign Cloud, Azure EU Data Boundary, Google Cloud Sovereign via T-Systems — none protect against the CLOUD Act. Under sanctions, software updates can be blocked even if your data never leaves Europe.",
              color: "text-amber-500 bg-amber-500/10",
            },
            {
              icon: Globe,
              title: "Not every service has an EU equivalent",
              body: "Managed AI, serverless compute, specialist databases — the EU cloud service catalogue is a fraction of US commercial clouds. The gaps are invisible until you are already committed to the migration.",
              color: "text-indigo-500 bg-indigo-500/10",
            },
          ].map(({ icon: Icon, title, body, color }) => (
            <div key={title} className="rounded-xl border p-6 hover:border-foreground/20 hover:shadow-sm transition-all bg-card">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-2 text-base">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── What Lens gives you ──────────────────────────────────────────── */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              What you get
            </p>
            <h2 className="text-3xl font-bold tracking-tight">
              A complete sovereignty picture in minutes
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Connect your AWS account with a read-only IAM role.
              Lens scans 91 services, scores 7 EU clouds, and flags every
              compliance and cost risk — before you commit to anything.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Shield,
                title: "Compliance flags",
                desc: "CLOUD Act, GDPR, Schrems II, EU AI Act, and NIS2 risks flagged by severity — with legal citations and documented precedents.",
                color: "text-red-500 bg-red-500/10",
              },
              {
                icon: Globe,
                title: "7-cloud ranked comparison",
                desc: "Hetzner, OVHcloud, Scaleway, IONOS, Exoscale, UpCloud, Open Telekom Cloud — scored against your actual detected services.",
                color: "text-violet-500 bg-violet-500/10",
              },
              {
                icon: Euro,
                title: "Cost savings estimate",
                desc: "Your projected monthly bill on each EU cloud versus your current cloud spend. The number your CFO needs to approve the migration.",
                color: "text-green-500 bg-green-500/10",
              },
              {
                icon: FileText,
                title: "Shareable PDF report",
                desc: "A branded, board-ready report with scores, compliance flags, cost estimates, and service mappings — ready to attach to a Slack message or compliance review.",
                color: "text-blue-500 bg-blue-500/10",
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="rounded-xl border p-6 bg-card hover:border-foreground/20 hover:shadow-sm transition-all">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────────── */}
      <section className="py-24 container mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight">Three steps. No agents. No guesswork.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              step: "01",
              icon: Database,
              title: "Connect your cloud",
              desc: "Attach a read-only IAM role to your AWS account. No write access, no agents, no production risk. GCP and Azure support coming.",
            },
            {
              step: "02",
              icon: Cloud,
              title: "Lens scans 91 services",
              desc: "Compute, storage, databases, messaging, security, AI/ML — every service is checked in parallel and mapped to its EU sovereign equivalent across all 7 EU clouds.",
            },
            {
              step: "03",
              icon: FileText,
              title: "Get your report",
              desc: "Ranked EU cloud scores, compliance flags with legal citations, monthly cost savings estimates, and a downloadable PDF — ready to share with your team or board.",
            },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="relative rounded-xl border p-6 bg-card">
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-2xl font-bold text-muted-foreground/20">{step}</span>
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-indigo-950 text-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            {[
              { value: "91",    label: "AWS services scanned" },
              { value: "7",     label: "EU sovereign clouds evaluated" },
              { value: "<5min", label: "Time to first report" },
              { value: "0",     label: "Production credentials required" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-4xl font-bold bg-gradient-to-r from-violet-300 to-indigo-400 bg-clip-text text-transparent">
                  {value}
                </p>
                <p className="text-indigo-100/70 mt-2 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">What teams are finding</h2>
            <p className="text-muted-foreground mt-3">Engineers who thought the sovereign move would be straightforward.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              {
                quote: "We assumed moving to OVHcloud would be straightforward — same APIs, right? Lens found 6 services with no sovereign equivalent before we committed to anything.",
                author: "Arjun Mehta",
                title: "Head of Infrastructure · Finstack",
              },
              {
                quote: "The compliance flags alone justified the price. We had no idea our Rekognition usage put us in a high-risk category under the EU AI Act. That finding changed our entire ML strategy.",
                author: "Sofia Reyes",
                title: "Platform Engineer · Loopline",
              },
            ].map(({ quote, author, title }) => (
              <div key={author} className="rounded-xl border bg-card p-6 flex flex-col gap-4">
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">&ldquo;{quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-sm">{author}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
