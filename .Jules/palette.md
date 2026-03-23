## 2024-05-23 - [Destructive Action Feedback]
**Learning:** Users lack confidence when clicking destructive actions (like delete) without immediate visual feedback. Adding a specific loading state for the item being deleted prevents "rage clicking" and assures the user the system is working.
**Action:** Always verify delete actions have a loading state, especially in lists/tables where multiple items exist.

## 2026-02-04 - [Consistent Empty States]
**Learning:** Replacing plain text empty states with visually rich components significantly improves the perceived quality of the application and provides clearer calls to action.
**Action:** Always check for empty states in lists/tables and use the `EmptyState` component instead of plain text.

## 2026-02-04 - [Accessible Icon-Only Buttons in Kiosk Mode]
**Learning:** Icon-only buttons (like `ActionIcon` from Mantine) used in specialized interfaces such as the Kiosk mode require explicit ARIA labels. Screen reader users cannot rely on visual context (icons) alone, and these labels must be localized since the interface supports multiple languages.
**Action:** Always provide localized `aria-label` attributes to any icon-only button to ensure full accessibility across all supported languages.
