## 2026-10-06 - Added ARIA labels to transport controls
**Learning:** Icon-only and icon+text control buttons throughout the app correctly implement `title` tooltips for visual users but often omit the corresponding `aria-label` for screen readers, leading to a degraded accessible experience.
**Action:** When adding `title` tooltips to interactive elements (especially buttons without plain text content like "Stop"), always implement an equivalent `aria-label`.
