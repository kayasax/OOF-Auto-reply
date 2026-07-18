# Changelog

All notable changes to OOF Auto Reply are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.24] - 2026-07-18

### Fixed

- Added deterministic plain-text renderer fields that preserve template paragraph breaks.
- Kept whitespace-collapsed canonical fields exclusively for post-write verification.
- Refreshed the away messages with concise, more natural wording.

## [0.2.23] - 2026-07-18

### Fixed

- Preserved the original start of a contiguous weekend, holiday, and leave block on later daily runs.
- Reduced scheduled Outlook discovery to one current tab, one direct navigation, and one snapshot.
- Made inbox redirects, logo-only pages, missing controls, and missing Save buttons hard read failures.
- Prohibited tab reuse, navigation retries, mental date replacement, and autosave inference.

## [0.2.22] - 2026-07-17

### Fixed

- Added explicit private authentication-recovery state instead of guessing browser mode from omitted automation fields or window visibility.
- Stopped scheduled authentication recovery immediately with user guidance and prohibited inspecting unrelated browser tabs.
- Kept the optional state backward-compatible with schema version 1.

## [0.2.21] - 2026-07-17

### Fixed

- Replaced raw success-contract output with a concise human-readable run summary.
- Kept structured blocked codes only for actionable failures with plain-language guidance.

## [0.2.20] - 2026-07-17

### Fixed

- Limited visible executions to authentication recovery only.
- Restored headless mode immediately when Outlook controls become accessible, before calendar reads or Outlook writes.

## [0.2.19] - 2026-07-17

### Fixed

- Treated Outlook Automatic Reply editor input as plain text and preserved repository URLs literally.
- Removed unsupported HTML-anchor and rich-text hyperlink creation requirements.

## [0.2.18] - 2026-07-17

### Fixed

- Restored headless recurring execution with temporary visible runs only when Microsoft authentication is required.
- Restored headless mode automatically after a verified visible authentication run.
- Required configured HTML anchors to be created and verified as semantic Outlook hyperlinks rather than plain text.

## [0.2.17] - 2026-07-17

### Fixed

- Normalized whitespace when verifying Outlook editor accessibility text.
- Treated merged paragraphs and omitted accessibility line breaks as formatting differences rather than missing content.
- Prevented unnecessary rewrites when every expected sentence is already present in order.

## [0.2.16] - 2026-07-17

### Fixed

- Added deterministic message rendering from the current private configuration and computed period.
- Rejected false away-body matches based on template labels, partial phrases, working-hours text, or pre-OOF banners.
- Required complete editor text comparison after every Outlook write.

## [0.2.15] - 2026-07-17

### Fixed

- Replaced normal after-hours bodies with dedicated away bodies when the reply period flows directly into confirmed leave.
- Prevented pre-OOF notices from being appended to away replies.
- Added dynamic reply-period variables and a regression for the July 17 through August 3 leave period.

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

[Unreleased]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.22...HEAD
[0.2.22]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.21...v0.2.22
[0.2.21]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.20...v0.2.21
[0.2.20]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.19...v0.2.20
[0.2.19]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.18...v0.2.19
[0.2.18]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.17...v0.2.18
[0.2.17]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.16...v0.2.17
[0.2.16]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.15...v0.2.16
[0.2.15]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.14...v0.2.15
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
