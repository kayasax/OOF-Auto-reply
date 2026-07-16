---
name: "oof-auto-reply"
description: "Keep Outlook Automatic Replies aligned with calendar OOF events, public holidays, and working hours. On invocation, immediately display the welcome before reasoning or tools. Use for automatic replies, out-of-office automation, non-working-hours replies, or replacing a Power Automate OOF flow."
---

# Outlook Automatic Replies

## Purpose and boundaries

Use the user's calendar, public holidays, and Outlook web settings to maintain Automatic Replies and, when enabled, a pre-OOF signature notice.

This skill reads calendar and public holiday data. In production mode, it writes only the signed-in user's Outlook Automatic Replies, optional default signature, private `config.json`, and a schedule on the current host. In test mode, it writes only the private configuration and an optional disabled dry-run schedule. It never sends email, modifies calendar events, or disables legacy automations itself.

Use `config.json` in this folder as the only personal configuration source. It is private and must not be shared. The shareable package deliberately contains no personal configuration template.

Before each run, read `config.json`. Only a configuration with `setup.status == "complete"` and all core detected values is usable. A missing, incomplete, or provisional file is **not configuration**: never create an automation from it and never use it as a substitute for live discovery.

## Conversation cadence

**Immediate-output rule:** after loading this skill, the first visible response must be the welcome block below. Emit it before planning, analysis, checking files, calling any discovery tool, or explaining the workflow. Do not spend a reasoning turn before displaying it.

Keep setup calm and short. The welcome itself is the only progress message needed. After it, work silently until the consolidated setup summary is ready.

Never narrate browser navigation, clicks, selectors, waits, page-load retries, filtering, tool calls, raw API output, or extraction steps. Those are implementation details, not onboarding content. Surface an interim message only when the user must act, such as completing sign-in or resolving a missing required value.

## Browser efficiency contract

Treat browser automation as one deterministic read-only operation, not an exploratory conversation.

- Prefer the bundled `scripts/outlook-discovery.cjs` script when the host can attach it to the host-managed Playwright browser over CDP. The script uses fixed Outlook selectors, bounded waits, no Save actions, and one JSON result.
- Run exactly `node "<resourceDir>\\scripts\\outlook-discovery.cjs"` from the `resourceDir` returned by `m_get_skill`. The script auto-detects the host-managed CDP port and Playwright runtime. Do not search for files, inspect processes, inspect Playwright configuration, or derive a working directory first.
- If and only if that command reports no host-managed browser, call `playwright-browser_navigate` once with `https://outlook.cloud.microsoft/mail/`, then rerun the same command once. This bootstrap navigation is not exploratory.
- Do not use `playwright-browser_run_code` for this discovery. Some Scout versions classify it as file-write capable and can produce an unrelated sensitive-path permission prompt.
- OWA settings deep links may work in a normal browser while hanging or failing to render in Playwright's dedicated profile. In automated discovery, do not repeatedly navigate to deep links.
- Reuse the already-loaded authenticated Outlook mail page when one exists. An open Outlook page is healthy reusable state, not evidence of a browser-profile lock.
- The script activates the stable Fluent UI tab `button[role="tab"][value="workSchedule"]` with direct DOM `button.click()`, then waits for the Monday start-time input before extracting values. Do not replace this with a localized text locator or Playwright actionability click.
- Return the script's compact JSON result. Do not emit exploratory browser calls before or after it.
- Allow one script retry only when its structured result identifies a transient panel-load timeout. If the retry fails, report that area as unavailable and continue independent non-browser reads.
- Do not use shell process inspection or browser-lock recovery during first-run discovery unless browser launch actually fails.

Normal first-run browser discovery should complete in under 30 seconds, plus calendar, holiday, and mailbox reads.

Before showing the detected-values summary, emit this exact receipt using the real tool trace:

`OOF_BROWSER_RECEIPT script=1 retries=<0-1> exploratory_calls=0 elapsed_ms=<N>`

If `exploratory_calls` is not zero, the onboarding test has failed. Do not claim browser discovery succeeded.

## First-run onboarding

1. Show this warm welcome before reading or changing Outlook settings:

   "## 👋 Welcome

   ### Let's make your Outlook replies one less thing to think about

   > **Next:** I'll check your Outlook working hours, calendar, and holiday settings, then show you one simple summary to approve before anything is saved.
   >
   > **What to expect:** A browser will open Outlook on the web. You may need to choose your account, sign in, or complete MFA interactively. I will also retrieve public holidays from `date.nager.at`; Scout may ask you to allow that website.

   **✨ Quick and simple**

   No long setup form.

   **🛡️ Safe by design**

   I will never send email or change your calendar.

   **⏰ Ready when you are**

   Once you're happy, I'll save your private settings and set up a recurring check on this host.

   ---

   *Open-source skill maintained at [kayasax/OOF-Auto-reply](https://github.com/kayasax/OOF-Auto-reply).*"

2. Do **not** create `config.json` yet. First-run discovery is read-only and keeps detected values in memory only. If a prior incomplete or blank `config.json` exists, ignore it as stale provisional state; do not repair, save, or schedule from it.

   After the welcome, run `node "<resourceDir>\\scripts\\check-update.cjs"` once. If its JSON says `updateAvailable: true`, show one short non-blocking line with the installed and latest versions plus the release URL. If no release exists, the network call fails, or the installed version is current, continue silently. The check sends no user, mailbox, calendar, or configuration data.

3. Detect values before asking. **This detection is mandatory and identical in `production` and `test` mode.** Test mode is a write guard, not a reduced-discovery shortcut. Do not substitute unconfirmed defaults when the Outlook settings can be read.
   - In the first cohesive browser execution, open Outlook's work-hours settings in read-only mode and return the configured time zone, working days, and exact start/end time.
   - Infer a holiday country from the detected time zone and cross-check Outlook locale when available.
   - In the second cohesive browser execution, open Automatic Replies and the default-signature settings in read-only mode. Return the current Automatic Replies switch state, time-period state and dates, exact internal and external message bodies, default signature name, detected backup or escalation email address, and any existing leave-banner wording. Do not click Save or edit either setting.
   - In parallel with browser discovery, read recent Sent Items. Use the newest normal sent message containing the user's default signature to recover the exact signature body, existing leave banner, stated hours, and backup contact.
   - Search recent mailbox history for a self-generated subject matching localized `Automatic reply`/`Réponse automatique`. When Outlook hides reply editors because the switch is off, use the newest matching self-reply body as the existing Automatic Reply body. Label its source and timestamp; never report it as the live enabled state.
   - Use direct mailbox tools without exploratory searches: list the 10 newest Sent Items with HTML bodies, and search the last 30 days for `Automatic reply` plus `Réponse automatique`, then fetch only the newest matching self-generated item.
   - Mandatory selection algorithm:
     1. Get the signed-in user's email with `workiq_get_my_profile`.
     2. Call `workiq_search_emails` for the exact phrase `"outside my working hours"` over the last 30 days.
     3. From those results, choose the newest item whose sender is the signed-in user and whose subject starts with localized `Automatic reply:` or `Réponse automatique :`; call `workiq_get_email` for its full HTML body.
     4. Call `workiq_list_emails` for the 10 newest Sent Items. Choose the newest normal human-authored message whose preview contains signature/banner text; call `workiq_get_email` for its full HTML body.
     5. On HTTP 5xx, retry that mailbox call once immediately. Do not replace a failed read with defaults.
   - **Mailbox inference gate:** before showing the confirmation summary, either include the exact inferred Automatic Reply body and signature/banner with source timestamps, or state `Unavailable due to mailbox error`. Never say `No saved body found`, `Not found`, disable the banner, or invent neutral/default wording when the browser hides fields or mailbox inference failed.
   - Mailbox history proves historical wording only. Never infer that Automatic Replies are currently ON, infer a current period, or label historical bodies as live state from a self-generated reply. Current switch/period state comes only from the browser result; if unavailable, say so separately.
   - Use `automated out-of-office system` as the neutral signature tag unless the user requests another value.
   - Do not invent a backup contact. Leave it unset when it cannot be detected.
   - If a required Outlook setting cannot be read after a visible authenticated attempt, mark it as unavailable and ask for it. Do not label a made-up fallback as a detected value.

4. Produce one consolidated, concise summary containing detected values, uncertainty, the proposed reply defaults, a proposed daily schedule before the detected workday begins, and the selected mode: `production` or `test`. Include a distinct **Existing Outlook settings found** section with:
   - The exact backup contact email, or `Not found`. “Detected from existing signature” is not a valid value.
   - Automatic Replies state, its existing period if configured, and the exact existing internal and external bodies, or `No saved body found`.
   - The default signature name, plus the exact existing leave-banner wording when present.
   - A comparison of the detected banner against the proposed banner. If an existing banner is found, propose its exact wording and enabled state for confirmation instead of silently defaulting the feature to disabled.
   - The source for each unavailable value. Never report a default as detected.

5. Ask for one explicit confirmation or a single correction response. If a required value remains unknown, request only that missing value. Before writing Outlook-visible content or creating the schedule, show the exact message wording, schedule, and selected mode.

   **Hard gate:** no `config.json`, disabled dry-run automation, production automation, or Outlook-visible change may be created before this detected-values summary has been shown and the user explicitly confirms it.

6. On confirmation:
   - Write the first complete `config.json` from the detected and user-confirmed values. Replace any incomplete provisional file only now. Include `update_check: { "enabled": true, "last_notified_version": null }`.
   - In `production` mode, create the recurring schedule enabled. Use headless browser mode when the host supports it, but only after the user has completed the first visible Outlook sign-in.
   - In `test` mode, create a disabled dry-run schedule when the host supports it. Its prompt must explicitly forbid saving Automatic Replies or signatures and must say that incomplete configuration is **not** a stop condition: the dry run must first perform live read-only Outlook discovery, then calendar and holiday reads, using detected values in memory only. It may be manually run to validate scheduler dispatch, calendar and holiday reads, authenticated Outlook access, and release checking.
   - The recurring automation prompt must use explicit numbered steps and this update contract:
     1. Read the complete `config.json`.
     2. If `update_check.enabled` is not `false`, run `node "<resourceDir>\\scripts\\check-update.cjs"`.
     3. If `updateAvailable` is true and `latest` differs from `update_check.last_notified_version`, prepend exactly `OOF_UPDATE_AVAILABLE installed=<installed> latest=<latest> url=<url>` to the automation result, then persist `latest` to `update_check.last_notified_version`.
     4. If no update exists, the check is unavailable, or that version was already surfaced, do not mention updates and do not change the marker.
     5. Continue the normal OOF daily operation. A failed update check must never block Outlook/calendar processing.
   - Configure the automation notification policy as `auto`: routine current-version runs remain quiet; a new `OOF_UPDATE_AVAILABLE` result is worth surfacing. The warning contains only public release metadata and no mailbox, calendar, or configuration data.
   - Every automation run must end with `OOF_RUN_OK status=<away|workday|test> update=<none|<version>> outlook=<read|written|blocked>`.
   - Store its private identifier in `setup.host_schedule_id`, save the confirmed time in `setup.scheduled_run_time`, set `setup.mode` to the selected mode, and set `setup.status` to `complete`.
   - Explain that scheduled runs are headless, the host app must remain running, and Outlook may require an interactive browser sign-in or MFA now and again.

7. Finish with:

   For production: "🎉 You're all set! Your private settings are saved, and the recurring check is active on this host. I've opened the HOWTO so you know where to find things later."

   For test mode: "🧪 Test setup is ready! Your private settings are saved and the dry-run schedule is disabled, so it cannot change your Outlook settings. Run it manually when you want to validate the read-only path."

   Open `HOWTO.md` in the host's local document viewer immediately after this message. Do not paste the entire guide into the chat. If the host cannot open local documents, provide a direct local link to the file instead.

## Daily operation

1. Treat the host-provided current date and time as authoritative.

2. Run the scheduled update contract defined in onboarding step 6. This check is read-only, non-blocking, and warns only once per new release.

3. Fetch the current and next year from `https://date.nager.at/api/v3/PublicHolidays/{year}/{COUNTRY_CODE}` when not already cached under the configured country. Persist only the holiday dates in `holiday_cache`.

4. Read calendar events through at least 21 days ahead. A confirmed OOF day is an event with `showAs` equal to `oof` that is all-day or spans the configured working window. Ignore short timed OOF blocks such as lunch. Exclude tentative or unaccepted OOF events from the pre-OOF banner.

5. Set `away` when today is an OOF day or public holiday. Otherwise set `workday`.

6. For `away`:
   - Find the contiguous away block containing today, extending through adjacent OOF days, weekends, and public holidays.
   - Compute `return_date` as the next configured working day after the block, skipping weekends and public holidays.
   - Apply the confirmed away messages. If they remain unset, show neutral drafts and obtain explicit approval before first use.
   - Set the period from today at `00:00` to `return_date` at the configured workday start time.

7. For `workday`:
   - Set the period from today's configured workday end time through the next configured working day at the configured workday start time.
   - Apply confirmed non-working-hours messages. If unset, show neutral drafts and obtain explicit approval before first use.
   - If `non_working_hours_upcoming_oof_notice.enabled` is true and the nearest confirmed future OOF begins within `pre_oof_banner.lead_time_days`, append the configured banner wording as a separate paragraph to both non-working-hours messages. Do not apply it to away messages.

8. If `setup.mode` is `test`, perform a dry run:
   - Never stop solely because `timezone`, `working_days`, `working_hours`, `holiday_country`, or message bodies are missing in `config.json`. Test mode exists to discover and validate those values.
   - First repeat the full read-only Outlook discovery from onboarding. Treat its results as effective settings for this run without writing them back to config.
   - Fetch holidays and calendar data using the effective detected settings. When a value remains unavailable after discovery, report that exact missing value but continue every independent read-only check.
   - Use Outlook only to read the current state and confirm that authenticated browser access works. Report the current Automatic Replies state, exact current bodies, default signature name, detected backup contact, and any existing leave banner.
   - Compute and show the exact Automatic Replies period, message bodies, and banner action that production mode would apply.
   - Never toggle a switch, edit a rich-text field, edit a signature, click Save, or perform a post-save verification.
   - Report the dry run as successful only for its read-only path. State plainly that an end-to-end Outlook write requires a dedicated test mailbox or an explicit production-mode approval.

9. In `production` mode, apply Outlook settings with the appropriate browser mode:
   - Use a visible browser during onboarding and whenever an interactive user action is required.
   - Use the host's headless browser mode for routine scheduled runs only after a successful visible Outlook sign-in has established the browser session.
   - Navigate to the Outlook Automatic Replies settings page.
   - If an account picker, sign-in page, MFA prompt, or unexpected dialog appears during a headless run, stop without changing Outlook. Notify the user that an interactive sign-in is required, then require the next run to use a visible browser. Do not attempt to complete or bypass authentication headlessly.
   - Enable Automatic Replies and the scheduled period, set the dates and times, update internal and external rich-text message bodies, and save.
   - For rich-text editors, update HTML through the browser's supported editor interaction and dispatch an input event so Outlook persists the change.

10. Reopen or refresh the Automatic Replies page and verify that the switch, period, and message bodies match the intended values. Stop and report a failure if verification does not match. Do not retry indefinitely.

11. If `pre_oof_banner.enabled` is true:
   - Find the nearest confirmed future OOF block within the lead window.
   - Insert the approved banner at the start of the default signature only while that block is upcoming.
   - Remove an old banner if its dates are stale, the leave was cancelled, or the leave has started.
   - Keep the banner wording and the optional non-working-hours notice derived from the same configuration field.

12. Detect a possible competing legacy flow when Outlook settings revert between runs. Reapply the intended settings, explain the likely conflict, and wait for the user to disable the old flow. Set `legacy_flow_disabled_by_user` only after user confirmation.

## Browser lock recovery

Run lock recovery only after an actual browser-launch error explicitly reports a locked profile. A visible or already-open Outlook page is not a lock. When a real lock error occurs, identify only processes whose command line contains the host's Playwright profile path, such as `ms-playwright\mcp-msedge`, close those processes, then retry once. Never close an authenticated page merely because it is open, never close all Edge processes, and never use name-only process termination.

## Run summary

Report the computed status, exact scheduled reply period, computed return date when away, pre-OOF banner state, whether an upcoming-leave notice was added, and any issue requiring action. Do not expose private calendar details beyond what is necessary for the signed-in user.
