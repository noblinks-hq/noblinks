# Landing Page Conversion — Implementation Plan

## Summary

Convert the boilerplate landing page into the Noblinks product landing page across 4 files. No routing, auth, database, or backend changes.

---

## Phase 1: Landing Page Content (`src/app/page.tsx`)

This is the primary file and largest change. The entire page body is rewritten.

### 1.1 — Clean Up Imports
- [x] Remove unused icon imports: `Video`, `Shield`, `Database`, `Palette`
- [x] Remove `SetupChecklist` import from `@/components/setup-checklist`
- [x] Remove `StarterPromptModal` import from `@/components/starter-prompt-modal`
- [x] Remove `useDiagnostics` import from `@/hooks/use-diagnostics`
- [x] Add new icon imports: `MessageSquare`, `Bell`, `Terminal`, `Sparkles` from `lucide-react`
- [x] Keep `Link` from `next/link` and `Button` from `@/components/ui/button`
- [x] Remove `"use client"` directive (no longer needed without `useDiagnostics` hook)

### 1.2 — Rewrite Hero Section
- [x] Replace h1 content from "Starter Kit" to "Noblinks" (keep gradient text styling)
- [x] Remove the Bot icon box that preceded the heading
- [x] Replace h2 from "Complete Boilerplate for AI Applications" to "From alert to fix. No context switching."
- [x] Replace description paragraph with specified Noblinks copy
- [x] Remove the entire YouTube tutorial video section (`{/* YouTube Tutorial Video */}` block)

### 1.3 — Replace Feature Cards
- [x] Replace card 1: `MessageSquare` icon, title "Monitoring by Conversation", description "Describe what you want to monitor in plain English. Noblinks sets it up automatically."
- [x] Replace card 2: `Bell` icon, title "Alerts With Context", description "Alerts explain what changed and why — not just that something broke."
- [x] Replace card 3: `Terminal` icon, title "Embedded Terminal", description "Debug issues directly inside Noblinks without switching to SSH."
- [x] Replace card 4: `Sparkles` icon, title "AI-Guided Fixes", description "The AI suggests checks and commands and helps resolve incidents step by step."
- [x] Keep existing grid layout: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`
- [x] Keep existing card styling: `p-6 border rounded-lg`

### 1.4 — Replace "Next Steps" with "How Noblinks Works"
- [x] Remove the `<SetupChecklist />` component call
- [x] Replace section heading from "Next Steps" to "How Noblinks Works"
- [x] Replace the 4 setup instruction cards with 4 plain-text step cards:
  - Step 1: "Install the Noblinks agent on your VM"
  - Step 2: "Ask Noblinks what you want to monitor"
  - Step 3: "Get alerted when something breaks"
  - Step 4: "Fix it with AI guidance — in one screen"
- [x] Remove all code snippets, env variable references, and `<code>` blocks
- [x] Remove the `<StarterPromptModal />` component call
- [x] Remove conditional logic that used `isAuthReady` / `isAiReady` / `loading`
- [x] Keep the 2-column grid layout: `grid grid-cols-1 md:grid-cols-2 gap-4`

### 1.5 — Add CTA Section
- [x] Add a new section below "How Noblinks Works" with centered layout
- [x] Add primary `Button`: text "Get Early Access", default variant, size `lg`
- [x] Add secondary `Button`: text "View Dashboard", `outline` variant, wrapped in `Link` to `/dashboard`
- [x] Use `flex` layout with gap for button spacing

### 1.6 — Remove Component Function Boilerplate
- [x] Remove `useDiagnostics()` hook call and its destructured variables
- [x] Simplify the component to a plain function (no client-side state)

---

## Phase 2: Metadata and SEO (`src/app/layout.tsx`)

### 2.1 — Update Metadata Object
- [ ] Change `title.default` from "Agentic Coding Boilerplate" to "Noblinks"
- [ ] Change `title.template` from "%s | Agentic Coding Boilerplate" to "%s | Noblinks"
- [ ] Update `description` to: "Noblinks is an AI on-call engineer that helps you monitor, debug, and fix infrastructure in one place."
- [ ] Update `keywords` array to: `["Noblinks", "monitoring", "on-call", "AI", "infrastructure", "alerts", "incident response", "DevOps"]`
- [ ] Update `openGraph.siteName` to "Noblinks"
- [ ] Update `openGraph.title` to "Noblinks"
- [ ] Update `openGraph.description` to match the new description
- [ ] Update `twitter.title` to "Noblinks"
- [ ] Update `twitter.description` to match the new description

### 2.2 — Update JSON-LD Structured Data
- [ ] Change `name` from "Agentic Coding Boilerplate" to "Noblinks"
- [ ] Update `description` to match the new description
- [ ] Change `applicationCategory` from "DeveloperApplication" to "Monitoring"

---

## Phase 3: Site Header (`src/components/site-header.tsx`)

### 3.1 — Update Branding Text
- [ ] Replace the text "Starter Kit" with "Noblinks" in the `<span>` element
- [ ] Update `aria-label` from "Starter Kit - Go to homepage" to "Noblinks - Go to homepage"

### 3.2 — Preserve Existing Structure
- [ ] Keep the `Bot` icon and its wrapper div unchanged
- [ ] Keep the `UserProfile` and `ModeToggle` components unchanged
- [ ] Keep the skip-to-content accessibility link unchanged

---

## Phase 4: Site Footer (`src/components/site-footer.tsx`)

### 4.1 — Update Footer Content
- [ ] Remove the `GitHubStars` import and component usage
- [ ] Replace the attribution paragraph with "Built by Noblinks"
- [ ] Keep the existing footer layout and styling (`border-t py-6 text-center text-sm text-muted-foreground`)

---

## Phase 5: Verification

### 5.1 — Build Checks
- [ ] Run `pnpm run lint` — confirm zero errors
- [ ] Run `pnpm run typecheck` — confirm zero errors

### 5.2 — Visual Review
- [ ] Landing page displays new Noblinks hero, features, steps, and CTA
- [ ] No references to "Starter Kit", "Boilerplate", or "AI Applications" visible anywhere
- [ ] Header shows "Noblinks"
- [ ] Footer shows "Built by Noblinks"
- [ ] Dark mode toggle works and page renders correctly in both themes
- [ ] Page is responsive at mobile, tablet, and desktop widths

### 5.3 — Navigation
- [ ] "View Dashboard" CTA links to `/dashboard`
- [ ] Header logo links to `/`
- [ ] Auth-gated routes (`/dashboard`, `/chat`) remain accessible
