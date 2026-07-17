# Changelog

All notable changes to OOF Auto Reply are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.7...HEAD
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
