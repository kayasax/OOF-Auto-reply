# Daily operation

Use this reference only with a configuration that `scripts/config-status.cjs` reports as usable.

## Inputs and classification

1. Treat the host-provided date and time as authoritative.
2. Run scheduled Outlook discovery with `--mode=scheduled`. Use confirmed time zone, working days, and hours from `config.json`.
3. Fetch public holidays for the current and next year from Nager.Date when not cached. Persist only holiday dates.
4. Read calendar events at least 21 days ahead.
5. Count an OOF day only when an accepted event has `showAs == "oof"` and is all-day or spans the configured working window. Ignore tentative, declined, and short timed OOF blocks.
6. Set status to `away` for an OOF day or public holiday. Otherwise set status to `workday`.

## Computation

For `away`, extend the contiguous block through adjacent accepted OOF days, weekends, and public holidays. The return date is the next configured working day after that block. Schedule replies from today at 00:00 until the return date at workday start.

For `workday`, schedule replies from today's workday end until the next configured working day at workday start.

When the nearest accepted future OOF begins within the confirmed lead window, apply the confirmed banner to the default signature and optionally append the same notice to non-working-hours replies. Remove stale, cancelled, or already-started banners.

## Test mode

Read Outlook, calendar, and holidays, then show the exact period, bodies, and banner action production would apply. Never toggle, edit, save, or perform post-save verification. Report success only for the read-only path.

## Production mode

1. Stop safely when visible sign-in or MFA is required. Never bypass authentication headlessly.
2. Apply the confirmed Automatic Replies switch, period, and rich-text bodies. Dispatch the editor input event required by Outlook, then save.
3. Reopen or refresh settings and verify switch, period, and exact bodies. Do not retry indefinitely.
4. If the pre-OOF banner is enabled, update only the confirmed default signature and verify it.
5. If settings revert between runs, reapply once, report a possible competing flow, and wait for user confirmation that the old flow was disabled.

## Result

Report status, exact reply period, return date when away, banner action, upcoming-leave notice action, update state, and any required user action. Do not expose unrelated calendar details.
