import Link from "next/link";
import { Activity } from "lucide-react";

const footerLinks = [
  {
    heading: "Product",
    links: [
      { label: "Overview", href: "/overview" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
      { label: "Roadmap", href: "/roadmap" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "https://docs.noblinks.com" },
      { label: "Agent install", href: "/docs/agent" },
      { label: "Integrations", href: "/integrations" },
      { label: "Status", href: "https://status.noblinks.com" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "mailto:hello@noblinks.com" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Security", href: "/security" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-700 text-white">
                <Activity className="h-3.5 w-3.5" />
              </div>
              <span className="font-bold tracking-tight">Noblinks</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px]">
              AI on-call engineer for your infrastructure. From alert to fix, no context switching.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              All systems operational
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map(({ heading, links }) => (
            <div key={heading} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{heading}</p>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Noblinks, Inc. All rights reserved.</p>
          <p>Made with care for engineers who hate waking up at 3am.</p>
        </div>
      </div>
    </footer>
  );
}
