# Recurring run contract

This file is the live contract for the stable recurring automation bootstrap. Skill replacement updates this file without requiring the saved Scout automation prompt to change.

## Execution

1. Resolve this skill's current `resourceDir` from the path supplied by the bootstrap prompt.
2. Read the complete private `config.json` beside `SKILL.md`.
3. Run `node "<resourceDir>\scripts\config-status.cjs" --config="<resourceDir>\config.json"`. If `usable` is not `true`, stop with `OOF_RUN_BLOCKED setup=incomplete`. Never perform onboarding from this schedule.
4. Read the owned automation using `setup.host_schedule_id` and `m_get_automation`. Require the exact name `OOF Auto Reply` and exactly one step. If `browserHeadless` is not explicitly `false`, call `m_update_automation` for that ID with only `browserHeadless: false`. Require `success: true`; if the response exposes `browserHeadless`, require `false`. Stop the current run with `OOF_RUN_BLOCKED outlook=browser-mode-migrated next=visible`. Do not attempt Outlook in the already-headless execution. Never edit Scout's private automation files. The next manual or scheduled run starts with the visible Scout-managed browser.
5. Use `setup.mode` from the validated configuration as the only run mode. It must be `production` or `test`.
6. If `update_check.enabled` is not `false`, run `node "<resourceDir>\scripts\check-update.cjs"`. If `updateAvailable` is true and `latest` differs from `update_check.last_notified_version`, prepend `🔔 OOF_UPDATE_AVAILABLE installed=<installed> latest=<latest> url=<url>` and persist `latest` to `update_check.last_notified_version`. Otherwise remain silent and do not change the marker. A failed update check never blocks later steps.
7. Read `references/outlook-discovery.md`, then use only Scout's supported Playwright browser tools to read Outlook settings. Scheduled discovery skips Work Hours and uses the confirmed timezone, working days, and working hours from the configuration. Never launch or attach to a browser from Node.js, use a filesystem browser profile, inspect processes, or use `playwright-browser_run_code`. If discovery fails, stop with `OOF_RUN_BLOCKED outlook=unread`; never substitute stale Outlook state.
8. Read `references/daily-operation.md` from the current installed skill.
9. Call the host calendar-read capability for an explicit interval from today through at least 21 days ahead. Outlook Automatic Replies settings are not calendar evidence. If that read fails or does not cover the interval, stop with `OOF_RUN_BLOCKED calendar=unread`.
10. Treat a non-cancelled `showAs=oof` event as eligible unless declined or tentative. Include organizer-owned, accepted, no-response, and unanswered events. Do not require the literal response value `accepted`.
11. Run `node "<resourceDir>\scripts\compute-period.cjs"` with today's local date, confirmed working days and hours, eligible OOF dates, and holiday dates. Use its JSON output as authoritative. Do not calculate the expected period mentally.
12. Render exact bodies from `returnDate` and `messageVariant`, then compare them with Outlook. Never report no write required until the successful calendar read has produced coverage end, nearest eligible OOF block or `none`, traversed non-working dates, expected start, expected end, return date, and message variant.
13. In `test` mode, perform a read-only dry run. Never toggle, edit, save, or verify an Outlook write.
14. In `production` mode, perform the confirmed operation, then reopen Outlook settings and verify the saved state.
15. End with `OOF_RUN_OK status=<away|workday|test> update=<none|version> outlook=<read|written|blocked>`.

Ordinary workday settings are not expected when next-day traversal joins a weekend or public holiday to eligible upcoming leave. Never continue after an unread calendar or Outlook state.
