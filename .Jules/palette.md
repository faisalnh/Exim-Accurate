## 2024-05-23 - [Destructive Action Feedback]
**Learning:** Users lack confidence when clicking destructive actions (like delete) without immediate visual feedback. Adding a specific loading state for the item being deleted prevents "rage clicking" and assures the user the system is working.
**Action:** Always verify delete actions have a loading state, especially in lists/tables where multiple items exist.

## 2026-02-04 - [Consistent Empty States]
**Learning:** Replacing plain text empty states with visually rich components significantly improves the perceived quality of the application and provides clearer calls to action.
**Action:** Always check for empty states in lists/tables and use the `EmptyState` component instead of plain text.

## 2026-02-16 - [Modal Confirmations]
**Learning:** Native `confirm()` dialogs disrupt the user flow and lack styling consistency. Replacing them with modal-based confirmations (e.g., `modals.openConfirmModal`) creates a seamless experience and allows for better context (titles, descriptions, button labels).
**Action:** Audit and replace native `confirm()` usage with `modals.openConfirmModal` for destructive actions.
