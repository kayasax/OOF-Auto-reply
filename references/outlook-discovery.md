# Outlook and mailbox discovery

## Browser execution

Treat browser discovery as one bounded read-only operation.

1. Use Scout's `playwright-browser_navigate`, `playwright-browser_snapshot`, `playwright-browser_click`, `playwright-browser_type`, and `playwright-browser_press_key` tools. Do not launch a browser process, inspect process command lines, attach through CDP, select a local profile, or load Playwright from Scout installation files.
2. Navigate once to `https://outlook.cloud.microsoft/mail/` and reuse that Scout-managed page. Do not repeatedly navigate to settings deep links.
3. If Scout shows Microsoft sign-in or MFA during an interactive run, wait for the user to complete it in the visible Scout-managed browser. During a scheduled headless run, stop with `OOF_RUN_BLOCKED outlook=authentication-required`.
4. Open Settings from the current Outlook page. Use snapshots and accessible names to select Calendar, Work hours and location, Account, Automatic replies, and Signatures. The labels may be localized.
5. On interactive onboarding, read time zone, selected working days, and start and end times from Work hours and location. On scheduled runs, skip Work hours and use only the confirmed configuration.
6. Read the Automatic Replies switch, scheduled-period controls, internal body, external-send toggle, external body, and the configured default signature. Do not click Save or change any value during discovery.
7. Never use `playwright-browser_run_code`, arbitrary JavaScript evaluation, browser installation, filesystem browser profiles, or OS process inspection.
8. Allow one retry only after a fresh snapshot shows that the expected Outlook settings panel is still loading. If the second snapshot cannot expose the required controls, stop with `OOF_RUN_BLOCKED outlook=unread`.

Before the detected-values summary, emit:

`OOF_BROWSER_RECEIPT scout_tools=1 retries=<0-1> run_code=0 elapsed_ms=<N>`

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
