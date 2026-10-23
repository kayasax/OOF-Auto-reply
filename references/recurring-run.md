# Recurring run

This is the complete contract for the scheduled automation. Do not read any other reference file during a scheduled run.

**Silent execution:** Do not emit any progress narration, step commentary, or intermediate reasoning. Execute each step, then move immediately to the next. Emit only the final result token defined in the Final result section.

## Hard budgets

| Operation | Maximum |
| --- | ---: |
| Calendar query | 1 bounded query, plus required pagination |
| Outlook navigation before comparison | 2 (second only for /mail/ redirect recovery) |
| Loading stabilization | 1 wait and 1 replacement snapshot |
| Post-edit commit snapshot | 1, only when Save is initially hidden |
| Outlook navigation for verification | 1, only after a write |
| Post-write verification readiness | Up to 60 seconds total after successful navigation; read-only waits and snapshots only |
| Signature navigation | 1 compare, plus 1 verification only after a write |
| Tab operations, category clicks | 0 |
| Browser code (`run_code`) | Allowed for the Write and Verify reads only; one write call per attempt, up to 3 correction cycles |

A failed call consumes its budget. Never retry a failed navigation. Any navigation connection error, browser error, timeout, empty result, or unusable result ends the run immediately with `OOF_RUN_BLOCKED outlook=browser-error`. Make no further browser calls, then apply the Auth-failure notification section before the final result.

## Run

1. Read `config.json`. Run `scripts/config-status.cjs`. Stop with `OOF_RUN_BLOCKED setup=incomplete` unless it reports `usable: true`.
2. Read the owned automation by `setup.host_schedule_id`. Require the exact name `OOF Auto Reply` and one step. Use `setup.mode` as the only mode.
3. Optionally run `scripts/check-update.cjs`. A failure is silent. Announce a newer version once, then persist it in `update_check.last_notified_version`.
4. Use cached public holidays for the current and next year. Fetch only a missing country-year.
5. Query the calendar once from local midnight today through local midnight 22 days later, with both bounds explicit and a server-side filter `showAs eq 'oof'`. This eliminates non-OOF events before transmission. Follow pagination to the end for OOF results only. Reject default, agenda, unbounded, today-only, or incomplete coverage with `OOF_RUN_BLOCKED calendar=range-incomplete`.
6. An eligible OOF event is not cancelled, declined, or tentative, has `showAs=oof`, and is all-day or covers the configured working window. Organizer-owned, accepted, unanswered, and no-response events are eligible. Never add an `isAllDay` condition to the query or the eligibility test: vacation-system events (typically organized by an automated vacation system, subject `OOF`) arrive as multi-day blocks with `isAllDay=false`, for example `2026-10-26T00:00` to `2026-10-31T00:00`. Treat every local date from the event start through the day before a midnight end as an OOF date. A missed multi-day block once left the wrong message set for a whole leave.
7. Run `scripts/compute-period.cjs` exactly once with today's local date, `--now=HH:MM` from the actual current time in `config.timezone`, configured work schedule, eligible OOF dates, and holidays. Before work starts on an available working day, this retains the incoming overnight interval ending at today's work start; do not replace it with tonight's interval. OOF days and holidays remain covered. Do not alter its `expectedStart`, `expectedEnd`, `returnDate`, or `messageVariant`. Omit `--now` only for a future-date signature-banner calculation.
8. Pass that exact result to `scripts/render-messages.cjs`. Outlook bodies come only from `internalPlainText` and `externalPlainText`. Verification uses only `internalCanonicalText` and `externalCanonicalText`.
9. Execute the Outlook state machine below.
10. Reconcile the signature banner (section below) whenever `pre_oof_banner.enabled` is true. The banner section computes the desired state and both ADDS a banner when an eligible OOF is within lead time and REMOVES any managed banner otherwise. Banner removal is unconditional: never gate it on there being an upcoming or active OOF, because a stale banner most often needs cleaning precisely when no OOF remains (the day after return). When `pre_oof_banner.enabled` is false, skip to step 11.
11. Emit one short final result. No progress narration, reasoning transcript, JSON, raw success token, or Teams alert.

## Outlook state machine

### 1. Open

Use the current Scout-managed tab. Call `playwright-browser_navigate` exactly once for:

`https://outlook.cloud.microsoft/mail/options/accounts-category/automaticReply`

If navigation fails, stop with `OOF_RUN_BLOCKED outlook=browser-error`. Do not call another browser tool.

Take one snapshot. Do not evaluate the URL reported by the snapshot — Outlook's SPA routing may show `/mail/` in the URL bar while the settings panel is already rendered. Evaluate **page content only**:

- **Automatic Replies controls visible**: proceed to Compare. This is success regardless of URL.
- **Microsoft logo, blank shell, or spinner with no controls**: wait up to 10 seconds, then take one replacement snapshot. If controls are now visible, proceed. No further navigation.
- **Sign-in, account selection, or MFA**:
  - If a "Pick an account" page or list is visible, call `m_m365_status` and identify the local signed-in Microsoft 365 UPN. If that exact UPN is listed as a selectable work or school account, click it, wait up to 10 seconds, and take a new snapshot. If Automatic Replies controls are now visible, proceed to Compare.
  - If clicking the exact local UPN leads to another account picker, password prompt, MFA prompt, or any other sign-in screen, update only this automation to `browserHeadless: false`, set `setup.auth_recovery_pending: true`, apply the Auth-failure notification section, and stop with `OOF_RUN_BLOCKED outlook=authentication-required next=visible`. Never enter credentials.
  - If the exact local UPN is not listed, do not choose another account and do not use "Use another account". Update only this automation to `browserHeadless: false`, set `setup.auth_recovery_pending: true`, apply the Auth-failure notification section, and stop with `OOF_RUN_BLOCKED outlook=authentication-required next=visible`.
- **Inbox or mail list with no settings panel**: wait 5 seconds, take one snapshot. If controls appear, proceed. If still no controls, navigate once more to the same URL (consumes the redirect-recovery budget), take one snapshot, and proceed if controls are visible. If controls are still absent, stop with `OOF_RUN_BLOCKED outlook=unread`.

A usable page contains the Automatic Replies switch, schedule toggle, start and end controls, internal editor, external toggle, and external editor. Save, Enregistrer, OK, or Apply may be visible now or may appear only after an edit.

### 2. Compare

Compare the switch, scheduled period, start, end, external toggle, and complete editor text with calculator and renderer output. Normalize body whitespace and spaces before punctuation for comparison. Paragraph layout may differ, but every sentence and literal URL must match in order with no extra sentence.

The switch must be ON. If the switch is OFF, that is always a mismatch regardless of all other values.

For an `away` message, `working hours`, `outside business hours`, `Heads up`, or calendar-banner wording is always a mismatch.

For a `non_working_hours` message, any wording that references departure dates, return dates, or being away from a specific date (e.g. `away from`, `out of the office from`, `will not be checking email`) is always a mismatch.

If all values match, make no Automatic Replies edit or commit. Still evaluate the signature banner before producing the final result.

In `test` mode, report the differences without editing and stop.

### 3. Write

In `production` mode, apply changes in this exact order:

Before any edit, compare the actual current local date/time with `expectedEnd`. If the calculated period has expired while this run was reading Outlook, stop with `OOF_RUN_BLOCKED period=expired-before-write`; never save an expired interval or silently switch to tonight's interval.

1. **Switch**: If the switch is OFF, click it to turn it ON. Take a snapshot and confirm the switch is now ON and the date/message controls are enabled before proceeding. If controls remain disabled after clicking the switch, stop with `OOF_RUN_BLOCKED outlook=controls-unavailable`.
2. **Schedule checkbox**: If the "send only during a time period" checkbox is unchecked, click it to enable it.
3. **Dates**: Bind start controls only to `expectedStart` and end controls only to `expectedEnd`. Set the date and time components separately. After typing a time value into a combobox, press Tab to confirm it before moving to the next control.
4. **Messages**: Replace each mismatched editor as one operation: click, `Control+A`, then type the corresponding `internalPlainText` or `externalPlainText` body once.
5. **Preserve** newlines and the literal `https://github.com/kayasax/OOF-Auto-reply`. Do not append text, type HTML, or create links manually.

After all edits, click the supported commit button once. If it was absent in the first snapshot, take one post-edit snapshot, require Save, Enregistrer, OK, or Apply, and click it once. If none appears, stop with `OOF_RUN_BLOCKED outlook=write-uncommitted`. Never infer autosave.

### 4. Verify

After a committed write, navigate once to the same direct URL. After successful navigation, allow up to 60 seconds total for the Automatic Replies controls to render. This is a separate post-write readiness budget, not the Open loading-stabilization budget. Take a snapshot; if only a loading shell, spinner, inbox, or incomplete settings panel is visible, use supported browser waits in intervals of at most 10 seconds followed by a snapshot until the controls are visible or the 60-second deadline is reached. Use a full-page snapshot while the dialog is absent, and a dialog-scoped snapshot once present. A loading snapshot is not a verification failure before the deadline.

Once the switch, period, start/end controls, external toggle, and both complete editor bodies are visible, verify the exact switch, period, toggles, and canonical full-body equality. On a real value mismatch, do not stop: reopen the settings once, correct only the mismatched fields (date/time inputs: focus, Control+A, type exact value, Tab, read the value back before Save), Save once more, and re-verify. Allow up to 3 correction cycles; only then stop with `OOF_RUN_BLOCKED outlook=verification-mismatch`. Never treat a mismatch as acceptable and never claim success without a passing verification. At the readiness deadline, stop with `OOF_RUN_BLOCKED outlook=verification-incomplete` and report that Save was attempted but persistence is unconfirmed. Navigation errors and authentication prompts still use the existing failure and authentication gates immediately; never retry a failed navigation. Outlook web may bounce through a sign-in account picker (pick the signed-in work account reported by `m_m365_status`) and between outlook.office.com and outlook.cloud.microsoft; this is not a failure. If the direct URL shows only the inbox, open Settings, search "réponses auto" and click the entry. Settings pages can take 15 to 20 seconds to render. Proven input recipe: the switch is `input[role=switch]` (use Playwright `check()`, label clicks are intercepted); time fields are listbox pickers, so click the input then click the option by name in 12h format (e.g. `6:00 PM`, `9:00 AM`); typing does not work. Date fields: click the input, then click the day button labelled like `12, octobre, 2026`; for a date in another month, click the picker's down-arrow (next month, near the right of the month title) first, because the label can exist while the button is hidden. Practical rules proven in production: (1) the settings page reloads itself about a minute after load, so perform the whole write (switch, period, times, dates, bodies, Save) in one single browser-code call with `noWaitAfter: true` on the Save click, and never start a write in the same turn as a navigation; (2) before writing, remove any meeting-reminder popup from the DOM (elements whose id starts with `reminderButton`, and their `data-portal-node` parent) because it intercepts clicks; (3) to replace an editor body, click it, press Control+A then Delete three times, run `execCommand('delete')` on the selected contents, confirm it reads empty, then type each paragraph and press Enter between paragraphs; (4) after a sign-in bounce, wait about 25 seconds before reading any value; (5) the editors read back as one line, so compare after collapsing whitespace.

**Outlook signature injection exception:** Outlook may automatically append the default signature to the internal OOF reply body after save. When verifying the internal editor, if the only difference is a trailing paragraph that exactly matches the current pre-OOF banner (from the signature), treat verification as passed — do not report a mismatch. This is expected Outlook behaviour and not a write failure.

## Signature banner

Reconcile the configured default signature (`pre_oof_banner.default_signature_name`) to its desired banner state on every run where `pre_oof_banner.enabled` is true. Reconciliation is symmetric: it adds a banner when one is due and removes any managed banner when one is not, so a post-return stale banner is always cleaned.

1. **Desired state.** The banner should be PRESENT only when the nearest eligible future OOF block begins within `pre_oof_banner.lead_time_days` calendar days from today. Otherwise the desired state is ABSENT (no managed banner).
2. **Cheap skip.** Read `pre_oof_banner.active` from `config.json` (treat missing as false). If the desired state is ABSENT and `pre_oof_banner.active` is false, there is nothing to add and nothing stale to remove: make no signature navigation and proceed. In every other case (desired PRESENT, or `active` is true) you must navigate and reconcile.
3. **Expected banner text (only when desired PRESENT).**
   a. Identify `oofFirstDay`: the start date (YYYY-MM-DD) of the earliest eligible OOF calendar event that starts after today.
   b. Compute the banner return date by running `scripts/compute-period.cjs` a second time with `--today=<oofFirstDay>` and the same working-days, work-start, work-end, oof-dates, and holiday-dates arguments. Use the `returnDate` from this second result as `bannerReturnDate`. Do not use the `returnDate` from the first compute-period call; that reflects the current-period return (e.g. post-weekend), not the return from the future OOF block.
   c. Run `scripts/render-messages.cjs --mode=banner --config="<resourceDir>/config.json" --oof-first-day=<oofFirstDay> --return-date=<bannerReturnDate>`. The rendered output is the expected banner text.
4. **Reconcile.** Compare the configured default signature body with the desired state and act on only the managed banner line, leaving the rest of the signature untouched:
   - Desired PRESENT and the signature lacks the exact expected banner: insert or replace the managed banner line.
   - Desired ABSENT, or the present banner is a stale, cancelled, or already-started banner: remove the managed banner line.
   The managed banner is recognizable by the `pre_oof_banner.wording` shape (its leading calendar marker and phrasing), so a stale banner is identifiable even when its dates differ from today's expected text. The banner never modifies an `away` reply body.
5. **Persist the marker.** After a successful reconcile, set `pre_oof_banner.active` in `config.json` to true when the banner is now PRESENT, or false when it is now ABSENT.

In test mode, report the intended add, remove, or no-op without writing. In production, when a navigation is required, navigate once to `https://outlook.cloud.microsoft/mail/options/accounts-category/signatures-subcategory`, update only the configured default signature when different, save once, reopen once, and verify the complete signature body (confirm the rest of the signature is intact, not only the banner line). If the signature already matches the desired state, make no edit or verification navigation, but still persist the marker in step 5.

## Authentication recovery run

When `setup.auth_recovery_pending` is true, perform no calendar read, comparison, or Outlook write. Browser activity is limited to the Open procedure, including its one optional loading stabilization. Apply the following decision in order after the snapshot:

1. **Automatic Replies controls are visible:** require a successful ID-only automation update restoring `browserHeadless: true`, clear `setup.auth_recovery_pending`, and stop with: `Outlook authentication is complete. The next scheduled run will be headless.`
2. **Authentication, account selection, or MFA is visible:** leave `browserHeadless: false` and the recovery flag set, apply the Auth-failure notification section, then stop with `OOF_RUN_BLOCKED outlook=auth-recovery-pending` — the scheduled run will not write to Outlook until the interactive authentication run completes.
3. **Any other page (Outlook redirected, stale session, or loading failure):** leave `browserHeadless: false` and the recovery flag set, apply the Auth-failure notification section, then stop with `OOF_RUN_BLOCKED outlook=auth-recovery-pending` — the scheduled run is intentionally blocked. To recover, run the skill interactively from chat (it detects the completed session and clears the flag automatically) or set `setup.auth_recovery_pending: false` in `config.json` directly.

Do not fall through to `OOF_RUN_BLOCKED outlook=unread` when `auth_recovery_pending` is true. That code is reserved for state-machine failures unrelated to the recovery flag.

## Auth-failure notification

Whenever a run stops with an auth-related block (`OOF_RUN_BLOCKED outlook=authentication-required`, `outlook=auth-recovery-pending`, or `outlook=browser-error`), make the block visible instead of failing silently. This exists because the automation once stayed auth-blocked for a week with no signal, so automatic replies and the banner silently stopped updating.

Sending a Teams message is not a browser call, so it is permitted even after a terminal `browser-error` where no further browser tool may run.

1. Read `setup.auth_notified_date` from `config.json` (treat missing as empty).
2. If it does not equal today's local date, send exactly one message with `m_send_teams_message`: state that OOF Auto Reply is blocked on Outlook sign-in, that automatic replies and the pre-OOF banner will not update until re-auth, and that the fix is to run the skill interactively from chat to complete sign-in. Then set `setup.auth_notified_date` to today's local date in `config.json`.
3. If it already equals today, send nothing. One alert per calendar day maximum.

On any successful (non-auth-blocked) run, clear `setup.auth_notified_date` (set it to an empty string) so a future breakage notifies again.

## Final result

On success, state the local reply period, whether messages already matched or were updated, whether the signature banner was added, removed, or unchanged, whether verification succeeded when a write occurred, and that the next run is headless.

On failure, use one actionable `OOF_RUN_BLOCKED` code and state that no confirmed write occurred and existing Outlook values may remain stale. For an auth-related block, also state that a Teams re-auth alert was sent (or was already sent today).
