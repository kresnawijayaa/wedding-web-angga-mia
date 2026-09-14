# Pre-deployment interface audit

Date: 14 September 2026  
Scope: public access gate, invitation, RSVP/wishes, and admin interface

## Anti-pattern verdict

**Pass.** The invitation does not read as a generic AI wedding template. Its photography-led editorial composition, restrained earth palette, asymmetry, and typography align with the established “A Life Made Together” direction. It avoids floral-template styling, glassmorphism, neon gradients, repetitive card grids, and decorative metric patterns.

## Executive summary

- Overall score: **82/100 — strong design, not yet release-ready**
- Findings: **1 critical, 4 high, 5 medium, 3 low**
- Primary release blockers: dummy bank details, incomplete background music, and incomplete keyboard focus coverage.
- Source encoding is valid UTF-8. The `Â`/`â€¦` sequences seen in PowerShell are a terminal display issue, not corrupted application copy.

## Critical

### 1. Dummy bank details are exposed in the guest-facing invitation

- Location: `components/wedding-invitation.tsx`, wedding gift section
- Category: Content integrity / safety
- Impact: A guest could treat the dummy account numbers as genuine payment instructions. This is unsafe to publish under a real domain.
- Recommendation: hide the transfer controls until both verified bank details are supplied, or clearly replace the section with a non-actionable “details will follow” message.
- Suggested command: `/harden`

## High

### 2. Background music is not implemented

- Location: `components/wedding-invitation.tsx`; orphaned `.music` rules in `app/globals.css` and `app/fixes.css`
- Category: Functionality
- Impact: The visible behavior discussed during review is absent from the current component. Shipping now would omit an expected part of the invitation experience.
- Recommendation: add the final licensed/local audio asset, accessible play/pause control, user-initiated playback, and failure fallback. Do not autoplay with sound before user interaction.
- Suggested command: `/harden`, then `/polish`

### 3. Keyboard focus treatment is incomplete

- Location: event/map links, calendar link, bank copy buttons, FAQ summaries, and most admin links/buttons
- Category: Accessibility
- Impact: Keyboard users can lose track of focus. This conflicts with WCAG 2.4.7 and the project’s “accessible elegance” principle.
- Recommendation: add a consistent `:focus-visible` token and apply it to every interactive element; retain the existing specialized radio focus treatment.
- Suggested command: `/normalize`

### 4. Several mobile interaction targets are below 44×44 CSS pixels

- Location: map links, calendar link, bank copy buttons, admin text actions and pagination
- Category: Responsive / accessibility
- Impact: Small links are difficult to tap reliably on phones, the primary device for guests. Relevant guidance: WCAG 2.5.8.
- Recommendation: enlarge the clickable area through padding/min-block-size without visually turning every action into a primary button.
- Suggested command: `/adapt`

### 5. Placeholder parent names remain visible

- Location: `components/wedding-invitation.tsx`, bride and groom section
- Category: Content integrity
- Impact: `[Nama Ayah]` and `[Nama Ibu]` make the otherwise polished invitation visibly unfinished.
- Recommendation: omit the parent copy until approved names arrive; preserve the couple section and its visual balance.
- Suggested command: `/harden`

## Medium

### 6. Clipboard operations have no failure path

- Location: bank copy controls and `components/copy-invitation-link.tsx`
- Category: Resilience / accessibility
- Impact: Clipboard access may fail outside a secure context or due to browser permission, while the interface provides no feedback.
- Recommendation: catch failures and expose a selectable fallback plus an `aria-live` status message.
- Suggested command: `/harden`

### 7. Document language does not describe all content

- Location: `app/layout.tsx` (`lang="en"`), while access and event copy include Indonesian
- Category: Accessibility / i18n
- Impact: Screen-reader pronunciation can be incorrect for Indonesian passages. WCAG 3.1.2 applies to changes in language.
- Recommendation: choose the dominant final language and mark passages in the other language with `lang` attributes. A fully bilingual strategy should be explicit rather than incidental.
- Suggested command: `/clarify`

### 8. Body-wide hydration warning suppression is overly broad

- Location: `app/layout.tsx`
- Category: Resilience
- Impact: Genuine hydration defects can be hidden during development, making regressions harder to detect.
- Recommendation: remove suppression from `<body>` and isolate it only around a verified extension-mutated node if still necessary.
- Suggested command: `/harden`

### 9. The invitation has substantial photographic payload

- Location: `public/images` and gallery; source assets total about **5.23 MB**
- Category: Performance
- Impact: Next/Image and lazy loading mitigate transfer size, but a long gallery can still consume noticeable bandwidth and decoding memory on mid-range phones.
- Recommendation: verify rendered AVIF/WebP transfer sizes under mobile throttling and reduce `quality={90}` selectively for below-fold photos if visual comparison shows no material loss.
- Suggested command: `/optimize`

### 10. Admin action failures can be silent

- Location: `updateGuest`, `toggleGuest`, and moderation server actions
- Category: Resilience / UX
- Impact: Invalid data or database failures may leave an administrator unsure whether a change succeeded.
- Recommendation: return typed action states and show inline success/error feedback for all mutations.
- Suggested command: `/harden`

## Low

### 11. Countdown has no explicit accessible label

- Location: `Countdown` in `components/wedding-invitation.tsx`
- Impact: The four values are understandable visually but lack a concise group description for assistive technology.
- Recommendation: give the group a label and use singular/plural-friendly accessible text.

### 12. RSVP success replaces the editing interface

- Location: RSVP section
- Impact: Guests wishing to immediately correct a submission must refresh or revisit the page.
- Recommendation: retain a small “change response” action after success.

### 13. CSS architecture contains duplicated/overridden rules

- Location: `app/globals.css` plus `app/fixes.css`
- Impact: Correctness currently holds, but later maintenance can accidentally revive obsolete crops or layout rules.
- Recommendation: consolidate verified overrides into component-oriented sections before long-term maintenance.

## Positive findings

- Distinctive, coherent visual direction with strong photo sequencing.
- Responsive overflow protection is present and the earlier horizontal-scroll regression is addressed.
- Reduced-motion preferences are respected in both CSS and Motion components.
- Images have descriptive alternative text, responsive `sizes`, and appropriate lazy behavior below the fold.
- Forms use semantic labels, fieldsets, legends, validation limits, pending states, and live error messaging.
- RSVP seats are constrained both in the UI and on the server.
- Private routes use signed HTTP-only sessions, no-store caching, rate limiting, and indexing exclusions.
- Production build, TypeScript, migration, and HTTP header checks previously passed.

## Recommended order

1. Remove or hide unverified bank and parent data.
2. Add the final MP3 and accessible music control.
3. Complete focus styles and mobile target sizing.
4. Add clipboard/admin mutation error states and narrow hydration suppression.
5. Run mobile network and visual regression checks, then deploy a preview build.
