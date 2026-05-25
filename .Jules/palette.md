## 2024-05-23 - [Destructive Action Feedback]
**Learning:** Users lack confidence when clicking destructive actions (like delete) without immediate visual feedback. Adding a specific loading state for the item being deleted prevents "rage clicking" and assures the user the system is working.
**Action:** Always verify delete actions have a loading state, especially in lists/tables where multiple items exist.

## 2026-02-04 - [Consistent Empty States]
**Learning:** Replacing plain text empty states with visually rich components significantly improves the perceived quality of the application and provides clearer calls to action.
**Action:** Always check for empty states in lists/tables and use the `EmptyState` component instead of plain text.

## 2024-05-25 - [ActionIcon Accessibility in Tooltips]
**Learning:** Even when `ActionIcon` buttons are near a tooltip or self-evident in context (like a kiosk), they often lack raw `aria-label`s, which is a major barrier for screen-reader users accessing interactive elements. Relying solely on icons or visually implied contexts is insufficient.
**Action:** Always explicitly verify that icon-only buttons (like Mantine `ActionIcon`) include an `aria-label` utilizing localized strings (`t.common...`), especially in high-visibility contexts like kiosk interfaces.
