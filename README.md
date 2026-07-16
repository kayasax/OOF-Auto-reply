# ✨ Never forget your Out of Office reply again

Your calendar already knows when you are away. This skill makes Outlook follow it.

It keeps your Automatic Replies up to date for planned leave, public holidays, evenings, and weekends, without a Power Automate flow to maintain.

> 👋 **First time here?** Import the skill, then run it once. It discovers your Outlook setup, shows you one short summary to approve, and takes care of the rest.

*Created with care by Loïc Michel.*

## 📥 Install in Microsoft Scout

1. Open **Settings** > **Skills** > **Import Skill**.
2. Download the latest release asset named `OOF-auto-reply-skill.zip`, extract it, and select its `OOF-auto-reply` folder. Do not clone or import the repository directory because its `.git` metadata can prevent Scout from replacing the skill during an update.
3. Start a new chat and type `/oof-auto-reply`.

Scout imports the folder but does not automatically run a newly installed skill. That is intentional: the first run reads personal Outlook settings and should begin with the welcome screen in a chat you started.

The first screen explains that Outlook will open in a browser and may require interactive sign-in or MFA. It also warns that public holidays come from `date.nager.at`, which may trigger a Scout website-permission prompt.

## ✅ What you get

| When | Outlook does |
| --- | --- |
| 🌴 You're on leave or a public holiday | Shows your away reply and the correct return date. |
| 🌙 Your workday ends | Sets your non-working-hours reply until you are next at work. |
| 📅 Leave is coming up | Optionally adds a small heads-up to your signature. |
| 🔎 The schedule runs | Checks Outlook afterward, so it can catch a competing old flow. |

It also skips short OOF appointments such as lunch, and it knows to skip weekends and public holidays when calculating your return.

## 🚀 Set up in a minute

### 1. ▶️ Run the skill

No configuration form. No hunting for a Power Automate flow.

### 2. 👀 Check one summary

The skill reads your Outlook time zone and working hours, then uses recent sent mail and self-generated Automatic Reply history to recover your current signature, banner, backup contact, and hidden reply wording when Outlook does not display those fields. You see everything together and correct only what needs changing. Nothing is saved and no schedule is created before you approve that summary.

### 3. 🎉 You're done

After your approval, it saves your private settings and creates the recurring schedule on this host. If this skill already owns an `OOF Auto Reply` automation, setup updates it in place instead of creating a duplicate.

> 🔐 You may need to sign in to Outlook in the browser once, and again if that session expires. Keep your assistant host running for scheduled runs to happen.

### 🧪 Prefer a safe test first?

Ask to set up **test mode**. It creates private settings and an optional disabled dry-run schedule, but never saves an Automatic Reply or changes your signature. To test an actual Outlook write without affecting your real mailbox, use a dedicated test mailbox.

## 🛡️ Your privacy, plainly

- It **never sends email** for you. ✉️
- It **never changes your calendar**. 🗓️
- It changes only your Outlook Automatic Replies and, if you enable it, your default signature.
- Your personal settings stay in a private `config.json` file. It is ignored by Git and is not part of this shareable package. 🔒

## 🔧 Need to change something later?

Just ask the skill. It can update your hours, holiday country, reply wording, leave banner, or schedule without making you edit JSON.

For more detail, read the friendly [HOWTO](HOWTO.md). The technical [configuration reference](CONFIG-REFERENCE.md) is there when you need it.

## 🤝 Sharing with someone else

Share the latest `OOF-auto-reply-skill.zip` release asset, not a cloned repository folder, `config.json`, screenshots, or local run artifacts. Each person gets their own detect-and-confirm setup.

## 🔔 Version and update notices

The installed version is stored in `VERSION`. The skill checks the public latest-release endpoint during onboarding and every recurring OOF automation run. It warns only once per new version, then records that version locally to avoid daily spam. The prominent notice starts with `🔔 OOF_UPDATE_AVAILABLE` and links directly to the clean `OOF-auto-reply-skill.zip` asset. The request sends no personal, mailbox, calendar, or configuration data.

To update, download and extract the new asset, then import its clean `OOF-auto-reply` folder and choose **Replace**. Never import a git clone. Re-running confirmed setup updates the existing owned automation in place. If Scout contains multiple matching automations, the skill stops without changing them and asks you to keep one.
