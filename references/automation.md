# Recurring automation contract

Create or update an automation only after explicit confirmation and only from `scripts/render-automation.cjs` output. The rendered prompt is a stable bootstrap. It reads `references/recurring-run.md` from the installed skill on every execution, so later skill replacements update runtime behavior without rewriting the saved automation prompt.

## Host schedule

- Use the exact name `OOF Auto Reply`.
- Use the exact managed description `[oof-auto-reply] Keeps Outlook Automatic Replies aligned with calendar OOF events, public holidays, and working hours.`
- Production schedules are enabled.
- Test schedules are disabled and read-only when manually run.
- Use notification policy `auto`: routine runs remain quiet, while a new release notice or action-required failure is worth surfacing.
- Store the private schedule identifier in `setup.host_schedule_id`.
- Scheduled execution uses a visible Scout-managed browser (`browserHeadless: false`) so account selection, sign-in, and MFA can be completed when Microsoft requires them.

## Idempotent reconciliation

After the user confirms the complete setup or schedule change:

1. Generate the exact prompt and deterministic schedule before calling any mutation tool. Convert `working_days` in configured order to full English day names. Use `every weekday at <time>` for Monday through Friday, `daily at <time>` for all seven days, or `every <day-list> at <time>` otherwise. Convert confirmed 24-hour `HH:MM` to Scout's 12-hour form, such as `8:30am` or `6pm`.
2. If `setup.host_schedule_id` is present, call `m_get_automation` with that ID. Treat a returned automation as owned only when its name is exactly `OOF Auto Reply`. If the ID is missing, stale, or points to another name, continue to discovery without updating it.
3. Call `m_list_automations`, then call `m_get_automation` for every exact-name `OOF Auto Reply` result. Candidate matches have the managed description above, the legacy description `Keeps Outlook Automatic Replies aligned with calendar OOF events, public holidays, and working hours.`, a first prompt beginning `OOF Auto Reply recurring run, confirmed mode:`, or a first prompt beginning `OOF Auto Reply stable bootstrap.`. The valid stored-ID match remains a candidate even if its description or prompt was edited.
4. Deduplicate candidates by ID. Any exact-name result that is not a candidate is an ownership conflict. If multiple candidates exist, or any ownership conflict exists, do not create, update, disable, delete, or write configuration. Stop with `OOF_SETUP_BLOCKED automation=duplicate`, tell the user that conflicting `OOF Auto Reply` automations exist, and ask them to keep one owned automation in Scout before rerunning setup.
5. If the one candidate has anything other than exactly one step, do not mutate it or write configuration. Stop with `OOF_SETUP_BLOCKED automation=steps` and ask the user to restore or remove the edited automation in Scout. The update API cannot safely remove extra steps.
6. If exactly one safe candidate exists, first call `m_update_automation` with only its ID and `enabled: false`. Require `success: true` before writing configuration. This prevents an old production prompt from running during a mode or settings transition.
7. Write the complete confirmed configuration with `setup.status: "pending_automation"` while preserving the candidate ID. Then call `m_update_automation` for that ID with the exact name, managed description, rendered prompt, deterministic schedule, mode-specific enabled state, `triggerType: "schedule"`, `oneShot: false`, `browserHeadless: false`, and `teamsNotify: "auto"`. If this update fails, leave the automation disabled, report `OOF_SETUP_BLOCKED automation=update`, and do not claim setup completed.
8. If no exact-name result exists, write the complete confirmed configuration with `setup.status: "pending_automation"`, then call `m_create_automation` with the same desired fields. If creation fails, report `OOF_SETUP_BLOCKED automation=create` and do not claim setup completed.
9. Require `success: true` from every mutation. That success acknowledgement is authoritative for supplied write-only fields that `m_get_automation` omits, including `triggerType`, `oneShot`, `browserHeadless`, and `teamsNotify`; if the mutation response returns any of them, also require the requested value. Immediately persist the returned automation ID to `setup.host_schedule_id` while setup remains pending so a failed verification cannot orphan a created automation. Re-read with `m_get_automation` and verify the exact name, managed description, one step, rendered prompt, mode-specific enabled state, and parsed schedule. Only after successful verification set `setup.status: "complete"`. If verification or the final configuration write fails, disable the automation and report `OOF_SETUP_BLOCKED automation=verify`.

Never use name alone to update an automation whose description is neither the managed nor legacy description unless its ID is the valid ID already stored in this skill's private configuration. Never delete an automation automatically.

## Browser-mode migration

On every interactive invocation with complete setup, read the owned automation. If `browserHeadless` is not explicitly `false`, explain that Outlook authentication requires a visible Scout browser and ask for explicit confirmation to update only that automation to `browserHeadless: false`. Do not wait for a settings change or full onboarding. After confirmation, call `m_update_automation`, require `success: true`, then re-read and verify the value when the API exposes it. Never edit Scout's private automation files.

## Required run contract

The generated bootstrap requires the automation to read the current installed `references/recurring-run.md`. That live file enforces these steps:

1. Read the complete private configuration.
2. Validate it with `scripts/config-status.cjs`.
3. Check the public latest release without blocking Outlook or calendar work.
4. Emit a prominent `🔔 OOF_UPDATE_AVAILABLE` notice only when the release is newer and differs from `update_check.last_notified_version`, then persist that version.
5. Stop incomplete setup with `OOF_RUN_BLOCKED setup=incomplete` and never perform onboarding from a schedule.
6. Run Outlook discovery through Scout's supported Playwright tools, skipping Work Hours during scheduled execution.
7. Perform the daily operation in the confirmed mode.
8. End with `OOF_RUN_OK status=<away|workday|test> update=<none|version> outlook=<read|written|blocked>`.

A failed update check is silent and non-blocking. Never claim a release exists based only on the update endpoint result during development or publishing. Confirm publication with `gh release view` before reporting it.

## Upgrade behavior

Replacing skill files does not execute the skill and cannot mutate a prompt already persisted by Scout. Automations created before the stable bootstrap therefore require one explicit interactive setup run to migrate their saved prompt. After that migration, future replacements update `references/recurring-run.md`, which the unchanged bootstrap reads on every run. Never claim that importing a release rewrites a legacy saved automation.
