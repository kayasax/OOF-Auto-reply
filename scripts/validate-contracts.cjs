const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function requireText(text, expected, label) {
  if (!text.includes(expected)) throw new Error(`${label} is missing: ${expected}`);
}

function main() {
  const skill = read("SKILL.md");
  const onboarding = read(path.join("references", "onboarding.md"));
  const automation = read(path.join("references", "automation.md"));
  const recurringRun = read(path.join("references", "recurring-run.md"));
  const dailyOperation = read(path.join("references", "daily-operation.md"));
  const periodComputation = read(path.join("scripts", "compute-period.cjs"));
  const messageRendering = read(path.join("scripts", "render-messages.cjs"));
  const discovery = read(path.join("references", "outlook-discovery.md"));
  const workflowPath = path.join(root, ".github", "workflows", "release.yml");
  const workflow = fs.existsSync(workflowPath) ? fs.readFileSync(workflowPath, "utf8") : null;
  const changelog = read("CHANGELOG.md");
  const version = read("VERSION").trim();
  const lines = skill.split(/\r?\n/).length;

  if (lines > 140) throw new Error(`SKILL.md is not a short orchestrator: ${lines} lines`);
  requireText(skill, "## 👋 Welcome", "welcome");
  requireText(skill, "🌐 Outlook sign-in", "Outlook expectation icon");
  requireText(skill, "📅 Public holidays", "holiday expectation icon");
  requireText(
    skill,
    "https://github.com/kayasax/OOF-Auto-reply/blob/main/HOWTO.md",
    "completion HOWTO link",
  );
  if (skill.includes("I've opened the HOWTO")) {
    throw new Error("completion must not claim the HOWTO was opened");
  }
  requireText(skill, "Created with care by Loïc Michel.", "creator credit");
  requireText(skill, "🔔 OOF_UPDATE_AVAILABLE", "prominent update notice");
  requireText(skill, "Before explicit confirmation", "confirmation gate");
  requireText(onboarding, "do not create or modify `config.json`", "onboarding configuration gate");
  requireText(onboarding, "do not create an enabled or disabled schedule", "onboarding automation gate");
  requireText(onboarding, "do not write to Outlook", "onboarding Outlook gate");
  requireText(onboarding, "Thank you for your message!", "after-hours fallback greeting");
  requireText(
    onboarding,
    "outside business hours ({WORKDAYS} {START} - {END} {TZ_ABBR})",
    "after-hours fallback schedule",
  );
  requireText(onboarding, "mailto:{backup_contact_email}", "after-hours fallback contact");
  requireText(skill, "Never create a duplicate owned automation", "duplicate automation gate");
  requireText(onboarding, "Preserve a safe candidate's `setup.host_schedule_id`", "schedule ID preservation");
  requireText(automation, "## Idempotent reconciliation", "automation reconciliation contract");
  requireText(automation, "call `m_get_automation`", "stored automation lookup");
  requireText(automation, "Call `m_list_automations`", "automation candidate discovery");
  requireText(automation, "call `m_update_automation`", "automation in-place update");
  requireText(automation, "call `m_create_automation`", "automation fallback creation");
  requireText(automation, "OOF_SETUP_BLOCKED automation=duplicate", "duplicate automation stop");
  requireText(automation, "first prompt beginning", "legacy prompt recovery");
  requireText(automation, "exactly one step", "unexpected automation step gate");
  requireText(automation, '`triggerType: "schedule"`', "schedule trigger restoration");
  requireText(automation, '`oneShot: false`', "recurring execution restoration");
  requireText(automation, '`browserHeadless: true`', "headless scheduled browser");
  requireText(automation, "## Browser-mode authentication recovery", "visible authentication recovery");
  requireText(automation, "first call `m_update_automation` with only its ID and `enabled: false`", "safe transition disable");
  requireText(automation, "deterministic schedule", "deterministic schedule rendering");
  requireText(automation, "Require `success: true`", "automation mutation result gate");
  requireText(automation, "authoritative for supplied write-only fields", "write-only mutation acknowledgement");
  requireText(automation, "failed verification cannot orphan a created automation", "automation ID recovery persistence");
  requireText(automation, '`setup.status: "pending_automation"`', "incomplete transition state");
  requireText(automation, 'set `setup.status: "complete"`', "post-verification completion gate");
  requireText(automation, "Never delete an automation automatically", "automation deletion prohibition");
  requireText(automation, "stable bootstrap", "stable automation bootstrap");
  requireText(automation, "Replacing skill files does not execute the skill", "honest upgrade boundary");
  requireText(recurringRun, "OOF_RUN_BLOCKED outlook=unread", "Outlook read failure gate");
  requireText(recurringRun, "existing Outlook dates and messages may remain stale", "blocked stale-state disclosure");
  requireText(recurringRun, "Save, Enregistrer, OK, or Apply", "supported Outlook commit controls");
  requireText(recurringRun, "Never reject a complete page because it has OK instead of Save", "OK button regression");
  requireText(recurringRun, "Emit no progress messages", "silent recurring execution");
  requireText(recurringRun, "manual Teams alert", "unsolicited Teams alert prohibition");
  requireText(recurringRun, "OOF_RUN_BLOCKED calendar=range-incomplete", "calendar range failure gate");
  requireText(recurringRun, "calendarEndExclusive", "explicit recurring calendar end");
  requireText(recurringRun, "exactly 22 calendar days later", "inclusive 21-day lookahead calculation");
  requireText(recurringRun, "today-only request is forbidden", "today-only recurring read prohibition");
  requireText(recurringRun, "following pagination until the full interval is returned", "recurring calendar pagination");
  requireText(recurringRun, "compute-period.cjs", "live deterministic calculator contract");
  requireText(recurringRun, "render-messages.cjs", "deterministic message renderer contract");
  requireText(recurringRun, "Do not calculate, correct, render, select, append, or infer dates or message text yourself", "agent date and message-rendering prohibition");
  requireText(recurringRun, "normalized full-body equality", "normalized body verification");
  requireText(recurringRun, "Do not check paragraph boundaries", "paragraph-boundary prohibition");
  requireText(recurringRun, "any visible `working hours`", "away false-match rejection");
  requireText(recurringRun, "organizer-owned", "live organizer event contract");
  requireText(recurringRun, "m_get_automation", "scheduled browser-mode inspection");
  requireText(recurringRun, "outlook=authentication-required next=visible", "visible authentication migration result");
  requireText(recurringRun, "browserHeadless: true", "headless mode restoration");
  requireText(recurringRun, "Do not attempt credentials", "credential handling prohibition");
  requireText(recurringRun, "authentication-recovery run only", "visible recovery-only run");
  requireText(recurringRun, "setup.auth_recovery_pending", "explicit authentication recovery state");
  requireText(recurringRun, "Never infer browser mode", "browser-mode inference prohibition");
  requireText(recurringRun, "inspect another tab", "authentication tab exploration prohibition");
  requireText(recurringRun, "stop immediately", "scheduled authentication wait prohibition");
  requireText(recurringRun, "persist `setup.auth_recovery_pending: false`", "authentication state clearing");
  requireText(onboarding, "Initialize `setup.auth_recovery_pending` to `false`", "authentication state initialization");
  requireText(recurringRun, "End with one short human-readable result only", "human-readable run ending");
  requireText(recurringRun, "Omit implementation details, tool counts, JSON, `messageVariant`, and `OOF_RUN_OK`", "raw success token prohibition");
  requireText(recurringRun, "Omit implementation details", "implementation detail suppression");
  requireText(recurringRun, "The next scheduled run will be headless", "readable summary example");
  requireText(automation, "Do not expose raw success tokens", "automation summary boundary");
  requireText(dailyOperation, "next available working day", "available-workday return calculation");
  requireText(dailyOperation, "last working day before leave", "pre-leave workday extension");
  requireText(dailyOperation, "continue through the complete contiguous block", "upcoming leave traversal");
  requireText(dailyOperation, "notice return date and the Automatic Replies end date", "return-date consistency");
  requireText(dailyOperation, "OOF_RUN_BLOCKED calendar=range-incomplete", "calendar-range failure gate");
  requireText(dailyOperation, "2026-08-09T00:00:00+02:00", "calendar range regression end");
  requireText(dailyOperation, "this includes all of Saturday, 2026-08-08", "inclusive calendar range regression");
  requireText(dailyOperation, "call with a missing start or end", "bounded calendar call requirement");
  requireText(dailyOperation, "follow pagination until complete", "calendar pagination requirement");
  requireText(dailyOperation, "Include events owned by the user (`organizer`)", "organizer OOF eligibility");
  requireText(dailyOperation, "does not cover the interval", "calendar coverage gate");
  requireText(dailyOperation, "calendar-derived expected switch", "calendar-derived comparison");
  requireText(dailyOperation, "scripts/compute-period.cjs", "deterministic period calculation");
  requireText(dailyOperation, "render `messages.away_internal` and `messages.away_external`", "contiguous leave away bodies");
  requireText(dailyOperation, "Replace the normal non-working-hours bodies completely", "away body replacement");
  requireText(dailyOperation, "never modifies an `away` body", "away banner prohibition");
  requireText(dailyOperation, "`{reply_start}`", "dynamic reply start rendering");
  requireText(dailyOperation, "`{reply_end}`", "dynamic reply end rendering");
  requireText(periodComputation, 'today: "2026-07-17"', "pre-leave regression date");
  requireText(periodComputation, 'nextWeekLeave.expectedEnd !== "2026-08-03T09:00"', "August 3 return regression");
  requireText(periodComputation, 'nextWeekLeave.messageVariant !== "away"', "pre-leave away-template regression");
  requireText(periodComputation, 'saturdayDuringLeave.expectedStart !== "2026-07-17T18:00"', "weekend coverage-start regression");
  requireText(periodComputation, 'midLeave.expectedStart !== "2026-07-17T18:00"', "active-leave coverage-start regression");
  requireText(messageRendering, "away body contains non-working-hours or pre-OOF banner wording", "away wording rejection");
  requireText(messageRendering, 'internalKey !== "away_internal"', "away template selection regression");
  requireText(messageRendering, "internalCanonicalText", "canonical accessibility text");
  requireText(messageRendering, "internalPlainText", "paragraph-preserving internal text");
  requireText(messageRendering, "externalPlainText", "paragraph-preserving external text");
  requireText(messageRendering, '.replace(/<\\/p\\s*>/gi, "\\n\\n")', "paragraph break rendering");
  requireText(messageRendering, ".replace(/\\s+/g, \" \")", "canonical whitespace normalization");
  requireText(messageRendering, '.replace(/\\s+([.,!?;:])/g, "$1")', "canonical punctuation normalization");
  requireText(discovery, "playwright-browser_navigate", "Scout browser navigation");
  requireText(discovery, "playwright-browser_snapshot", "Scout browser snapshots");
  requireText(discovery, "playwright-browser_click", "Scout browser clicks");
  requireText(discovery, "## Scheduled fast path", "deterministic Outlook fast path");
  requireText(discovery, "options/accounts-category/automaticReply", "direct Automatic Replies route");
  requireText(discovery, "exactly one navigation", "bounded browser calls");
  requireText(discovery, "Never call the tabs tool", "single-tab browser contract");
  requireText(discovery, "wait up to 10 seconds", "bounded loading-page stabilization");
  requireText(discovery, "Do not navigate again", "loading retry navigation prohibition");
  requireText(discovery, "one replacement snapshot", "bounded loading snapshot retry");
  requireText(discovery, "Never infer that this page autosaves", "explicit Save requirement");
  requireText(discovery, "OK instead of Save", "classic Outlook OK support");
  requireText(discovery, "Prefer the enabled OK button", "classic Outlook commit action");
  requireText(discovery, "Microsoft-logo-only", "ambiguous loading-page stop");
  requireText(recurringRun, "must not advance an already-started coverage boundary", "stable coverage boundary");
  requireText(recurringRun, "Never replace `expectedStart`", "mental date replacement prohibition");
  requireText(discovery, "Do not narrate progress", "silent scheduled operation");
  requireText(discovery, "emit only the final result", "single-result execution");
  requireText(discovery, "Do not rediscover the page", "single-pass Outlook write");
  requireText(discovery, "bind the start date and time controls to `expectedStart`", "exact start control binding");
  requireText(discovery, "both rendered messages must still use Friday, 2026-07-17 at 18:00", "prior-day message start regression");
  requireText(discovery, "press `Control+A`", "single rich-text replacement");
  requireText(discovery, "complete visible text of both editors", "complete body capture");
  requireText(discovery, "collapse every whitespace run to one space", "accessibility whitespace normalization");
  requireText(discovery, "Never require a paragraph", "paragraph accessibility tolerance");
  requireText(discovery, "Do not rewrite or retry merely because paragraph boundaries differ", "paragraph retry prohibition");
  requireText(discovery, "Treat this automation path as plain text", "plain-text Outlook body contract");
  requireText(discovery, "Preserve its newlines exactly", "Outlook paragraph preservation");
  requireText(recurringRun, "Write only its `internalPlainText` and `externalPlainText`", "plain-text write fields");
  requireText(discovery, "Do not emit HTML tags", "HTML input prohibition");
  requireText(discovery, "Literal URLs are content and must appear exactly", "literal URL verification");
  requireText(recurringRun, "before opening Outlook", "calendar-first execution order");
  requireText(recurringRun, "Do not narrate progress or explore Outlook", "non-exploratory recurring run");
  requireText(discovery, "normally run with `browserHeadless: true`", "headless recurring default");
  requireText(discovery, "Visible mode is temporary", "temporary visible authentication");
  requireText(discovery, "skip Work hours", "scheduled Work Hours skip");
  requireText(discovery, "Never use `playwright-browser_run_code`", "run-code prohibition");

  const activeRuntimeFiles = [skill, discovery, automation, dailyOperation, recurringRun];
  const forbiddenRuntimeCoupling = [
    "launchPersistentContext",
    "connectOverCDP",
    "remote-debugging-port",
    "app.asar.unpacked",
    "LOCALAPPDATA",
    "m-automations\\automations.json",
  ];
  for (const forbidden of forbiddenRuntimeCoupling) {
    if (activeRuntimeFiles.some((text) => text.includes(forbidden))) {
      throw new Error(`redistributable runtime contract contains local coupling: ${forbidden}`);
    }
  }
  if (activeRuntimeFiles.some((text) => text.includes("All recurring OOF automations must run with `browserHeadless: false`"))) {
    throw new Error("OOF runtime contract must not require permanently visible execution");
  }
  requireText(skill, "Do not install or launch a separate browser", "Scout browser lifecycle contract");
  if (workflow !== null) {
    requireText(workflow, "references scripts", "release references bundle");
    requireText(workflow, "CHANGELOG.md", "release changelog bundle");
    requireText(workflow, 'grep -Fq "## [$(cat VERSION)] - " CHANGELOG.md', "release changelog gate");
    requireText(workflow, "Verify built archive", "pre-publish archive validation");
    requireText(workflow, "audit/OOF-auto-reply/scripts/validate-contracts.cjs", "archive contract execution");
  }
  requireText(changelog, "## [Unreleased]", "unreleased changelog section");
  requireText(changelog, `## [${version}] - `, "current-version changelog entry");

  const publicFiles = [
    "CHANGELOG.md",
    "SKILL.md",
    "README.md",
    "HOWTO.md",
    "CONFIG-REFERENCE.md",
    path.join("docs", "HOST-COMPATIBILITY.md"),
    path.join("references", "onboarding.md"),
    path.join("references", "outlook-discovery.md"),
    path.join("references", "automation.md"),
    path.join("references", "daily-operation.md"),
    path.join("references", "recurring-run.md"),
    path.join("scripts", "check-update.cjs"),
    path.join("scripts", "compute-period.cjs"),
    path.join("scripts", "config-status.cjs"),
    path.join("scripts", "render-automation.cjs"),
    path.join("scripts", "render-messages.cjs"),
  ];
  const privatePatterns = [
    /C:\\Users\\[^\\\s]+/i,
    /\/Users\/[^/\s]+/i,
    /@(?:microsoft|outlook|hotmail)\.(?:com|fr)\b/i,
    /\b(?:tenant|customer|mailbox|case)[_-]?id\s*[:=]\s*["']?[^\s"']+/i,
  ];
  for (const relativePath of publicFiles) {
    const text = read(relativePath);
    for (const pattern of privatePatterns) {
      if (pattern.test(text)) throw new Error(`private-data pattern ${pattern} found in ${relativePath}`);
    }
  }
  console.log("OOF_CONTRACTS_VALIDATION_OK");
}

main();