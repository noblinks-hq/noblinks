"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ScanSearch, CheckCircle2, ChevronRight, Shield, Upload, Terminal, ClipboardList, Copy, Check, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/product/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Cloud catalog
// ---------------------------------------------------------------------------

const CLOUDS = [
  {
    id: "hetzner",
    name: "Hetzner Cloud",
    tagline: "German cloud, GDPR-compliant",
    region: "Germany · Finland · USA",
    available: true,
    color: "bg-red-600",
    initial: "H",
  },
  {
    id: "ovhcloud",
    name: "OVHcloud",
    tagline: "French sovereign cloud",
    region: "Europe",
    available: false,
    color: "bg-blue-500",
    initial: "O",
  },
  {
    id: "aws_eu_sovereign",
    name: "AWS EU Sovereign",
    tagline: "AWS for regulated industries",
    region: "Germany",
    available: false,
    color: "bg-orange-500",
    initial: "A",
  },
  {
    id: "scaleway",
    name: "Scaleway",
    tagline: "French developer-first cloud",
    region: "France · Netherlands · Poland",
    available: false,
    color: "bg-violet-600",
    initial: "S",
  },
  {
    id: "google_sovereign",
    name: "Google Sovereign",
    tagline: "T-Systems partnership",
    region: "Germany",
    available: false,
    color: "bg-green-600",
    initial: "G",
  },
  {
    id: "azure_sovereign",
    name: "Azure EU Sovereign",
    tagline: "Microsoft for EU public sector",
    region: "Europe",
    available: false,
    color: "bg-sky-600",
    initial: "Az",
  },
];

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

const STEPS = ["Target cloud", "Input method", "Connect"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold",
                  done && "bg-primary text-primary-foreground",
                  active && "border-2 border-primary text-primary",
                  !done && !active && "border border-muted-foreground/40 text-muted-foreground"
                )}
              >
                {done ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-sm hidden sm:block",
                  active ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Cloud picker
// ---------------------------------------------------------------------------

function CloudPicker({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Choose target cloud</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the EU sovereign cloud you want to evaluate your AWS stack against.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CLOUDS.map((cloud) => {
          const isSelected = selected === cloud.id;

          if (!cloud.available) {
            return (
              <div
                key={cloud.id}
                className="relative flex items-center gap-4 rounded-xl border bg-card px-5 py-4 opacity-50 cursor-not-allowed"
              >
                <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl text-white font-bold text-sm shrink-0", cloud.color)}>
                  {cloud.initial}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{cloud.name}</p>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border bg-muted text-muted-foreground">
                      Soon
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{cloud.tagline}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{cloud.region}</p>
                </div>
              </div>
            );
          }

          return (
            <button
              key={cloud.id}
              type="button"
              onClick={() => onSelect(cloud.id)}
              className={cn(
                "relative flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "bg-card hover:border-muted-foreground/40 hover:bg-muted/50"
              )}
            >
              <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl text-white font-bold text-sm shrink-0", cloud.color)}>
                {cloud.initial}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">{cloud.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{cloud.tagline}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">{cloud.region}</p>
              </div>
              {isSelected && (
                <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Input method picker
// ---------------------------------------------------------------------------

const INPUT_METHODS = [
  {
    id: "iam_role",
    name: "AWS IAM Role",
    description: "Connect a read-only IAM role. Lens enumerates your services live — no file export needed.",
    icon: Shield,
    recommended: true,
    available: true,
  },
  {
    id: "terraform",
    name: "Terraform files",
    description: "Upload your .tf files and Lens maps every resource to its sovereign cloud equivalent.",
    icon: Upload,
    recommended: false,
    available: true,
  },
  {
    id: "helm",
    name: "Helm chart",
    description: "Upload a Helm chart and Lens analyses the Kubernetes workloads and dependencies.",
    icon: Upload,
    recommended: false,
    available: true,
  },
  {
    id: "cli_export",
    name: "CLI export",
    description: "Run npx @noblinks/lens-export in your environment and paste the output.",
    icon: Terminal,
    recommended: false,
    available: true,
  },
  {
    id: "manual",
    name: "Manual inventory",
    description: "Describe your stack by hand — best for quick estimates without AWS access.",
    icon: ClipboardList,
    recommended: false,
    available: false,
  },
];

function InputMethodPicker({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">How will you describe your stack?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how Lens should read your AWS infrastructure.
        </p>
      </div>

      <div className="space-y-3">
        {INPUT_METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = selected === method.id;

          if (!method.available) {
            return (
              <div
                key={method.id}
                className="flex items-start gap-4 rounded-xl border bg-card px-5 py-4 opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{method.name}</p>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border bg-muted text-muted-foreground">
                      Soon
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{method.description}</p>
                </div>
              </div>
            );
          }

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              className={cn(
                "w-full flex items-start gap-4 rounded-xl border px-5 py-4 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "bg-card hover:border-muted-foreground/40 hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg shrink-0 mt-0.5 transition-colors",
                isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{method.name}</p>
                  {method.recommended && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{method.description}</p>
              </div>
              {isSelected && (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — IAM Role connect
// ---------------------------------------------------------------------------

const EXTERNAL_ID = "noblinks-lens-dev";

const TRUST_POLICY = JSON.stringify({
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Principal: { AWS: "arn:aws:iam::255653207067:root" },
      Action: "sts:AssumeRole",
      Condition: { StringEquals: { "sts:ExternalId": EXTERNAL_ID } },
    },
  ],
}, null, 2);

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function IamRoleConnect({
  roleArn,
  setRoleArn,
  testStatus,
  onTest,
}: {
  roleArn: string;
  setRoleArn: (v: string) => void;
  testStatus: "idle" | "testing" | "success" | "error";
  onTest: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Connect your AWS account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a read-only IAM role in your AWS account and paste the ARN below. Lens never stores credentials.
        </p>
      </div>

      {/* Step 1 — Trust policy */}
      <div className="space-y-2">
        <p className="text-sm font-medium">1. Create a role with this trust policy</p>
        <div className="relative rounded-lg bg-muted/60 border">
          <div className="absolute top-2.5 right-3">
            <CopyButton text={TRUST_POLICY} />
          </div>
          <pre className="p-4 text-xs leading-relaxed overflow-x-auto text-muted-foreground pr-16">
            {TRUST_POLICY}
          </pre>
        </div>
      </div>

      {/* Step 2 — External ID */}
      <div className="space-y-2">
        <p className="text-sm font-medium">2. Use this External ID in the trust policy condition</p>
        <div className="flex items-center justify-between rounded-lg bg-muted/60 border px-4 py-3">
          <code className="text-sm font-mono">{EXTERNAL_ID}</code>
          <CopyButton text={EXTERNAL_ID} />
        </div>
      </div>

      {/* Step 3 — Attach ReadOnlyAccess */}
      <div className="rounded-lg bg-muted/40 border px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">3. Attach permissions</span>
        {" "}— attach the AWS managed policy{" "}
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">ReadOnlyAccess</code>
        {" "}to the role.
      </div>

      {/* Step 4 — Role ARN input */}
      <div className="space-y-2">
        <Label htmlFor="role-arn">4. Paste your Role ARN</Label>
        <div className="flex gap-2">
          <Input
            id="role-arn"
            placeholder="arn:aws:iam::123456789012:role/your-role-name"
            value={roleArn}
            onChange={(e) => setRoleArn(e.target.value)}
            className="font-mono text-sm"
          />
          <Button
            type="button"
            variant="outline"
            onClick={onTest}
            disabled={!roleArn || testStatus === "testing"}
            className="shrink-0"
          >
            {testStatus === "testing" && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {testStatus === "testing" ? "Testing…" : "Test connection"}
          </Button>
        </div>

        {testStatus === "success" && (
          <p className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" /> Connection successful — Lens can assume this role.
          </p>
        )}
        {testStatus === "error" && (
          <p className="text-sm text-destructive">
            Could not assume the role. Check the trust policy and external ID, then try again.
          </p>
        )}
      </div>
    </div>
  );
}

function FileUploadConnect({ method }: { method: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          Upload your {method === "terraform" ? "Terraform files" : method === "helm" ? "Helm chart" : "CLI export"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {method === "cli_export"
            ? "Run the export command in your environment, then paste the output below."
            : "Upload your IaC files and Lens will map every resource."}
        </p>
      </div>

      {method === "cli_export" ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-muted/60 border px-4 py-3 flex items-center justify-between">
            <code className="text-sm font-mono">npx @noblinks/lens-export</code>
            <CopyButton text="npx @noblinks/lens-export" />
          </div>
          <textarea
            className="w-full h-40 rounded-lg border bg-muted/40 px-4 py-3 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Paste CLI output here…"
          />
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
          <Upload className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Drop files here or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">
            {method === "terraform" ? ".tf files" : method === "helm" ? "Chart.yaml + values.yaml" : ""}
          </p>
          <input type="file" className="hidden" multiple />
        </label>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Running state
// ---------------------------------------------------------------------------

const ANALYSIS_STEPS = [
  "Assuming IAM role…",
  "Enumerating AWS services…",
  "Mapping services to Hetzner equivalents…",
  "Scoring compatibility…",
  "Generating report…",
];

function RunningScreen() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((c) => (c < ANALYSIS_STEPS.length - 1 ? c + 1 : c));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8">
      <div className="relative flex items-center justify-center w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>

      <div className="text-center space-y-2">
        <p className="font-semibold text-lg">Analysing your AWS stack</p>
        <p className="text-sm text-muted-foreground">This takes about 30–60 seconds</p>
      </div>

      <div className="w-full max-w-sm space-y-2">
        {ANALYSIS_STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            {i < current ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            ) : i === current ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
            )}
            <span className={cn("text-sm", i <= current ? "text-foreground" : "text-muted-foreground/50")}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewAnalysisPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedCloud, setSelectedCloud] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [roleArn, setRoleArn] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [running, setRunning] = useState(false);

  async function handleTestConnection() {
    setTestStatus("testing");
    try {
      const res = await fetch("/api/lens/test-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleArn }),
      });
      setTestStatus(res.ok ? "success" : "error");
    } catch {
      setTestStatus("error");
    }
  }

  async function handleRunAnalysis() {
    setRunning(true);
    try {
      const res = await fetch("/api/lens/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCloud: selectedCloud, inputMethod: selectedMethod, roleArn }),
      });
      const data = await res.json() as { id?: string; error?: string };
      if (res.status === 402) {
        router.push("/lens/pricing");
        return;
      }
      if (res.ok && data.id) {
        router.push(`/lens/reports/${data.id}`);
      }
    } catch {
      setRunning(false);
    }
  }

  const canContinue =
    (step === 0 && !!selectedCloud) ||
    (step === 1 && !!selectedMethod) ||
    (step === 2 && selectedMethod === "iam_role" && testStatus === "success") ||
    (step === 2 && selectedMethod !== "iam_role" && !!selectedMethod);

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <PageHeader
        title="New Analysis"
        icon={ScanSearch}
        actions={!running ? <StepIndicator current={step} /> : undefined}
      />

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        {running ? (
          <RunningScreen />
        ) : (
          <>
            {step === 0 && (
              <CloudPicker selected={selectedCloud} onSelect={setSelectedCloud} />
            )}
            {step === 1 && (
              <InputMethodPicker selected={selectedMethod} onSelect={setSelectedMethod} />
            )}
            {step === 2 && selectedMethod === "iam_role" && (
              <IamRoleConnect
                roleArn={roleArn}
                setRoleArn={setRoleArn}
                testStatus={testStatus}
                onTest={handleTestConnection}
              />
            )}
            {step === 2 && selectedMethod !== "iam_role" && selectedMethod !== null && (
              <FileUploadConnect method={selectedMethod} />
            )}
          </>
        )}
      </div>

      {!running && (
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? router.push("/lens") : setStep((s) => s - 1))}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          <Button
            disabled={!canContinue}
            onClick={() => step === 2 ? handleRunAnalysis() : setStep((s) => s + 1)}
          >
            {step === 2 ? "Run Analysis" : "Continue"}
          </Button>
        </div>
      )}
    </div>
  );
}
