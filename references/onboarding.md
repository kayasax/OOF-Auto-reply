# Setup and configuration changes

Use this file only for first-time setup or an explicit configuration change. Scheduled runs use only `recurring-run.md`.

## Discover, read-only

After the welcome:

1. Run the release check and configuration status scripts.
2. Read Outlook Work Hours, Automatic Replies, and the default signature with Scout's supported Playwright tools. Use one direct navigation per settings page, accessible controls, and no browser code, tab exploration, or local browser manipulation.
3. Read calendar coverage for today through 21 days ahead and cached public holidays.
4. Identify the signed-in user. Find the newest self-sent Automatic Reply from the last 30 days using localized `Automatic reply:` or `Réponse automatique :` subjects and fetch its complete HTML body. Also fetch the complete newest normal self-sent message containing signature or banner text. Include source timestamps and retry each mailbox read once on HTTP 5xx. Mailbox evidence proves historical wording only.
5. Never edit Outlook, send mail, change calendar events, write `config.json`, or create an automation during discovery.

If browser-visible wording is unavailable, use the newest automatic reply sent by the signed-in user in the last 30 days. Historical mail proves wording only, not current switch or schedule state. If mailbox inference fails, say `Unavailable due to mailbox error`.

## Show one confirmation

Present one concise summary containing:

- time zone, working days, and hours;
- holiday country;
- production or test mode and proposed run time;
- exact internal and external away messages;
- exact internal and external non-working-hours messages;
- backup contact;
- current Automatic Replies switch, period, and visible bodies;
- default signature and proposed leave banner;
- every uncertainty.

If no historical non-working-hours message exists, propose this fallback, rendered with the detected schedule and confirmed backup contact:

> Thank you for your message!
>
> Please note I am out of the office with no access to my email / outside business hours ({WORKDAYS} {START} - {END} {TZ_ABBR}).
>
> If your message requires immediate assistance, I'm kindly asking you to send a message to [{backup_contact_email}](mailto:{backup_contact_email}) mailbox, so that your request can be directed to another available engineer.

Ask for one explicit confirmation or correction. Before explicit confirmation, write nothing.

## Save confirmed setup

1. Generate the saved prompt with `scripts/render-automation.cjs`. Never hand-write it.
2. If `setup.host_schedule_id` exists, read it first and treat it as owned only when its name is exactly `OOF Auto Reply`. List and read every exact-name automation. A candidate is the valid stored-ID match, an automation with the managed or legacy description, or one whose first prompt begins `OOF Auto Reply recurring run, confirmed mode:` or `OOF Auto Reply stable bootstrap.`. Deduplicate by ID.
3. Any other exact-name result is an ownership conflict. If a conflict exists or more than one candidate remains, make no mutation or configuration write and stop with `OOF_SETUP_BLOCKED automation=duplicate`. Never delete automatically.
4. Require exactly one step on an existing candidate. Otherwise stop with `OOF_SETUP_BLOCKED automation=steps`.
5. Disable one safe existing candidate with an ID-only update before changing configuration and require `success: true`.
6. Write confirmed `config.json` with `setup.status: pending_automation`, `setup.auth_recovery_pending: false`, and the candidate ID when one exists.
7. Update the candidate in place, or create one only when none exists, using:
   - name `OOF Auto Reply`;
   - description `[oof-auto-reply] Keeps Outlook Automatic Replies aligned with calendar OOF events, public holidays, and working hours.`;
   - the rendered one-step prompt;
   - the deterministic confirmed schedule;
   - `triggerType: schedule`, `oneShot: false`, `browserHeadless: true`, and `teamsNotify: auto`;
   - enabled in production, disabled in test mode.
8. Require `success: true` from every mutation. Treat it as authoritative for supplied write-only fields omitted by the read API, including `triggerType`, `oneShot`, `browserHeadless`, and `teamsNotify`. Persist the returned ID immediately while setup remains pending, re-read the automation, and verify name, description, one step, prompt, enabled state, and schedule.
9. Only then set `setup.status: complete`. On failure, keep setup incomplete, disable the automation, and report the matching `OOF_SETUP_BLOCKED` code.

Production normally runs headlessly. A scheduled run moves itself temporarily to visible mode only for sign-in or MFA, then restores headless mode through the recovery flow in `recurring-run.md`.
