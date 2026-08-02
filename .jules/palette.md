## 2026-07-24 - Dynamic Single-Page Form Submission
**Learning:** In dynamically generated single-page forms with multiple input fields, pressing Enter does not trigger standard `onsubmit` events if there is no native submit button. Binding an `onkeydown` listener for Enter on the parent form element is the standard, robust UX workaround to prevent form submission friction.
**Action:** Always intercept the 'Enter' keypress on dynamically rendered forms and programmatically click or trigger the corresponding action button or validation process to keep interaction frictionless for keyboard users.

## 2026-07-26 - Accessible Filter Toggles and Autofocus
**Learning:** Toggle controls like filter buttons and chips must communicate their selected state to screen readers via dynamic `aria-pressed` states. Furthermore, opening single-page interactive modals should focus and auto-select the first input/textarea element rather than the generic modal close button, allowing keyboard users to immediately type values without manual navigation.
**Action:** Always synchronize visual toggle states (e.g. '.on' or '.primary' class) on filter buttons and chips with their corresponding `aria-pressed` attributes, and design modal open transitions to focus and auto-select the main interactive entry fields.

## 2026-07-28 - No Nested Interactive Controls
**Learning:** Nesting focusable or interactive elements (e.g., elements with roles like "button" or native `<button>`) inside another native `<button>` element is a violation of HTML5 and WCAG specifications. Assistive technologies and screen readers cannot interpret nested actions reliably, and keyboard/voice-control navigation becomes highly unpredictable.
**Action:** Always structure parent and child interactive controls (such as list item cards containing delete or close actions) as sibling semantic `<button>` elements wrapped inside a relative-positioned container `div` (e.g., `.ask-item-wrap`), ensuring the child remains absolute-positioned without breaking the accessibility tree.
**Action:** Always synchronize visual toggle states (e.g. '.on' or '.primary' class) with their corresponding `aria-pressed` attributes, and design modal open transitions to focus and auto-select the main interactive entry fields.

## 2026-07-28 - Visually Hidden ARIA-live Announcer for Real-Time Search Results
**Learning:** Real-time client-side search and filtering inputs on dynamic subject grids do not inherently announce DOM content changes to assistive technologies. Placing a visually hidden announcer (`role="status"`, `aria-live="polite"`) that updates on every search/filter render allows screen readers to immediately announce the matched result counts. Linking the search input to the grid and announcer via `aria-controls` and `aria-describedby` completes the semantic association.
**Action:** Always include a visually hidden ARIA-live polite status announcer for real-time, dynamic filtering controls, and link the input selector with its corresponding target containers and announcers.

## 2026-07-28 - Accessible Timer Status Announcements
**Learning:** When implementing interactive timers or countdown clocks, applying `aria-live` or `role="status"` directly to the rapidly updating time string element causes screen readers to constantly announce the updated digits every second, creating extreme verbal noise and blocking user interaction. Instead, a separate live status region should be used to announce key state transitions (start, pause, reset, complete) while keeping the countdown numbers quiet.
**Action:** Always separate visual countdown elements from live announcements. Use a dedicated, quiet live region to notify assistive technologies of meaningful timer events such as start, pause, reset, and completion without introducing persistent auditory clutter.

## 2026-07-29 - Keyboard Focus Restoration on Dynamically Toggled Panels and Modals
**Learning:** Dynamically toggled overlays and panels (such as promotion popups and floating help assistants) can strand keyboard focus when they are opened or dismissed. If focus is not explicitly managed, dismissing these overlays can drop keyboard navigation focus back to the top of the viewport or keep it lost, forcing keyboard/screen-reader users to traverse the entire DOM again to resume their prior context.
**Action:** Always capture `document.activeElement` when a modal or panel is triggered, auto-focus the most relevant interactive control inside it when opened, and restore the captured focus to the trigger element immediately upon panel closure if the user's focus was active inside the modal/panel.

## 2026-07-29 - Accessible Tablist Arrow Navigation and Aria Selected States
**Learning:** In standard-compliant accessible interfaces, multi-tab layout components (such as login/register auth tabs) inside a `role="tablist"` container must support seamless left/right arrow key navigation to cycle between active tabs. Furthermore, the selection change must immediately synchronize the `aria-selected` state on each tab button to provide screen readers with accurate audio cues of the active tab.
**Action:** Always bind ArrowLeft and ArrowRight keyboard event listeners on tab elements inside custom tablists, and explicitly toggle their `aria-selected` attributes alongside their visual active classes.

## 2026-08-01 - Dynamic Aria-Pressed Toggle State Synchronization
**Learning:** When using filter buttons that toggle active/inactive states (such as a "Favorites" filter toggle), the visual state change (such as toggling a CSS class like `.primary`) must always be accompanied by a corresponding update to the button's `aria-pressed` attribute. Without this dynamic synchronization, screen readers cannot communicate the toggled selection status to assistive technology users.
**Action:** Always synchronize visual toggle states on custom filtering and toggle buttons with their dynamic `aria-pressed` values during action triggers.
