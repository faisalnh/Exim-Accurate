## 2024-05-18 - Missing ARIA labels on Kiosk action icons
**Learning:** Found multiple icon-only `ActionIcon` components without `aria-label`s in the `app/kiosk` pages. This is a recurring pattern in the app. Icon-only buttons are inaccessible to screen reader users without proper aria-labels or visually hidden text.
**Action:** Add descriptive, localized `aria-label` attributes to icon-only buttons (`ActionIcon`s) throughout the Kiosk pages, specifically the fullscreen toggles, navigation buttons, and cart quantity adjusters.
