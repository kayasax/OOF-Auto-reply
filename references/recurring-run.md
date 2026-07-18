# Recurring run

This is the complete contract for the scheduled automation. Do not read any other reference file during a scheduled run.

## Hard budgets

| Operation | Maximum |
| --- | ---: |
| Calendar query | 1 bounded query, plus required pagination |
| Outlook navigation before comparison | 1 |
| Loading stabilization | 1 wait and 1 replacement snapshot |
| Post-edit commit snapshot | 1, only when Save is initially hidden |
| Outlook navigation for verification | 1, only after a write |
| Signature navigation | 1 compare, plus 1 verification only after a write |
| Tab operations, category clicks, browser code | 0 |

A failed call consumes its budget. Never retry a failed navigation. Any navigation connection error, browser error, timeout, empty result, or unusable result ends the run immediately with `OOF_RUN_BLOCKED outlook=browser-error`. Make no further browser calls.

## Run

1. Read `config.json`. Run `scripts/config-status.cjs`. Stop with `OOF_RUN_BLOCKED setup=incomplete` unless it reports `usable: true`.
2. Read the owned automation by `setup.host_schedule_id`. Require the exact name `OOF Auto Reply` and one step. Use `setup.mode` as the only mode.
3. Optionally run `scripts/check-update.cjs`. A failure is silent. Announce a newer version once, then persist it in `update_check.last_notified_version`.
4. Use cached public holidays for the current and next year. Fetch only a missing country-year.
5. Query the calendar once from local midnight today through local midnight 22 days later, with both bounds explicit. Follow pagination to the end. Reject default, agenda, unbounded, today-only, or incomplete coverage with `OOF_RUN_BLOCKED calendar=range-incomplete`.
6. An eligible OOF event is not cancelled, declined, or tentative, has `showAs=oof`, and is all-day or covers the configured working window. Organizer-owned, accepted, unanswered, and no-response events are eligible.
7. Run `scripts/compute-period.cjs` exactly once with today's local date, configured work schedule, eligible OOF dates, and holidays. Do not alter its `expectedStart`, `expectedEnd`, `returnDate`, or `messageVariant`.
8. Pass that exact result to `scripts/render-messages.cjs`. Outlook bodies come only from `internalPlainText` and `externalPlainText`. Verification uses only `internalCanonicalText` and `externalCanonicalText`.
9. Execute the Outlook state machine below.
10. Independently evaluate the confirmed pre-OOF banner as described below, even when Automatic Replies already match.
11. Emit one short final result. No progress narration, reasoning transcript, JSON, raw success token, or Teams alert.

## Outlook state machine

### 1. Open

Use the current Scout-managed tab. Call `playwright-browser_navigate` exactly once for:

`https://outlook.cloud.microsoft/mail/options/accounts-category/automaticReply`

If navigation fails, stop with `OOF_RUN_BLOCKED outlook=browser-error`. Do not call another browser tool.

Take one snapshot. If it is only a Microsoft logo or loading shell at the exact URL, wait up to 10 seconds for Automatic Replies controls and take one replacement snapshot. No reload or second navigation.

If sign-in, account selection, or MFA appears, update only this automation to `browserHeadless: false`, set `setup.auth_recovery_pending: true`, and stop with `OOF_RUN_BLOCKED outlook=authentication-required next=visible`. Never enter credentials.

A usable page contains the Automatic Replies switch, schedule toggle, start and end controls, internal editor, external toggle, and external editor. Save, Enregistrer, OK, or Apply may be visible now or may appear only after an edit. Missing editable controls stop with `OOF_RUN_BLOCKED outlook=unread`.

### 2. Compare

Compare the switch, scheduled period, start, end, external toggle, and complete editor text with calculator and renderer output. Normalize body whitespace and spaces before punctuation for comparison. Paragraph layout may differ, but every sentence and literal URL must match in order with no extra sentence.

For an `away` message, `working hours`, `outside business hours`, `Heads up`, or calendar-banner wording is always a mismatch.

If all values match, make no Automatic Replies edit or commit. Still evaluate the signature banner before producing the final result.

In `test` mode, report the differences without editing and stop.

### 3. Write

In `production` mode, change only mismatched values:

- Bind start controls only to `expectedStart` and end controls only to `expectedEnd`.
- Replace each mismatched editor as one operation: click, `Control+A`, then type the corresponding plain-text body once.
- Preserve newlines and the literal `https://github.com/kayasax/OOF-Auto-reply`.
- Do not append text, type HTML, or create links manually.

After all edits, click the supported commit button once. If it was absent in the first snapshot, take one post-edit snapshot, require Save, Enregistrer, OK, or Apply, and click it once. If none appears, stop with `OOF_RUN_BLOCKED outlook=write-uncommitted`. Never infer autosave.

### 4. Verify

After a committed write, navigate once to the same direct URL and take one snapshot. Verify the exact switch, period, toggles, and canonical full-body equality. If verification fails, report the mismatch and stop. Do not loop.

## Signature banner

When the nearest eligible future OOF block begins within `pre_oof_banner.lead_time_days`, render the confirmed banner using the calculator result and compare it with the configured default signature. Remove a stale, cancelled, or already-started banner. The banner never modifies an `away` reply body.

In test mode, report the action without writing. In production, navigate once to `https://outlook.cloud.microsoft/mail/options/accounts-category/signatures-subcategory`, update only the configured default signature when different, save once, reopen once, and verify the complete signature body. If the signature already matches and is not stale, make no edit or verification navigation.

## Authentication recovery run

When `setup.auth_recovery_pending` is true, perform no calendar read, comparison, or Outlook write. Browser activity is limited to the Open procedure, including its one optional loading stabilization. If authentication remains visible, leave `browserHeadless: false` and the recovery flag set, then stop. If Automatic Replies controls are visible, require a successful ID-only automation update restoring `browserHeadless: true`, clear the flag, and stop with: `Outlook authentication is complete. The next scheduled run will be headless.`

## Final result

On success, state the local reply period, whether messages already matched or were updated, whether verification succeeded when a write occurred, and that the next run is headless.

On failure, use one actionable `OOF_RUN_BLOCKED` code and state that no confirmed write occurred and existing Outlook values may remain stale.
