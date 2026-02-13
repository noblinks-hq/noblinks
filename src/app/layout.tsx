import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Noblinks",
    template: "%s | Noblinks",
  },
  description:
    "Noblinks is an AI on-call engineer that helps you monitor, debug, and fix infrastructure in one place.",
  keywords: [
    "Noblinks",
    "monitoring",
    "on-call",
    "AI",
    "infrastructure",
    "alerts",
    "incident response",
    "DevOps",
  ],
  authors: [{ name: "Leon van Zyl" }],
  creator: "Leon van Zyl",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Noblinks",
    title: "Noblinks",
    description:
      "Noblinks is an AI on-call engineer that helps you monitor, debug, and fix infrastructure in one place.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noblinks",
    description:
      "Noblinks is an AI on-call engineer that helps you monitor, debug, and fix infrastructure in one place.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Noblinks",
  description:
    "Noblinks is an AI on-call engineer that helps you monitor, debug, and fix infrastructure in one place.",
  applicationCategory: "Monitoring",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "Leon van Zyl",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
