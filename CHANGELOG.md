# Changelog

All notable changes to OOF Auto Reply are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.34] - 2026-08-06

### Fixed

- **Misleading exit code when `auth_recovery_pending=true`.** Scheduled runs blocked by the recovery flag emitted `OOF_RUN_BLOCKED outlook=unread` — implying a transient UI read failure — instead of a self-diagnosing code. All three Open-procedure outcomes during a recovery run (controls visible, auth/MFA visible, or any other page such as a stale-session redirect) now emit distinct, actionable results. The fallback to `outlook=unread` while the recovery flag is set is explicitly prohibited. Closes [#8](https://github.com/kayasax/OOF-Auto-reply/issues/8).

### Added

- **Lightweight reset path** for `auth_recovery_pending`. Users can now clear the flag without a full skill reinstall: either run the skill interactively from chat (auto-detects and clears the flag) or set `setup.auth_recovery_pending: false` in `config.json` directly. Documented in `recurring-run.md`, `HOWTO.md`, and `CONFIG-REFERENCE.md`. Closes [#8](https://github.com/kayasax/OOF-Auto-reply/issues/8).

## [0.2.33] - 2026-08-05

### Fixed

- **Wrong redirect diagnosis.** v0.2.32 checked the snapshot-reported URL to detect a /mail/ redirect — but Outlook's SPA routing can report /mail/ in snapshot URL while the settings panel is already fully rendered. Re-navigating destroyed a correctly-loaded page. The Open step now evaluates **page content only** (presence of Automatic Replies controls), never the URL. A wait+snapshot is the first recovery step; a second navigation is the last resort only when the inbox/mail-list is visible with no settings panel.

## [0.2.32] - 2026-08-05

### Fixed

- **Outlook /mail/ redirect causes OOF_RUN_BLOCKED outlook=unread.** Outlook transiently redirects the settings URL to /mail/ on first headless load. The Open step now detects this redirect and retries navigation once (redirect-recovery budget). A second redirect stops with `OOF_RUN_BLOCKED outlook=redirect-loop` instead of silently failing. Hard budget table updated from 1 to 2 navigations before comparison to reflect this.

## [0.2.31] - 2026-08-04

### Fixed

- **Critical: switch never enabled.** The Write step lacked an explicit instruction to turn ON the main Automatic Replies switch before editing dates and messages. When the switch is OFF all controls are disabled, so the automation silently failed to apply any changes. The switch is now the first step in the Write sequence, with a mandatory post-click snapshot to confirm controls are enabled before proceeding.
- **Stale away-message not detected.** The Compare mismatch rules only covered one direction (away body containing non-working-hours wording). A `non_working_hours` scenario with a stale vacation/away body now always triggers a write.
- **Wrong end time.** Added explicit Tab-after-type instruction for time comboboxes so the browser confirms the typed value before moving on.
- **Write ordering.** The Write step is now a numbered sequence: switch → schedule checkbox → dates → messages, preventing partially-applied edits when controls depend on earlier steps.

## [0.2.30] - 2026-07-18

### Changed

- Consolidated five overlapping runtime references into two purpose-specific files.
- Made `recurring-run.md` the complete scheduled contract.
- Kept setup and automation reconciliation together in `onboarding.md`.

## [0.2.14] - 2026-07-17

### Fixed

- Made stable bootstrap rendering and its self-test platform independent so the archive gate passes on Linux release runners and Windows Scout hosts.

## [0.2.13] - 2026-07-17

### Fixed

- Made the bundled contract validator independent of repository-only workflow files.
- Added a release gate that extracts and tests the exact skill archive before publishing it.

## [0.2.12] - 2026-07-17

### Fixed

- Replaced exploratory Outlook settings navigation with a direct Automatic Replies route and bounded fast path.
- Moved calendar and deterministic period calculation before browser access so Outlook is read and written once.
- Prohibited scheduled progress narration, repeated snapshots, unrelated settings exploration, and sentence-by-sentence editor changes.

## [0.2.11] - 2026-07-17

### Fixed

- Made existing headless automations self-migrate to `browserHeadless: false` through Scout's supported automation API during their next run.
- Required the already-headless migration run to stop before Outlook, with the following run starting visibly.

## [0.2.10] - 2026-07-17

### Fixed

- Required visible Scout browser execution for recurring Outlook access so account selection, sign-in, and MFA can be completed.
- Added interactive migration detection for existing automations persisted with `browserHeadless: true`.
- Added contract checks that reject headless Outlook scheduling.

## [0.2.9] - 2026-07-17

### Fixed

- Replaced local CDP, process, Scout-installation, and filesystem-profile browser coupling with supported Scout Playwright tools.
- Added redistribution contract tests that reject machine-specific browser and automation-state dependencies.
- Clarified that Microsoft Scout owns browser lifecycle, authentication state, and automation mutations.

## [0.2.8] - 2026-07-17

### Fixed

- Replaced version-specific saved automation prompts with a stable bootstrap that reads the current installed run contract on every execution.
- Corrected upgrade documentation: importing replacement files cannot rewrite a legacy prompt already persisted by Scout.
- Added explicit migration detection for automations created before the stable bootstrap.

## [0.2.7] - 2026-07-17

### Fixed

- Included organizer-owned and unanswered OOF events instead of requiring a literal accepted response.
- Blocked recurring runs when the calendar cannot be read for the full lookahead interval.
- Required calendar-derived evidence before declaring ordinary workday settings correct.
- Added a deterministic, regression-tested period calculator covering the July 17 to August 3 pre-leave scenario.
- Added a dedicated persistent Edge fallback when Scout exposes its managed browser through a debugging pipe instead of a TCP CDP port.
- Added support for the current Microsoft Scout installation path and explicit authentication and profile-lock failures.
- Kept the fallback browser open during interactive discovery so its stable profile can retain the sign-in used by scheduled runs.

## [0.2.6] - 2026-07-17

### Added

- Added this maintained changelog and release checks that require an entry for the version being packaged.

### Fixed

- Extended the last-workday Automatic Replies period through adjacent upcoming leave, weekends, and public holidays until the actual return-day work start.
- Required the Outlook end date and the return date shown in the upcoming-leave notice to agree.

## [0.2.5] - 2026-07-16

### Fixed

- Made automation setup idempotent by updating one owned automation in place instead of creating a duplicate.
- Added safe handling for stale automation IDs, conflicting matches, unexpected extra steps, and failed reconciliation.
- Added a pending setup state so an old production automation cannot run during configuration transitions.
- Restored recurring schedule properties deterministically and validated scheduled run times.

## [0.2.4] - 2026-07-16

### Fixed

- Replaced the unreliable claim that the HOWTO was opened with a clickable public HOWTO link in setup completion messages.

## [0.2.3] - 2026-07-16

### Changed

- Separated Outlook sign-in and public-holiday onboarding expectations into icon-led callouts.

## [0.2.2] - 2026-07-16

### Fixed

- Reused Outlook on the web when it was already open in the Scout-managed browser.
- Added support for responsive Outlook settings navigation, stable category selectors, bounded retries, and slower panel rendering.

## [0.2.1] - 2026-07-16

### Added

- Added a standard non-working-hours fallback reply when discovery finds no existing message.

### Fixed

- Improved detection of existing Outlook browser sessions.

## [0.2.0] - 2026-07-16

### Changed

- Refactored the skill into a concise orchestrator with focused onboarding, discovery, daily-operation, and automation references.
- Added deterministic configuration validation, automation prompt rendering, contract checks, and clean release packaging.
- Strengthened explicit confirmation gates before configuration, automation, or Outlook writes.

## [0.1.4] - 2026-07-16

### Changed

- Refined the initial skill orchestration and safety instructions.

## [0.1.3] - 2026-07-16

### Fixed

- Improved Outlook discovery reliability.

## [0.1.2] - 2026-07-16

### Fixed

- Improved Outlook discovery and first-run behavior.

## [0.1.1] - 2026-07-16

### Changed

- Expanded configuration guidance and onboarding behavior.

## [0.1.0] - 2026-07-16

### Added

- Initial public release with Outlook discovery, calendar-aware Automatic Replies, configuration guidance, update checks, documentation, and release packaging.

[Unreleased]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.34...HEAD
[0.2.34]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.33...v0.2.34
[0.2.14]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.13...v0.2.14
[0.2.13]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.12...v0.2.13
[0.2.12]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.11...v0.2.12
[0.2.11]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.10...v0.2.11
[0.2.10]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.9...v0.2.10
[0.2.9]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.8...v0.2.9
[0.2.8]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.7...v0.2.8
[0.2.7]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.6...v0.2.7
[0.2.6]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.1.4...v0.2.0
[0.1.4]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/kayasax/OOF-Auto-reply/releases/tag/v0.1.0
