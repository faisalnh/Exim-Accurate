## 2024-05-23 - [Destructive Action Feedback]
**Learning:** Users lack confidence when clicking destructive actions (like delete) without immediate visual feedback. Adding a specific loading state for the item being deleted prevents "rage clicking" and assures the user the system is working.
**Action:** Always verify delete actions have a loading state, especially in lists/tables where multiple items exist.

## 2026-02-04 - [Consistent Empty States]
**Learning:** Replacing plain text empty states with visually rich components significantly improves the perceived quality of the application and provides clearer calls to action.
**Action:** Always check for empty states in lists/tables and use the `EmptyState` component instead of plain text.

## 2024-05-24 - [Accessible Icon-only Buttons]
**Learning:** Widespread use of `ActionIcon` components without `aria-label` attributes renders the UI completely inaccessible for screen reader users, especially in critical flows like the Kiosk checkout and dashboard management.
**Action:** Always add descriptive, localized `aria-label` props to any icon-only button to ensure full accessibility and compliance with WCAG standards.
