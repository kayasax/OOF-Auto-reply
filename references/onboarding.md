# First-run onboarding

Use this reference only for first-run setup or an explicitly requested configuration change.

## Read-only discovery

1. Run the public release check after the welcome. A failure or missing release is silent and never blocks setup.
2. Do not create, repair, or normalize `config.json`. Ignore any blank, incomplete, or provisional file during discovery.
3. Detect the same values in production and test mode. Test mode changes write behavior, not discovery quality.
4. Read Outlook Work Hours, Automatic Replies, and default signature through the deterministic discovery flow.
5. Infer the holiday country from the detected time zone and cross-check the Outlook locale when available.
6. In parallel, read calendar, public holidays, and the mandatory mailbox evidence described in [outlook-discovery.md](outlook-discovery.md).

## Consolidated summary

Show one concise summary containing:

- detected time zone, working days, and exact start and end times;
- inferred holiday country and its evidence;
- selected `production` or `test` mode;
- proposed daily run time before the detected workday begins;
- exact proposed internal and external wording for away and non-working-hours replies;
- proposed pre-OOF signature banner wording and enabled state;
- every uncertainty and its source.

Include a distinct **Existing Outlook settings found** section with:

- exact backup contact email, or `Not found`;
- browser-reported Automatic Replies state and period;
- exact current browser-visible internal and external bodies;
- exact historical reply body and timestamp when mailbox inference was required;
- default signature name and exact current or historical leave-banner wording;
- comparison of the existing banner with the proposed banner.

If mailbox inference fails, say `Unavailable due to mailbox error`. Do not say `No saved body found`, silently disable a banner, or invent replacement wording.

### Non-working-hours fallback

If browser discovery and mandatory mailbox inference find no existing non-working-hours body, propose this fallback for both internal and external replies:

> Thank you for your message!
>
> Please note I am out of the office with no access to my email / outside business hours ({WORKDAYS} {START} - {END} {TZ_ABBR}).
>
> If your message requires immediate assistance, I'm kindly asking you to send a message to [{backup_contact_email}](mailto:{backup_contact_email}) mailbox, so that your request can be directed to another available engineer.

Render `{WORKDAYS}`, `{START}`, `{END}`, and `{TZ_ABBR}` from browser-detected work settings. Use `{backup_contact_email}` only when discovery found a backup contact. If it remains unknown, ask for it at the confirmation gate. This is a proposed default only and must be shown exactly before it is saved.

## Explicit confirmation gate

Ask for one explicit confirmation or one correction response. If a required value is unknown, ask only for that value. The confirmation request must include the exact Outlook-visible wording, private schedule, mode, and settings that will be saved.

Until the user explicitly confirms this summary:

- do not create or modify `config.json`;
- do not create an enabled or disabled schedule;
- do not write to Outlook;
- do not treat defaults as confirmed values.

## After confirmation

1. Generate the automation prompt with `scripts/render-automation.cjs`; do not hand-rewrite it.
2. Discover and validate existing automation candidates exactly as defined in [automation.md](automation.md) before writing `config.json`. Multiple or unsafe matches stop without any mutation or configuration write.
3. For one safe candidate, disable it before changing configuration. For no candidate, no automation mutation occurs before the configuration write.
4. Write the complete confirmed `config.json` with `update_check: { "enabled": true, "last_notified_version": null }`. Set `setup.mode` and `setup.scheduled_run_time` to the confirmed values, but keep `setup.status: "pending_automation"` so no scheduled prompt can write Outlook during the transition. Preserve a safe candidate's `setup.host_schedule_id` until reconciliation finishes.
5. Reconcile the automation exactly as defined in [automation.md](automation.md). Update one owned existing automation in place and create a new one only when none exists. A failed update remains disabled and never reports successful setup.
6. In production mode, reconcile the recurring schedule as enabled with `browserHeadless: true`. Outlook may temporarily require a visible follow-up run for interactive account selection, sign-in, or MFA.
7. Initialize `setup.auth_recovery_pending` to `false`. This optional runtime field does not change `schema_version: 1`.
8. In test mode, reconcile a disabled dry-run schedule. It must remain read-only even when manually run.
9. Immediately after successful creation or update, store the returned host schedule identifier while setup remains pending. After successful automation verification, set `setup.status: "complete"`. If reconciliation fails, leave setup incomplete with the identifier retained for recovery and the automation disabled.
10. Explain that the host must remain running and that Outlook may occasionally require visible sign-in or MFA.
