## 2024-05-23 - [Destructive Action Feedback]
**Learning:** Users lack confidence when clicking destructive actions (like delete) without immediate visual feedback. Adding a specific loading state for the item being deleted prevents "rage clicking" and assures the user the system is working.
**Action:** Always verify delete actions have a loading state, especially in lists/tables where multiple items exist.
## 2026-02-06 - [Modal Confirmation vs Native Alert]
**Learning:** Native `confirm()` dialogs are jarring and not accessible. Replacing them with `@mantine/modals` improves user confidence and consistency, especially for destructive actions.
**Action:** Always use `openConfirmModal` for destructive actions with explicit labels (e.g., "Disconnect" vs "OK") and proper color coding.
