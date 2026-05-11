## 2024-05-23 - [Destructive Action Feedback]
**Learning:** Users lack confidence when clicking destructive actions (like delete) without immediate visual feedback. Adding a specific loading state for the item being deleted prevents "rage clicking" and assures the user the system is working.
**Action:** Always verify delete actions have a loading state, especially in lists/tables where multiple items exist.

## 2026-02-04 - [Consistent Empty States]
**Learning:** Replacing plain text empty states with visually rich components significantly improves the perceived quality of the application and provides clearer calls to action.
**Action:** Always check for empty states in lists/tables and use the `EmptyState` component instead of plain text.

## 2026-05-11 - [Tooltip ARIA Labels]
**Learning:** Relying solely on a `Tooltip` component for visual feedback on icon-only buttons leaves screen readers without a descriptive label. `aria-label` must be explicitly provided on the interactive element (e.g., `ActionIcon`) to match the tooltip.
**Action:** Always verify icon-only buttons have an explicit, localized `aria-label` directly on the element, mirroring any tooltip text.
