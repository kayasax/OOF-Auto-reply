---
name: "oof-auto-reply"
description: "Keep Outlook Automatic Replies aligned with calendar OOF events, public holidays, and working hours. On invocation, immediately display the welcome before reasoning or tools. Use for automatic replies, out-of-office automation, non-working-hours replies, upcoming-leave signature notices, or replacing a Power Automate OOF flow."
---

# Outlook Automatic Replies

## First visible output

On every interactive invocation, emit this welcome before reasoning, planning, file reads, browser actions, or any other tool call:

## 👋 Welcome

### Let's make your Outlook replies one less thing to think about

> **Next:** I'll check your Outlook working hours, calendar, and holiday settings, then show you one simple summary to approve before anything is saved.
>
> **🌐 Outlook sign-in:** A browser will open Outlook on the web. You may need to choose your account, sign in, or complete MFA interactively.
>
> **📅 Public holidays:** I will retrieve public holidays from `date.nager.at`. Scout may ask you to allow that website.

**✨ Quick and simple**

No long setup form.

**🛡️ Safe by design**

I will never send email or change your calendar.

**⏰ Ready when you are**

Once you're happy, I'll save your private settings and set up a recurring check on this host.

---

*Created with care by Loïc Michel.*

*Open-source skill maintained at [kayasax/OOF-Auto-reply](https://github.com/kayasax/OOF-Auto-reply).*

Do not add progress narration after the welcome. Work silently until user action is required or the consolidated confirmation summary is ready.

## Orchestration

1. Resolve this skill's `resourceDir` from the host. Treat `config.json` beside this file as private host state.
2. Run `node "<resourceDir>\scripts\check-update.cjs"`. If an update is available, show exactly one prominent line: `🔔 OOF_UPDATE_AVAILABLE installed=<installed> latest=<latest> url=<url>`. Otherwise remain silent.
3. Run `node "<resourceDir>\scripts\config-status.cjs" --config="<resourceDir>\config.json"`.
4. Route by invocation and configuration state:
   - **First run or incomplete setup:** read [references/onboarding.md](references/onboarding.md) and [references/outlook-discovery.md](references/outlook-discovery.md). Perform read-only discovery, then stop at the explicit confirmation gate.
   - **Confirmed interactive change:** read the relevant onboarding section and show the exact proposed private configuration, Outlook-visible text, and schedule change before writing.
   - **Recurring run:** an incomplete configuration ends immediately with `OOF_RUN_BLOCKED setup=incomplete`. A complete configuration routes to [references/daily-operation.md](references/daily-operation.md) and [references/automation.md](references/automation.md). Scheduled mode never repeats Work Hours discovery.
5. After explicit onboarding confirmation, write the complete private configuration, then generate the recurring prompt with `node "<resourceDir>\scripts\render-automation.cjs" --mode=<production|test> --resource-dir="<resourceDir>"`. Use that output unchanged when creating the host schedule.

## Non-negotiable gates

- Before explicit confirmation of the consolidated summary, do not create or modify `config.json`, create any enabled or disabled automation, or write anything in Outlook.
- Discovery is read-only. It never sends email, changes calendar events, clicks Save, edits a rich-text field, changes a signature, or toggles Automatic Replies.
- Historical reply and signature wording must be inferred from mailbox history as defined in the discovery reference. Browser-hidden fields never justify invented defaults or disabling an existing banner.
- Current Automatic Replies switch and period state come only from browser discovery. Mailbox history is historical wording, not current state.
- Production writes require `setup.status == "complete"`, a confirmed production mode, and complete core settings. Test mode never writes Outlook settings.
- Never expose `config.json`, mailbox content, calendar detail, host schedule identifiers, or local paths in chat beyond what the signed-in user needs.
- Never disable a competing legacy flow. Ask the user to do that after the skill has been verified.

## Deterministic browser contract

- Use `scripts/outlook-discovery.cjs` for Outlook settings discovery.
- Work Hours activation must remain a direct DOM `click()` on `button[role="tab"][value="workSchedule"]`.
- Scheduled mode must use `--mode=scheduled`, skip Work Hours, and use confirmed configuration values.
- Do not use `playwright-browser_run_code`.
- Do not install a browser or browser dependency during onboarding. Report a host-browser launch failure instead.
- Allow one retry only for a structured transient panel-load timeout. Do not explore processes, profiles, selectors, or deep links during normal onboarding.

## Completion

After confirmed production setup, say: `🎉 You're all set! Your private settings are saved, and the recurring check is active on this host. I've opened the HOWTO so you know where to find things later.`

After confirmed test setup, say: `🧪 Test setup is ready! Your private settings are saved and the dry-run schedule is disabled, so it cannot change your Outlook settings. Run it manually when you want to validate the read-only path.`

Open [HOWTO.md](HOWTO.md) in the host viewer. If unavailable, provide its local host link without pasting the guide.
