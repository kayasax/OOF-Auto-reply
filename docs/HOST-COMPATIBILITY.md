# Host compatibility

This skill is assistant-neutral. A host needs the following capabilities to execute it fully:

| Capability | Used for |
| --- | --- |
| Read the user's calendar | Find confirmed out-of-office blocks. |
| Fetch public HTTPS data | Retrieve Nager.Date holiday calendars. |
| Browser automation | Use a visible browser for setup and authentication, and headless mode for routine authenticated runs. |
| Local file read/write | Maintain the private `config.json` and holiday cache. |
| Recurring scheduler | Run the skill each day at the user-confirmed time. |
| Interactive user prompt | Obtain the consolidated setup confirmation and handle browser sign-in. |

## Portability rules

- Do not hardcode an assistant name, tenant, account, email address, time zone, country, or message wording.
- Use the host's calendar, browser, storage, prompting, and scheduling facilities. Do not require a specific product API.
- Store host-specific scheduler identifiers only in the private `config.json`.
- If the host lacks a scheduler, explain the limitation before onboarding confirmation and offer a host-native equivalent. Do not claim unattended scheduling is configured when it is not.
- Browser sign-in, MFA, and permission prompts always require the user to interact directly. Never attempt to bypass them.
- Use headless mode only after a successful visible sign-in. If authentication is required during a headless run, stop without changing Outlook, notify the user, and require a visible retry.

## Browser lock recovery

Some browser-automation hosts use a persistent Edge profile. If a stale lock prevents launch, close only browser processes whose command line identifies the host-managed Playwright profile, such as a path containing `ms-playwright\mcp-msedge`. Never terminate all Edge processes.
