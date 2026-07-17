# Configuration reference

`config.json` is generated only after onboarding has detected settings and the user has confirmed the single setup summary. It is personal, local, and gitignored. You should rarely need to edit it directly. A blank or incomplete file is never valid setup state and must not trigger automation creation.

## Setup fields

| Field | Meaning |
| --- | --- |
| `schema_version` | Configuration format version. |
| `setup.status` | `not_started` until onboarding is complete, then `complete`. |
| `setup.mode` | `production` writes Outlook settings during scheduled runs. `test` performs read-only dry runs only. |
| `setup.scheduled_run_time` | The confirmed local time for the recurring run. |
| `setup.host_schedule_id` | The current host's private schedule identifier. Do not copy it to another host. |
| `setup.auth_recovery_pending` | Optional runtime state. `true` means the next run is visible authentication recovery only. Missing is equivalent to `false`; schema version 1 remains compatible. |

## Update-check fields

| Field | Meaning |
| --- | --- |
| `update_check.enabled` | Runs the public GitHub release check during every scheduled OOF automation run. Defaults to `true`. |
| `update_check.last_notified_version` | Latest release version already surfaced by the automation. Prevents repeated daily warnings. |

## Personal settings

| Field | Meaning |
| --- | --- |
| `timezone` | IANA time zone such as `Europe/Paris`. Detected from Outlook where possible. |
| `working_days` | Working days, using `Mon` through `Sun`. |
| `working_hours.start` / `.end` | Normal work window in 24-hour `HH:MM` form. |
| `holiday_country` | Two-letter country code used with Nager.Date, such as `FR`, `GB`, or `US`. |
| `backup_contact_email` | Optional contact suggested to senders who need urgent assistance. |
| `signature_tag` | Neutral explanatory text optionally placed in automated messages. |
| `legacy_flow_disabled_by_user` | Set to `true` only after the user confirms any old competing flow is disabled. |

## Optional leave notice

| Field | Meaning |
| --- | --- |
| `pre_oof_banner.enabled` | Shows a short leave notice in the default Outlook signature before confirmed leave. Disabled by default. |
| `pre_oof_banner.lead_time_days` | Number of calendar days before leave that the banner begins. |
| `pre_oof_banner.wording` | Approved banner text or HTML. |
| `non_working_hours_upcoming_oof_notice.enabled` | Appends the same leave notice only when the selected reply remains a normal non-working-hours reply. It never modifies an away reply. |

## Message fields

The four `messages` values are optional HTML message bodies:

| Field | Used for |
| --- | --- |
| `away_internal` | Internal senders while away. |
| `away_external` | External senders while away. |
| `non_working_hours_internal` | Internal senders outside working hours. |
| `non_working_hours_external` | External senders outside working hours. |

`null` means the skill proposes a neutral default during onboarding or the next explicit wording review. It must not silently invent personalized final wording.

When no historical non-working-hours body is found, onboarding proposes the standard fallback documented in [references/onboarding.md](references/onboarding.md). Its work schedule and backup address remain template variables until detected and explicitly confirmed.

## Automatic cache

`holiday_cache` stores public-holiday dates by country and year. The skill refreshes a missing year or a country that changed. You normally never need to edit it.

## Template variables

The message and banner wording fields support these variables:

| Variable | Resolves to |
| --- | --- |
| `{return_date}` | First working day after the away block, excluding weekends and holidays. |
| `{start_day}` | First day of the current or upcoming away block. |
| `{end_day}` | Last day of that away block. |
| `{reply_start}` | Human-readable start date and time of the scheduled Automatic Replies period. |
| `{reply_end}` | Human-readable end date and time of the scheduled Automatic Replies period. |
| `{backup_contact_email}` | The configured backup contact. |
| `{signature_tag}` | The configured signature tag. |
| `{WORKDAYS}` | Friendly display of configured working days. |
| `{START}` / `{END}` | Configured start and end time. |
| `{TZ_ABBR}` | Time-zone abbreviation for display. |
