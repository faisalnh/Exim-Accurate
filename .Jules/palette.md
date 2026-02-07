## 2024-05-23 - [Destructive Action Feedback]
**Learning:** Users lack confidence when clicking destructive actions (like delete) without immediate visual feedback. Adding a specific loading state for the item being deleted prevents "rage clicking" and assures the user the system is working.
**Action:** Always verify delete actions have a loading state, especially in lists/tables where multiple items exist.

## 2025-02-14 - [Confirmation Dialogs]
**Learning:** Native browser confirm dialogs are jarring and provide a poor user experience. Replacing them with custom modals improves confidence and fits the design system.
**Action:** Use `modals.openConfirmModal` instead of `window.confirm`, especially for irreversible actions like deletion.
