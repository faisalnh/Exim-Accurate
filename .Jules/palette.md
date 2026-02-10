## 2024-05-23 - [Destructive Action Feedback]
**Learning:** Users lack confidence when clicking destructive actions (like delete) without immediate visual feedback. Adding a specific loading state for the item being deleted prevents "rage clicking" and assures the user the system is working.
**Action:** Always verify delete actions have a loading state, especially in lists/tables where multiple items exist.

## 2026-02-04 - [Consistent Empty States]
**Learning:** Replacing plain text empty states with visually rich components significantly improves the perceived quality of the application and provides clearer calls to action.
**Action:** Always check for empty states in lists/tables and use the `EmptyState` component instead of plain text.

## 2026-02-04 - [Modals over Alerts]
**Learning:** Native `confirm()` dialogs are blocking and break the visual flow of the application. Using `modals.openConfirmModal` provides a consistent, non-blocking, and themable experience that aligns with the design system.
**Action:** Replace all native `confirm()` calls with `modals.openConfirmModal`, ensuring destructive actions use `confirmProps: { color: 'red' }`.
