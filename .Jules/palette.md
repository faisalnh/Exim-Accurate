## 2024-05-23 - [Destructive Action Feedback]
**Learning:** Users lack confidence when clicking destructive actions (like delete) without immediate visual feedback. Adding a specific loading state for the item being deleted prevents "rage clicking" and assures the user the system is working.
**Action:** Always verify delete actions have a loading state, especially in lists/tables where multiple items exist.

## 2026-02-04 - [Consistent Empty States]
**Learning:** Replacing plain text empty states with visually rich components significantly improves the perceived quality of the application and provides clearer calls to action.
**Action:** Always check for empty states in lists/tables and use the `EmptyState` component instead of plain text.

## 2025-02-14 - Widespread Missing Aria Labels on ActionIcons
**Learning:** Found a common pattern in the application where icon-only buttons (`ActionIcon` from Mantine) were used extensively without `aria-label`s, rendering them inaccessible to screen readers. This is particularly critical in Kiosk and Dashboard views where quick actions are common.
**Action:** When adding or reviewing code containing `ActionIcon` or similar icon-only buttons, explicitly check for and require `aria-label` properties, using localized strings whenever possible to support the application's i18n structure.
