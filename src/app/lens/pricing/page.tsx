"use client";

import Link from "next/link";
import { Check, Minus, ScanSearch } from "lucide-react";
import { CheckoutButton } from "@/components/product/checkout-button";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/product/page-header";

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    slug: null,
    description: "One analysis per month to evaluate Lens.",
    highlighted: false,
    features: [
      { text: "1 analysis per month", included: true },
      { text: "IAM role input only", included: true },
      { text: "Hetzner target cloud", included: true },
      { text: "Basic compatibility report", included: true },
      { text: "AI executive summary", included: false },
      { text: "Terraform / Helm upload", included: false },
      { text: "Multi-cloud comparison", included: false },
      { text: "PDF export", included: false },
      { text: "Team access", included: false },
    ],
  },
  {
    name: "Starter",
    price: "€49",
    period: "per month",
    slug: "lens-starter",
    description: "For teams actively evaluating a migration.",
    highlighted: true,
    features: [
      { text: "5 analyses per month", included: true },
      { text: "All input methods (IAM, Terraform, Helm)", included: true },
      { text: "Hetzner + 1 additional cloud", included: true },
      { text: "Full compatibility report", included: true },
      { text: "AI executive summary", included: true },
      { text: "PDF export", included: true },
      { text: "2 team seats", included: true },
      { text: "Multi-cloud comparison", included: false },
      { text: "Drift detection", included: false },
    ],
  },
  {
    name: "Growth",
    price: "€149",
    period: "per month",
    slug: "lens-growth",
    description: "For scale-ups running multiple environments.",
    highlighted: false,
    features: [
      { text: "20 analyses per month", included: true },
      { text: "All input methods", included: true },
      { text: "All 6 sovereign clouds", included: true },
      { text: "Multi-cloud comparison report", included: true },
      { text: "Full AI layer (summary + gap explanations + priority plan)", included: true },
      { text: "Drift detection & alerts", included: true },
      { text: "10 team seats", included: true },
      { text: "Rule violations panel", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

export default function LensPricingPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 py-4">
      <PageHeader
        title="Lens Pricing"
        icon={ScanSearch}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/lens">Back to Lens</Link>
          </Button>
        }
      />

      <div className="text-center space-y-2 max-w-xl mx-auto">
        <p className="text-muted-foreground text-sm">
          A company spending €15k/month on AWS can save €10k/month on Hetzner.
          Lens tells you what will work and what will break — in 60 seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border p-8 flex flex-col gap-6 ${
              plan.highlighted
                ? "border-primary shadow-lg shadow-primary/10 bg-primary/5"
                : "bg-card"
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                Most popular
              </span>
            )}

            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>

            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-sm text-muted-foreground mb-1">/ {plan.period}</span>
            </div>

            {plan.slug ? (
              <CheckoutButton
                slug={plan.slug}
                label="Get started"
                variant={plan.highlighted ? "default" : "outline"}
                className="w-full"
              />
            ) : (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/lens/analyze">Start for free</Link>
              </Button>
            )}

            <ul className="space-y-3">
              {plan.features.map((f) => (
                <li key={f.text} className="flex items-start gap-3 text-sm">
                  {f.included ? (
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  ) : (
                    <Minus className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/50" />
                  )}
                  <span className={f.included ? "" : "text-muted-foreground/60"}>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6 text-center space-y-3">
        <p className="font-semibold">Need more than 20 analyses or multi-account discovery?</p>
        <p className="text-sm text-muted-foreground">
          Enterprise plans include unlimited analyses, CLI export mode (no IAM role required),
          SSO, audit logs, and a custom DPA for GDPR compliance.
        </p>
        <Button variant="outline" asChild>
          <Link href="mailto:hello@noblinks.com">Talk to us</Link>
        </Button>
      </div>
    </div>
  );
}
