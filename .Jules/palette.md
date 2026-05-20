## 2024-05-23 - [Destructive Action Feedback]
**Learning:** Users lack confidence when clicking destructive actions (like delete) without immediate visual feedback. Adding a specific loading state for the item being deleted prevents "rage clicking" and assures the user the system is working.
**Action:** Always verify delete actions have a loading state, especially in lists/tables where multiple items exist.

## 2026-02-04 - [Consistent Empty States]
**Learning:** Replacing plain text empty states with visually rich components significantly improves the perceived quality of the application and provides clearer calls to action.
**Action:** Always check for empty states in lists/tables and use the `EmptyState` component instead of plain text.

## 2024-04-22 - [ARIA Labels and List Loading States]
**Learning:** For lists containing items with interactive icon-only buttons (like delete), tracking the loading state with an array of IDs instead of a single ID prevents visual glitching. Additionally, always provide `aria-label`s utilizing the app's internationalization (`language === "id" ? ... : ...`) for inclusive accessibility.
**Action:** Use an array state (e.g. `const [loadingIds, setLoadingIds] = useState<string[]>([])`) for listing actions and localized ARIA labels on all icon-only buttons.
