# Together Forever — Design Guide

This document is the implementation contract for the invitation and its admin workspace. New UI is not complete until it satisfies the relevant rules and the verification checklist below.

## 1. Product modes

### Invitation

- Audience: invited family, friends, and colleagues opening a personal link primarily from WhatsApp on a phone.
- Character: warm, intimate, editorial, quietly premium.
- Visual lead: lifestyle photography, Playfair Display for expressive headings, Instrument Sans for functional text.
- Principle: photography and personal information come before decoration.

### Admin workspace

- Audience: the couple managing hundreds of guests, often from a phone.
- Character: calm, practical, compact, and unmistakably interactive.
- Visual lead: Instrument Sans, neutral surfaces, restrained green for primary actions and WhatsApp actions.
- Principle: operational speed comes before matching the invitation’s editorial expression.

## 2. Shared foundations

### Color

- Invitation paper: `#f1ebdf`; ink: `#252a22`.
- Admin background: `#f2f4f3`; surface: `#ffffff`; soft surface: `#f7f8f7`.
- Admin text: `#1d2521`; muted text: `#66716b`; border: `#dce1de`.
- Primary admin action: `#196b4b`; hover: `#11543a`; text on primary action: `#f7fbf8`.
- Destructive actions use muted red only where the consequence is destructive.
- Components must consume tokens from an ancestor available on every relevant route. Never reference a custom property scoped only to a sibling page.

### Typography

- Display/editorial headings: Playfair Display Variable.
- Controls, labels, tables, status, and admin headings: Instrument Sans Variable.
- Mobile input text is at least 16px to prevent browser zoom.
- Operational UI labels may be compact, but critical values and actions must remain immediately readable.

### Spacing and shape

- Base spacing rhythm: 4, 8, 12, 16, 24, 32px.
- Admin controls use 8px radius; grouped surfaces use 10–12px radius.
- Avoid nested decorative cards. A border or spacing change should communicate hierarchy before a shadow does.
- Shadows are reserved for overlays; routine admin cards remain flat.

## 3. Interaction rules

- Interface icons use `lucide-react` with consistent stroke weight. Never use emoji or Unicode arrows as control icons because their appearance varies by platform.
- Every primary action contains visible text in its default, loading, disabled, focus, and error states.
- Touch targets are at least 44×44px.
- Primary actions use filled green; secondary actions use a bordered neutral surface; destructive actions are never visually confused with primary actions.
- Inputs always have visible labels. Errors explain what needs to change.
- PIN/password fields provide an explicit Show/Hide control, preserve the input value, and expose `aria-pressed` and a changing accessible label.
- Focus indicators must remain visible; keyboard order follows visual order.
- Critical actions must stay in normal document flow. Fixed action bars are used only when the workflow genuinely requires persistent controls and have verified safe-area behavior.

## 4. Responsive behavior

- Mobile is the primary canvas at 320–480px wide.
- Do not hide critical functionality on mobile.
- Do not rely on `100vh`; prefer `svh`/`dvh` with safe-area insets where appropriate.
- Login must display heading, fields, Show/Hide, error state, and Sign in without horizontal scrolling. On short screens the page may scroll naturally.
- Guest rows prioritize name, RSVP state, invitation code, WhatsApp, and copy link. Secondary actions use progressive disclosure.
- Desktop layouts may expand horizontally but retain the same action hierarchy.

## 5. Component contracts

### Admin login

- A single-column mobile flow; no fixed submit button.
- Submit appears directly after the PIN field and is full-width on mobile.
- PIN accepts exactly four numeric characters and opens the numeric keyboard.
- Submit has an explicit foreground and background fallback so a missing token cannot make it invisible.

### Guest management

- At most 20 guests per page unless virtualized.
- Mobile guest entries remain compact when collapsed.
- Six-letter invitation codes remain visible without opening secondary actions.
- WhatsApp and Copy link are primary row actions; edit, disable, regenerate, open, and delete are secondary.

### Dialogs

- Use only for focused editing that benefits from previewing without losing list position.
- Escape and backdrop click close the dialog; a visible Close control is mandatory.
- Content scrolls inside the dialog and respects mobile safe areas.

## 6. Definition of done

Before deployment, verify:

- Production build and TypeScript pass.
- 320, 375, 390, 430, 768, 1024, and 1440px widths have no horizontal overflow.
- Mobile Safari safe areas do not cover controls.
- All buttons have visible labels and at least 44px touch targets.
- Long guest names wrap without moving critical actions off-screen.
- Default, loading, disabled, success, and error states remain legible.
- Keyboard focus and screen-reader labels are present.
- No component references an undefined design token.
- Invitation assets are optimized and do not create avoidable layout shifts.
