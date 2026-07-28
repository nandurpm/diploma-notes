## 2026-07-24 - Dynamic Single-Page Form Submission
**Learning:** In dynamically generated single-page forms with multiple input fields, pressing Enter does not trigger standard `onsubmit` events if there is no native submit button. Binding an `onkeydown` listener for Enter on the parent form element is the standard, robust UX workaround to prevent form submission friction.
**Action:** Always intercept the 'Enter' keypress on dynamically rendered forms and programmatically click or trigger the corresponding action button or validation process to keep interaction frictionless for keyboard users.

## 2026-07-26 - Accessible Filter Toggles and Autofocus
**Learning:** Toggle controls like filter buttons and chips must communicate their selected state to screen readers via dynamic `aria-pressed` states. Furthermore, opening single-page interactive modals should focus and auto-select the first input/textarea element rather than the generic modal close button, allowing keyboard users to immediately type values without manual navigation.
**Action:** Always synchronize visual toggle states (e.g. '.on' or '.primary' class) with their corresponding `aria-pressed` attributes, and design modal open transitions to focus and auto-select the main interactive entry fields.

## 2026-07-28 - Accessible Timer Status Announcements
**Learning:** When implementing interactive timers or countdown clocks, applying `aria-live` or `role="status"` directly to the rapidly updating time string element causes screen readers to constantly announce the updated digits every second, creating extreme verbal noise and blocking user interaction. Instead, a separate live status region should be used to announce key state transitions (start, pause, reset, complete) while keeping the countdown numbers quiet.
**Action:** Always separate visual countdown elements from live announcements. Use a dedicated, quiet live region to notify assistive technologies of meaningful timer events such as start, pause, reset, and completion without introducing persistent auditory clutter.
