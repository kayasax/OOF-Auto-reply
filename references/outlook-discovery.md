# Outlook and mailbox discovery

## Browser execution

Treat scheduled Outlook access as one deterministic operation after calendar calculation. Do not narrate progress, describe snapshots, search settings categories, or reason aloud between tool calls.

## Scheduled fast path

1. Use the current browser tab only. Never call the tabs tool, enumerate tabs, select another tab, or reuse a page left by an earlier run. Navigate exactly once to `https://outlook.cloud.microsoft/mail/options/accounts-category/automaticReply` with `playwright-browser_navigate`.
2. Take exactly one `playwright-browser_snapshot`. Do not wait and snapshot again. The snapshot is classified once using the rules below.
3. If Microsoft account selection, sign-in, or MFA is visible during a normal run, do not wait or attempt credentials. Follow the recurring contract: set only the owned automation's `browserHeadless` field to `false`, persist `setup.auth_recovery_pending: true`, then stop. A recovery run with authentication still visible also stops immediately. Never inspect another tab or reuse another Outlook session. After the user authenticates in that exact Scout browser and reruns, Automatic Replies controls prove authentication; restore `browserHeadless: true`, clear the recovery state, and stop before normal work.
4. The snapshot is usable only when it contains the Automatic Replies switch, scheduled-period controls, both date fields, internal editor, external-send toggle, external editor, and Save or Enregistrer button. If any required control is absent, or the final URL is the mailbox, inbox, login shell without a recognized authentication control, Microsoft-logo-only, loading-only, or another settings page, stop with `OOF_RUN_BLOCKED outlook=unread`. Do not click category tabs, retry the URL, wait for another snapshot, switch tabs, infer hidden controls, or infer autosave.
5. Read the enabled switch, scheduled-period controls, internal body, external-send toggle, and external body from that snapshot. Capture the complete visible text of both editors. Do not summarize either body as a template name or banner state.
6. Normal scheduled discovery is exactly one navigation, zero tab operations, zero category clicks, and one snapshot. Authentication recovery uses the same limits. If required controls are unavailable, stop with `OOF_RUN_BLOCKED outlook=unread`.

## Scheduled write and verification

Use the refs from the final fast-path snapshot. Do not rediscover the page.

1. Change only values that differ from the calculator output and rendered bodies.
2. For each rich-text body that differs: click its editor, press `Control+A` with `playwright-browser_press_key`, then enter the renderer's `internalPlainText` or `externalPlainText` once with `playwright-browser_type`. Preserve its newlines exactly so every template paragraph remains a separate paragraph. Never append or edit sentence by sentence. Treat this automation path as plain text. Preserve every literal URL exactly, including `https://github.com/kayasax/OOF-Auto-reply`. Do not emit HTML tags and do not attempt `Control+K` rich-text link creation.
3. Set the switch, scheduled period, start, end, external-send toggle, and bodies only from calculator and renderer output, then use `playwright-browser_click` on the Save or Enregistrer ref from the original snapshot exactly once. If that ref was absent, stop before the first edit with `OOF_RUN_BLOCKED outlook=unread`. Never infer that this page autosaves.
4. Navigate once to the same direct Automatic Replies URL and take one snapshot. Verify the exact switch and period. For each editor, take its complete accessibility text, collapse every whitespace run to one space, remove spaces immediately before punctuation, and trim both ends. Compare that normalized value with the renderer's `internalCanonicalText` or `externalCanonicalText`. Outlook accessibility may merge adjacent paragraphs, omit visual line breaks, or expose the text as one node; those differences are not missing content. Never require a paragraph, line break, or separate accessibility node. If normalized full-text equality is unavailable but every complete expected sentence appears in order and no unexpected sentence appears, verification succeeds. Literal URLs are content and must appear exactly in the visible text; do not require a semantic link role. A template label or isolated phrase alone is not verification. If an `away` body contains `working hours`, `outside business hours`, `Heads up`, or calendar-banner wording, verification fails. Do not rewrite or retry merely because paragraph boundaries differ. Do not retry a failed save more than once.
5. Only when the confirmed pre-OOF banner is enabled and its expected body differs, navigate directly to `https://outlook.cloud.microsoft/mail/options/accounts-category/signatures-subcategory`, update only the configured default signature, save once, and verify once.

## Interactive onboarding only

Scheduled runs skip Work hours entirely. Working-hours discovery is available during onboarding only: navigate directly to `https://outlook.cloud.microsoft/mail/options/calendar/workHoursAndLocation`, take one snapshot, and read time zone, selected working days, and start and end times. If controls are not visible, click Calendar or Calendrier once and Work hours and location or Horaires et lieu de travail once, then take one final snapshot.

## Prohibitions

- Recurring OOF automations normally run with `browserHeadless: true`. Visible mode is temporary and used only to complete account selection, sign-in, or MFA.
- Never use `playwright-browser_run_code`, arbitrary JavaScript evaluation, browser installation, filesystem browser profiles, or OS process inspection.
- Never use trial-and-error navigation, repeated snapshots, tab listing or selection, process exploration, or commentary such as “let me find,” “checking,” “need to,” or “I can see.”

Before the detected-values summary, emit discovery and optional verification counts separately:

`OOF_BROWSER_RECEIPT fast_path=1 discovery_navigations=1 discovery_snapshots=1 verification_navigations=<0|1> verification_snapshots=<0|1> tab_operations=0 category_clicks=0 run_code=0 elapsed_ms=<N>`

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
