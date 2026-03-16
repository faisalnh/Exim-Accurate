## 2024-05-23 - [Destructive Action Feedback]
**Learning:** Users lack confidence when clicking destructive actions (like delete) without immediate visual feedback. Adding a specific loading state for the item being deleted prevents "rage clicking" and assures the user the system is working.
**Action:** Always verify delete actions have a loading state, especially in lists/tables where multiple items exist.

## 2026-02-04 - [Consistent Empty States]
**Learning:** Replacing plain text empty states with visually rich components significantly improves the perceived quality of the application and provides clearer calls to action.
**Action:** Always check for empty states in lists/tables and use the `EmptyState` component instead of plain text.

## 2024-05-24 - [Icon-Only Component Accessibility Pattern]
**Learning:** The application heavily utilizes Mantine's `ActionIcon` for primary interactions (like Kiosk mode fullscreen toggles and navigation). These often lack inherent text, creating a recurring accessibility gap where screen readers receive no context for critical actions.
**Action:** Whenever implementing or reviewing UI that uses `ActionIcon` or similar icon-only buttons, consistently enforce the inclusion of localized `aria-label`s mapped to the app's `t` translation object.
