# Daily operation

Use this reference only with a configuration that `scripts/config-status.cjs` reports as usable.

## Inputs and classification

1. Treat the host-provided date and time as authoritative.
2. Read `references/outlook-discovery.md` and use Scout's supported Playwright tools for scheduled Outlook discovery. Skip Work Hours and use confirmed time zone, working days, and hours from `config.json`.
3. Fetch public holidays for the current and next year from Nager.Date when not cached. Persist only holiday dates.
4. Call the host calendar-read capability for an explicit interval from today through at least 21 days ahead. Outlook Automatic Replies settings are not calendar evidence. If the calendar read fails, is unavailable, or does not cover the interval, stop with `OOF_RUN_BLOCKED calendar=unread`; never assume there is no upcoming leave.
5. Count an OOF day only when an eligible event has `showAs == "oof"` and is all-day or spans the configured working window. Eligible means the event is not cancelled and its response is not declined or tentative. Include events owned by the user (`organizer`), explicitly accepted events, and OOF events with no response or an unanswered response. Do not require the literal response value `accepted`. Ignore short timed OOF blocks.
6. Set status to `away` for an OOF day or public holiday. Otherwise set status to `workday`.

Before comparing with Outlook, record the covered calendar interval, the nearest eligible OOF block or `none`, the traversed non-working dates, and the computed expected start, end, return date, and message variant. A zero-event result is valid only when it came from the successful calendar read above.

Run `scripts/compute-period.cjs` with today's local date, the confirmed work schedule, eligible OOF dates, and holiday dates. Treat its JSON output as authoritative for the expected period and message variant. Do not calculate these values mentally. For the regression case where Friday 2026-07-17 is followed by a weekend and eligible OOF dates from 2026-07-20 through 2026-07-31, the required output ends at 2026-08-03 workday start.

## Computation

For `away`, extend the contiguous block through adjacent accepted OOF days, weekends, and public holidays. The return date is the next configured working day after that block. Schedule replies from today at 00:00 until the return date at workday start.

For `workday`, schedule replies from today's workday end until the next available working day at workday start. Starting with the next calendar day, traverse weekends, public holidays, and accepted OOF days using the same acceptance rules above. If that non-working sequence reaches an upcoming accepted OOF block, continue through the complete contiguous block and any adjacent weekends or public holidays. The return date is the first configured working day after the sequence that is neither a public holiday nor an accepted OOF day.

This extension is required on the last working day before leave. For example, if Friday is a workday, the weekend follows, and accepted leave runs from Monday through the following Friday, Friday's reply period ends on the later return day at workday start, not on the first Monday. Use that same return date when rendering `{return_date}` in the confirmed upcoming-leave notice. Without an accepted OOF day or public holiday after the weekend, retain the normal next-workday end time.

When the nearest accepted future OOF begins within the confirmed lead window, apply the confirmed banner to the default signature and optionally append the same notice to non-working-hours replies. The notice return date and the Automatic Replies end date must identify the same next available working day. Remove stale, cancelled, or already-started banners.

## Test mode

Read Outlook, calendar, and holidays, then show the exact period, bodies, and banner action production would apply. Never toggle, edit, save, or perform post-save verification. Report success only for the read-only path.

## Production mode

1. Use the visible Scout-managed browser. When sign-in or MFA is required, wait for direct user interaction. If authentication is not completed, stop safely without changing Outlook.
2. Compare the calendar-derived expected switch, period, and exact rendered bodies with the discovered Outlook state. Never describe Outlook as matching merely because it matches the ordinary workday configuration. If any expected value differs, apply the expected switch, period, and rich-text bodies. Dispatch the editor input event required by Outlook, then save.
3. Reopen or refresh settings and verify switch, period, and exact bodies. Do not retry indefinitely.
4. If the pre-OOF banner is enabled, update only the confirmed default signature and verify it.
5. If settings revert between runs, reapply once, report a possible competing flow, and wait for user confirmation that the old flow was disabled.

## Result

Report status, calendar coverage end, nearest eligible OOF block or `none`, exact reply period, return date when away or when a workday period extends through upcoming leave, banner action, upcoming-leave notice action, update state, and any required user action. Do not expose event subjects or unrelated calendar details.
