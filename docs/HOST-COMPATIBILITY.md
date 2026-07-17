# Microsoft Scout compatibility

This package is a redistributable Microsoft Scout skill. It uses Scout's supported skill, Playwright browser, calendar, file, prompt, and automation capabilities. It must not depend on one developer machine's Scout installation directory or private state layout.

| Capability | Used for |
| --- | --- |
| Read the user's calendar | Find confirmed out-of-office blocks. |
| Fetch public HTTPS data | Retrieve Nager.Date holiday calendars. |
| Browser automation | Use a visible browser for setup and authentication, and headless mode for routine authenticated runs. |
| Local file read/write | Maintain the private `config.json` and holiday cache. |
| Recurring scheduler | Run the skill each day at the user-confirmed time. |
| Interactive user prompt | Obtain the consolidated setup confirmation and handle browser sign-in. |

## Redistribution rules

- Do not hardcode an assistant name, tenant, account, email address, time zone, country, or message wording.
- Use Scout's calendar, Playwright browser, storage, prompting, and automation facilities.
- Store host-specific scheduler identifiers only in the private `config.json`.
- Browser sign-in, MFA, and permission prompts always require the user to interact directly. Never attempt to bypass them.
- Use headless mode only after a successful visible sign-in. If authentication is required during a headless run, stop without changing Outlook, notify the user, and require a visible retry.
- Never inspect or edit Scout's private automation files. Use `m_get_automation`, `m_list_automations`, `m_create_automation`, and `m_update_automation`.
- Never inspect browser processes, attach to CDP, launch Edge from Node.js, choose a filesystem profile, or load dependencies from Scout's installation directory.
