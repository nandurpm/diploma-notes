## 2026-07-28 - Unified Timezone and Date-Key Formatting

**Learning:** Duplicate definitions of low-level timezone conversions and date key formatters (e.g., `Intl.DateTimeFormat` or custom system date string concatenation) lead to maintainability issues and potential alignment bugs across different client browsers. Centralizing standard formatting utilities under a shared namespace (like `PolyUtils`) simplifies code, encourages reuse, and enforces consistent date-key representations.

**Action:** Extract common date and timezone string manipulations into standard helpers like `PolyUtils.formatDateKey(date, timeZone)`, call them with defensive local browser fallbacks, and reuse them across all state-management and calendar-dependent modules.
