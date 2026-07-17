# Outlook and mailbox discovery

## Browser execution

Treat scheduled Outlook access as one deterministic operation after calendar calculation. Do not narrate progress, describe snapshots, search settings categories, or reason aloud between tool calls.

## Scheduled fast path

1. Navigate directly to `https://outlook.cloud.microsoft/mail/options/accounts-category/automaticReply` with `playwright-browser_navigate`.
2. Take one `playwright-browser_snapshot` after the page settles.
3. If Microsoft account selection, sign-in, or MFA is visible, wait for direct user interaction. After authentication, navigate to the same direct URL once and take one new snapshot. If authentication is not completed, stop with `OOF_RUN_BLOCKED outlook=authentication-required`.
4. If the Automatic Replies controls are already visible, do not click any category tab. Otherwise use `playwright-browser_click` on Account or Compte once, use it on Automatic replies or Réponses automatiques once, then take one new snapshot. Do not inspect Mail, Calendar, layout, reading-pane, or unrelated tabs.
5. Read the enabled switch, scheduled-period controls, internal body, external-send toggle, and external body from that snapshot. Capture the complete visible text of both editors. Do not summarize either body as a template name or banner state.
6. Normal scheduled discovery is limited to one navigation, at most two tab clicks, and at most two snapshots. Authentication adds only the one post-authentication navigation and snapshot. If required controls remain unavailable, stop with `OOF_RUN_BLOCKED outlook=unread`.

## Scheduled write and verification

Use the refs from the final fast-path snapshot. Do not rediscover the page.

1. Change only values that differ from the calculator output and rendered bodies.
2. For each rich-text body that differs: click its editor, press `Control+A` with `playwright-browser_press_key`, then enter the complete body once with `playwright-browser_type`. Never append or edit sentence by sentence.
3. Set the switch, scheduled period, start, end, external-send toggle, and bodies as required, then click Save or Enregistrer once.
4. Navigate once to the same direct Automatic Replies URL and take one snapshot. Verify the exact switch and period, then compare the complete visible text of each editor with the plain-text content of the deterministic renderer output. A template label or partial phrase is not verification. If an `away` body contains `working hours`, `outside business hours`, `Heads up`, or calendar-banner wording, verification fails. Do not retry a failed save more than once.
5. Only when the confirmed pre-OOF banner is enabled and its expected body differs, navigate directly to `https://outlook.cloud.microsoft/mail/options/accounts-category/signatures-subcategory`, update only the configured default signature, save once, and verify once.

## Interactive onboarding only

Scheduled runs skip Work hours entirely. Working-hours discovery is available during onboarding only: navigate directly to `https://outlook.cloud.microsoft/mail/options/calendar/workHoursAndLocation`, take one snapshot, and read time zone, selected working days, and start and end times. If controls are not visible, click Calendar or Calendrier once and Work hours and location or Horaires et lieu de travail once, then take one final snapshot.

## Prohibitions

- All recurring OOF automations must run with `browserHeadless: false`.
- Never use `playwright-browser_run_code`, arbitrary JavaScript evaluation, browser installation, filesystem browser profiles, or OS process inspection.
- Never use trial-and-error navigation, repeated snapshots, process exploration, or commentary such as “let me find,” “checking,” “need to,” or “I can see.”

Before the detected-values summary, emit:

`OOF_BROWSER_RECEIPT fast_path=1 navigations=<1-3> snapshots=<1-3> tab_clicks=<0-2> run_code=0 elapsed_ms=<N>`

If `run_code` is not zero, do not claim supported Scout browser discovery succeeded.

## Mandatory mailbox inference

Mailbox inference is required because Outlook can hide reply editors while Automatic Replies are off and signature settings may not expose historical banner wording.

1. Get the signed-in user's address with `workiq_get_my_profile`.
2. Search the last 30 days for the exact phrase `"outside my working hours"`.
3. Select the newest item sent by that signed-in user whose subject starts with localized `Automatic reply:` or `Réponse automatique :`, then fetch its full HTML body.
4. List the 10 newest Sent Items with HTML previews.
5. Select the newest normal human-authored message whose preview contains signature or banner text, then fetch its full HTML body.
6. Retry each mailbox call once immediately on HTTP 5xx. Do not replace a failed read with defaults.

Before confirmation, provide the exact inferred Automatic Reply body and signature or banner with source timestamps. If the mailbox path fails, state `Unavailable due to mailbox error`.

Mailbox evidence proves historical wording only. It never proves that Automatic Replies are currently enabled or that a browser period is current.

## Browser output boundaries

Return current switch state, period state and dates, exact visible internal and external bodies, default signature name, backup contact when present, and leave-banner wording when present. Do not click Save or edit any control.

Use `automated out-of-office system` as the neutral signature tag unless the user chooses another value. Never invent a backup contact.
