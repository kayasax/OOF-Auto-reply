# Changelog

Notable user-visible changes to OOF Auto Reply are documented here. Internal debugging steps and intermediate corrections remain available in Git history rather than being repeated as releases.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.30] - 2026-07-18

### Added

- Added deterministic calculation of Automatic Replies periods from working hours, OOF calendar events, weekends, and public holidays.
- Added distinct normal after-hours and full-away messages, with paragraph-preserving rendering and canonical post-write verification.
- Added optional pre-OOF signature banners, safe automation reconciliation, authentication recovery, update notifications, and clean release packaging.

### Changed

- Reduced the runtime documentation to two focused contracts: `onboarding.md` for setup and explicit changes, and `recurring-run.md` for scheduled execution.
- Made recurring runs headless by default, with visible browser use limited to Microsoft authentication.
- Made the saved Scout automation load the current installed run contract so replacement upgrades do not require recreating the schedule.
- Replaced exploratory Outlook interaction with bounded calendar reads, direct settings routes, complete value comparison, and explicit post-write verification.

### Fixed

- Preserved the start of contiguous leave periods and calculated the actual return-day work start across weekends, holidays, and adjacent OOF events.
- Preserved message paragraphs and literal repository URLs when writing Outlook editors.
- Supported modern deferred Save behavior and classic Save, Enregistrer, OK, and Apply controls without assuming autosave.
- Prevented duplicate automations, incomplete calendar coverage, repeated navigation, uncontrolled browser retries, and writes after ambiguous failures.
- Restored headless mode automatically after authentication and kept test mode read-only.

## [0.2.0] - 2026-07-16

### Added

- Added deterministic configuration validation, automation prompt rendering, contract checks, and clean release packaging.
- Added explicit confirmation gates before configuration, automation, or Outlook writes.

### Changed

- Refactored the initial skill into a concise orchestrator with dedicated runtime guidance.

## [0.1.0] - 2026-07-16

### Added

- Initial public release with Outlook discovery, calendar-aware Automatic Replies, configuration guidance, update checks, documentation, and release packaging.

[Unreleased]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.30...HEAD
[0.2.30]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.2.0...v0.2.30
[0.2.0]: https://github.com/kayasax/OOF-Auto-reply/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/kayasax/OOF-Auto-reply/releases/tag/v0.1.0
