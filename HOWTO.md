# 😊 A friendly guide to Outlook Automatic Replies

## 🎉 You are set up

Once onboarding is complete, the skill quietly keeps your Outlook Automatic Replies aligned with your calendar and working hours. You do not need to run it every day.

> 💡 Your assistant host does need to stay running for its schedule to fire. If you close the host application or turn off the machine, the next run waits until it is available again.

## 🧪 Want to test safely first?

Ask to set up **test mode**. It saves the private configuration and can create a disabled dry-run schedule, but it never changes Automatic Replies or your signature. A dry run verifies the calculation, calendar and holiday reads, scheduler dispatch, and authenticated Outlook access.

During first-run detection, the skill may read a recent normal message from Sent Items to recover your exact signature and search your own mailbox for the newest self-generated Automatic Reply. This lets it show existing wording even when Outlook hides disabled reply editors. It does not send, move, or modify those messages.

To validate an actual Outlook save without affecting your real mailbox, use a dedicated test mailbox. Outlook Automatic Replies are mailbox-wide, so a real write cannot be safely isolated in your production mailbox.

## ✏️ Want to change something?

### 🕐 Change your working hours or holiday country

Ask the skill to update your OOF settings. It will show the current values in one summary, let you adjust them, and save the changes to your private `config.json`.

### 💬 Change your reply wording

Ask to update your away or non-working-hours message. The skill will show the exact new wording before it writes anything visible in Outlook.

### 📅 Turn the upcoming-leave banner on or off

Ask to manage the pre-OOF banner. You can choose whether it appears, how many days ahead it starts, and its exact wording. The same wording can optionally appear in your non-working-hours reply too.

### ⏰ Change the schedule

Ask to change the automatic-reply schedule. The skill updates the schedule on your current assistant host and records the chosen run time in `config.json`.

The skill reuses the automation recorded in its private configuration. If that identifier is stale, it can recover one unambiguous automation created by this skill and update it in place. It never silently creates another schedule when multiple matching automations exist. In that case, it stops and asks you to keep one in Scout before trying again.

## 🔐 A sign-in prompt appeared

That is normal from time to time. The recurring automation normally runs headlessly. If Outlook requires account selection, sign-in, or MFA after security changes or session expiry, the automation switches its next run to visible mode. Complete the displayed prompt directly. After a successful verified run, it returns to headless mode. If authentication is not completed, the skill stops safely without changing Outlook.

## 🔁 Automation shows `OOF_RUN_BLOCKED outlook=auth-recovery-pending`

The scheduled run detected that Outlook requires interactive authentication and has blocked all writes until you complete sign-in. This is intentional — it is a safety gate, not a failure.

To recover:

1. **Run the skill interactively from chat** (type `/oof-auto-reply` or ask your assistant to run the OOF skill). It opens Outlook in the browser. When Automatic Replies controls are visible, the skill clears the recovery flag automatically and restores headless mode.

2. **Or edit `config.json` directly:** open it beside this skill and set `"auth_recovery_pending": false` inside the `"setup"` block. Sign in to [Outlook on the web](https://outlook.cloud.microsoft) first so the session cookie is valid, then let the next scheduled run proceed.

The next clean scheduled run after the flag is cleared confirms Outlook access and reports success.

## 🔄 The setting did not stay changed

An old Power Automate flow or another automation may still be changing Automatic Replies after this skill saves them. Disable the old flow only after you have confirmed this skill behaves as expected for a few days. Tell the skill once it is disabled so it can stop warning you about the possible conflict.

## 🔔 An update notice appeared

`🔔 OOF_UPDATE_AVAILABLE` means a newer public release is available. The skill shows each version once and links to the clean release ZIP. A failed update check never blocks the normal Outlook and calendar run.

If the existing automation was created before version 0.2.8, run the updated skill interactively once after import and approve the in-place automation migration. Importing files alone cannot rewrite Scout's persisted automation prompt. Once migrated to the stable bootstrap, later file replacements are loaded automatically on each scheduled run.

## 🧹 The browser says it is already in use

The skill can recover from a stale Playwright browser lock by closing only the matching Playwright-managed Edge processes. It never closes all Edge windows indiscriminately.

## 📁 Where are my settings?

Your private settings are in `config.json` beside this file. You rarely need to edit it directly, but it is there if you want to inspect it. For every field and template variable, see [CONFIG-REFERENCE.md](CONFIG-REFERENCE.md).

## 📚 Need the technical details?

The [configuration reference](CONFIG-REFERENCE.md) documents every setting. The [host compatibility guide](docs/HOST-COMPATIBILITY.md) explains what an assistant host needs to run this skill.
