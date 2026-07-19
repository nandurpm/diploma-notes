# POLY PMNA Scheduled Maintenance Rotation — 2026

## Maintenance windows

- Existing special maintenance remains unchanged: **Tuesday, 21 July 2026, 8:00 PM–9:00 PM IST**.
- Recurring maintenance: **Every Thursday, 8:45 PM–9:00 PM IST**, from **23 July 2026 through 31 December 2026**.
- Normal pages are served outside these windows.
- During an active window, Cloudflare Pages middleware serves the maintenance page with HTTP `503 Service Unavailable`.

## Activity rotation

| # | Date | Time (IST) | Activity category | Activity |
|---:|---|---|---|---|
| 0 | Tuesday, 21 July 2026 | 8:00 PM–9:00 PM | Electrical Quiz | Electrical Safety Quiz |
| 1 | Thursday, 23 July 2026 | 8:45 PM–9:00 PM | General Knowledge | India General Knowledge Sprint |
| 2 | Thursday, 30 July 2026 | 8:45 PM–9:00 PM | Memory Game | Electrical Symbol Memory Match |
| 3 | Thursday, 6 August 2026 | 8:45 PM–9:00 PM | Number Puzzle | Number Sequence Workshop |
| 4 | Thursday, 13 August 2026 | 8:45 PM–9:00 PM | Reaction Game | Voltage Alert Reaction Test |
| 5 | Thursday, 20 August 2026 | 8:45 PM–9:00 PM | Word Puzzle | Engineering Word Scramble |
| 6 | Thursday, 27 August 2026 | 8:45 PM–9:00 PM | Logic Puzzle | Switchboard Logic Riddles |
| 7 | Thursday, 3 September 2026 | 8:45 PM–9:00 PM | Odd One Out | Component Odd-One-Out |
| 8 | Thursday, 10 September 2026 | 8:45 PM–9:00 PM | Speed Math | Electrical Units Speed Math |
| 9 | Thursday, 17 September 2026 | 8:45 PM–9:00 PM | General Knowledge | Kerala Knowledge Challenge |
| 10 | Thursday, 24 September 2026 | 8:45 PM–9:00 PM | Memory Game | Safety Sign Memory Match |
| 11 | Thursday, 1 October 2026 | 8:45 PM–9:00 PM | Number Puzzle | Pattern Sequence Lab |
| 12 | Thursday, 8 October 2026 | 8:45 PM–9:00 PM | Reaction Game | Signal Catch Challenge |
| 13 | Thursday, 15 October 2026 | 8:45 PM–9:00 PM | Word Puzzle | Polytechnic Word Scramble |
| 14 | Thursday, 22 October 2026 | 8:45 PM–9:00 PM | Logic Puzzle | Wire Label Logic |
| 15 | Thursday, 29 October 2026 | 8:45 PM–9:00 PM | Odd One Out | Science Odd-One-Out |
| 16 | Thursday, 5 November 2026 | 8:45 PM–9:00 PM | Speed Math | Ohm’s Law Speed Round |
| 17 | Thursday, 12 November 2026 | 8:45 PM–9:00 PM | General Knowledge | Science and Technology Quiz |
| 18 | Thursday, 19 November 2026 | 8:45 PM–9:00 PM | Memory Game | Circuit Component Memory |
| 19 | Thursday, 26 November 2026 | 8:45 PM–9:00 PM | Number Puzzle | Advanced Sequence Hunt |
| 20 | Thursday, 3 December 2026 | 8:45 PM–9:00 PM | Reaction Game | Relay Response Challenge |
| 21 | Thursday, 10 December 2026 | 8:45 PM–9:00 PM | Word Puzzle | Technology Word Scramble |
| 22 | Thursday, 17 December 2026 | 8:45 PM–9:00 PM | Logic Puzzle | Workshop Tool Riddles |
| 23 | Thursday, 24 December 2026 | 8:45 PM–9:00 PM | Odd One Out | Holiday Knowledge Odd-One-Out |
| 24 | Thursday, 31 December 2026 | 8:45 PM–9:00 PM | Speed Math | Year-End Countdown Math |

## Repetition control

- All 25 activity titles are unique.
- Each recurring category appears exactly three times.
- The one-off Electrical Quiz appears once.
- No activity category or titled activity repeats more than four times.

## Automatic cleanup

The maintenance middleware and cleanup workflow are scheduled for removal after the final window, at approximately **9:15 PM IST on 31 December 2026**. The date checks inside the middleware also prevent any maintenance activation after the final scheduled window even if cleanup is delayed.
