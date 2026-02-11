# Landing Page Conversion — Requirements

## Overview

Convert the existing boilerplate landing page into a product landing page for **Noblinks**, an AI on-call engineer that helps users go from alert to understanding to fix without switching tools.

**Target audience:** Engineers (DevOps, SRE, backend, platform).

---

## Functional Requirements

### FR-1: Hero Section

- Display the product name **"Noblinks"** as the primary heading (h1).
- Display the tagline **"From alert to fix. No context switching."** as a secondary heading (h2).
- Display a description paragraph (2–3 lines max):
  > Noblinks is an AI on-call engineer that helps you monitor, debug, and fix infrastructure in one place. Tell it what you want to watch — it creates the dashboards, alerts, and guides you through the fix.
- Remove the Bot icon box that preceded the old heading. The heading should stand on its own with gradient styling.
- Remove the YouTube tutorial video section entirely.

### FR-2: Feature Cards

Replace the existing 4 feature cards with the following, preserving the same grid layout and card styling:

| # | Title                        | Description                                                                                  | Icon            |
|---|------------------------------|----------------------------------------------------------------------------------------------|-----------------|
| 1 | Monitoring by Conversation   | Describe what you want to monitor in plain English. Noblinks sets it up automatically.       | `MessageSquare` |
| 2 | Alerts With Context          | Alerts explain what changed and why — not just that something broke.                         | `Bell`          |
| 3 | Embedded Terminal            | Debug issues directly inside Noblinks without switching to SSH.                               | `Terminal`      |
| 4 | AI-Guided Fixes              | The AI suggests checks and commands and helps resolve incidents step by step.                 | `Sparkles`      |

### FR-3: "How Noblinks Works" Section

Replace the "Next Steps" setup/checklist section with a new section:

- Section title: **"How Noblinks Works"**
- 4 numbered steps displayed in the same 2-column grid layout:
  1. Install the Noblinks agent on your VM
  2. Ask Noblinks what you want to monitor
  3. Get alerted when something breaks
  4. Fix it with AI guidance — in one screen
- No code snippets, no configuration details, no technical setup instructions.
- Remove the `SetupChecklist` component entirely from the page.
- Remove the `StarterPromptModal` component entirely from the page.

### FR-4: CTA Section

- Add a CTA block below the "How Noblinks Works" section.
- **Primary CTA button:** "Get Early Access" — no link target required at this stage (can be `#` or no-op).
- **Secondary CTA button:** "View Dashboard" — links to `/dashboard` (existing auth-gated route).
- Tone should feel early-stage and understated, not salesy.

### FR-5: Site Header Branding

- Replace **"Starter Kit"** with **"Noblinks"** in the site header logo text.
- Update the associated `aria-label` to reference Noblinks.
- Keep the existing header layout, `UserProfile` component, and `ModeToggle` unchanged.

### FR-6: Site Footer Branding

- Replace the boilerplate attribution text with **"Built by Noblinks"**.
- Remove the `GitHubStars` component referencing the boilerplate repository.

### FR-7: Metadata and SEO

- Update `<title>` to **"Noblinks"** (default) with template **"%s | Noblinks"**.
- Update `<meta name="description">` to reflect the Noblinks product description.
- Update keywords to: `monitoring`, `on-call`, `AI`, `infrastructure`, `alerts`, `incident response`, `DevOps`.
- Update OpenGraph and Twitter card metadata (title, description, siteName).
- Update JSON-LD structured data (name, description, applicationCategory).

---

## Non-Functional Requirements

### NFR-1: No Routing Changes

All existing routes must remain functional and unchanged: `/`, `/dashboard`, `/chat`, `/profile`, and all auth routes (`/login`, `/register`, `/forgot-password`, `/reset-password`).

### NFR-2: No Backend Changes

Do not modify API routes, database schema, authentication logic, or any server-side code.

### NFR-3: Reuse Existing Components and Styling

- Reuse existing `Button` component from `@/components/ui/button`.
- Reuse existing Tailwind CSS utility classes and color tokens (`text-primary`, `text-muted-foreground`, `bg-primary/10`, gradient classes).
- Reuse existing grid layout patterns (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`).
- Icons must come from `lucide-react` (already installed).

### NFR-4: Dark Mode Support

All changes must render correctly in both light and dark modes using the existing `next-themes` setup and CSS variable system.

### NFR-5: Responsive Design

The landing page must remain fully responsive across mobile, tablet, and desktop breakpoints using the existing Tailwind responsive prefixes.

### NFR-6: Accessibility

- Maintain semantic HTML structure (proper heading hierarchy, landmarks).
- All interactive elements must be keyboard-accessible.
- Preserve the existing skip-to-content link in the header.

### NFR-7: Content Constraints

- Do NOT introduce Kubernetes, auto-healing, or enterprise language.
- Do NOT add pricing sections.
- Do NOT add screenshots or images.
- Keep tone calm, confident, and engineer-friendly throughout.

### NFR-8: Build Integrity

The project must pass `pnpm run lint` and `pnpm run typecheck` after all changes.

---

## Acceptance Criteria

### Hero Section
- [ ] h1 displays "Noblinks" with gradient text styling.
- [ ] h2 displays "From alert to fix. No context switching."
- [ ] Description paragraph matches the specified copy (2–3 lines).
- [ ] YouTube video tutorial section is removed.
- [ ] No references to "Starter Kit", "Boilerplate", or "AI Applications" remain on the page.

### Feature Cards
- [ ] Exactly 4 feature cards are displayed in the existing grid layout.
- [ ] Each card has the correct title, description, and lucide-react icon.
- [ ] Card styling matches the existing `p-6 border rounded-lg` pattern.

### How Noblinks Works
- [ ] Section title reads "How Noblinks Works".
- [ ] 4 numbered steps are displayed with the specified copy.
- [ ] No code snippets, config examples, or env variable references appear.
- [ ] `SetupChecklist` component is no longer rendered on the page.
- [ ] `StarterPromptModal` component is no longer rendered on the page.

### CTA Section
- [ ] "Get Early Access" button is visible as primary CTA.
- [ ] "View Dashboard" button is visible as secondary CTA linking to `/dashboard`.
- [ ] No references to "Starter Prompt", "Try boilerplate", or similar boilerplate CTAs remain.

### Header and Footer
- [ ] Site header displays "Noblinks" instead of "Starter Kit".
- [ ] Site footer displays "Built by Noblinks" without the GitHub stars widget.

### Metadata
- [ ] Page title in browser tab reads "Noblinks".
- [ ] OpenGraph title and description reference Noblinks.
- [ ] JSON-LD structured data references Noblinks.

### Cross-Cutting
- [ ] Dark mode renders correctly with no visual regressions.
- [ ] Page is responsive at mobile (< 640px), tablet (640–1024px), and desktop (> 1024px).
- [ ] `/dashboard` and `/chat` links remain functional.
- [ ] `pnpm run lint` passes with no errors.
- [ ] `pnpm run typecheck` passes with no errors.
