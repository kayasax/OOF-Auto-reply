# Recurring automation contract

Create an automation only after explicit confirmation and only from `scripts/render-automation.cjs` output.

## Host schedule

- Production schedules are enabled.
- Test schedules are disabled and read-only when manually run.
- Use notification policy `auto`: routine runs remain quiet, while a new release notice or action-required failure is worth surfacing.
- Store the private schedule identifier in `setup.host_schedule_id`.
- Scheduled execution uses headless browser mode only after a successful visible Outlook sign-in.

## Required run contract

The generated prompt enforces these steps:

1. Read the complete private configuration.
2. Validate it with `scripts/config-status.cjs`.
3. Check the public latest release without blocking Outlook or calendar work.
4. Emit a prominent `🔔 OOF_UPDATE_AVAILABLE` notice only when the release is newer and differs from `update_check.last_notified_version`, then persist that version.
5. Stop incomplete setup with `OOF_RUN_BLOCKED setup=incomplete` and never perform onboarding from a schedule.
6. Run Outlook discovery with `--mode=scheduled`, which skips Work Hours.
7. Perform the daily operation in the confirmed mode.
8. End with `OOF_RUN_OK status=<away|workday|test> update=<none|version> outlook=<read|written|blocked>`.

A failed update check is silent and non-blocking. Never claim a release exists based only on the update endpoint result during development or publishing. Confirm publication with `gh release view` before reporting it.
