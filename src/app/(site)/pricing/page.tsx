"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { CheckoutButton } from "@/components/product/checkout-button";
import { Button } from "@/components/ui/button";

type Billing = "monthly" | "annual";

const plans = [
  {
    name: "Free",
    monthly: { price: "$0", period: "forever", slug: null },
    annual: { price: "$0", period: "forever", slug: null },
    description: "Get started with core monitoring for small setups.",
    cta: "Start for free",
    ctaHref: null,
    highlighted: false,
    features: [
      { text: "Up to 3 machines", included: true },
      { text: "5 active alerts", included: true },
      { text: "3 dashboards", included: true },
      { text: "24-hour metric retention", included: true },
      { text: "Email notifications", included: true },
      { text: "AI-guided incident assistant", included: false },
      { text: "Slack notifications", included: false },
      { text: "Dashboard sharing", included: false },
      { text: "Team members", included: false },
    ],
  },
  {
    name: "Pro",
    monthly: { price: "$29", period: "per month", slug: "pro" },
    annual: { price: "$23", period: "per month, billed annually", slug: "pro-annual" },
    description: "Everything you need for a production environment.",
    cta: "Get started",
    ctaHref: null,
    highlighted: true,
    features: [
      { text: "Up to 20 machines", included: true },
      { text: "Unlimited active alerts", included: true },
      { text: "Unlimited dashboards", included: true },
      { text: "30-day metric retention", included: true },
      { text: "Email notifications", included: true },
      { text: "AI-guided incident assistant", included: true },
      { text: "Slack notifications", included: true },
      { text: "Dashboard sharing", included: true },
      { text: "Up to 5 team members", included: true },
    ],
  },
  {
    name: "Team",
    monthly: { price: "$89", period: "per month", slug: "team" },
    annual: { price: "$71", period: "per month, billed annually", slug: "team-annual" },
    description: "For growing teams with multiple environments.",
    cta: "Get started",
    ctaHref: null,
    highlighted: false,
    features: [
      { text: "Unlimited machines", included: true },
      { text: "Unlimited active alerts", included: true },
      { text: "Unlimited dashboards", included: true },
      { text: "90-day metric retention", included: true },
      { text: "Email notifications", included: true },
      { text: "AI-guided incident assistant", included: true },
      { text: "Slack & webhook notifications", included: true },
      { text: "Dashboard sharing", included: true },
      { text: "Unlimited team members", included: true },
    ],
  },
];

const faqs = [
  {
    q: "Can I change plans later?",
    a: "Yes. You can upgrade or downgrade at any time. Changes take effect immediately and are prorated.",
  },
  {
    q: "What counts as a machine?",
    a: "Any Linux host running the Noblinks agent — whether a VM, bare-metal server, or container host.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "Pro and Team plans come with a 14-day free trial. No credit card required to start.",
  },
  {
    q: "How does metric retention work?",
    a: "Metric samples are stored for the duration of your plan. Older data is automatically pruned by our daily cleanup job.",
  },
  {
    q: "Do you offer annual billing?",
    a: "Yes — annual billing saves you 20% compared to monthly. Toggle to annual above to see the discounted prices.",
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <div className="flex-1 container mx-auto px-4 py-16 space-y-24">
      {/* Header */}
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight">Simple, honest pricing</h1>
        <p className="text-lg text-muted-foreground">
          Start free, scale when you need to. No surprise charges, no hidden limits.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 rounded-lg border p-1 text-sm">
          <button
            onClick={() => setBilling("monthly")}
            className={`rounded-md px-4 py-1.5 font-medium transition-colors ${
              billing === "monthly"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`rounded-md px-4 py-1.5 font-medium transition-colors ${
              billing === "annual"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annual
            <span className="ml-1.5 rounded-full bg-green-500/15 px-1.5 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400">
              −20%
            </span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const tier = billing === "annual" ? plan.annual : plan.monthly;
          return (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 flex flex-col gap-6 ${
                plan.highlighted
                  ? "border-primary shadow-lg shadow-primary/10 bg-primary/5"
                  : ""
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
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-sm text-muted-foreground mb-1">/ {tier.period}</span>
              </div>

              {tier.slug ? (
                <CheckoutButton
                  slug={tier.slug}
                  label={plan.cta}
                  variant={plan.highlighted ? "default" : "outline"}
                  className="w-full"
                />
              ) : plan.ctaHref ? (
                <Button
                  asChild
                  variant={plan.highlighted ? "default" : "outline"}
                  className="w-full"
                >
                  <Link href={plan.ctaHref}>{plan.cta}</Link>
                </Button>
              ) : (
                <Button
                  disabled
                  variant={plan.highlighted ? "default" : "outline"}
                  className="w-full"
                >
                  {plan.cta}
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
                    <span className={f.included ? "" : "text-muted-foreground/60"}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto space-y-8">
        <h2 className="text-2xl font-semibold text-center">Frequently asked questions</h2>
        <dl className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="space-y-2">
              <dt className="font-medium">{faq.q}</dt>
              <dd className="text-sm text-muted-foreground">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Bottom CTA */}
      <div className="text-center space-y-4 max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold">Still have questions?</h2>
        <p className="text-muted-foreground text-sm">
          We&apos;re happy to walk you through any plan or help you figure out what fits your infrastructure.
        </p>
        <Button variant="outline" asChild>
          <Link href="mailto:hello@noblinks.com">Contact us</Link>
        </Button>
      </div>
    </div>
  );
}
