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
  const discovery = read(path.join("scripts", "outlook-discovery.cjs"));
  const workflow = read(path.join(".github", "workflows", "release.yml"));
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
  requireText(recurringRun, "OOF_RUN_BLOCKED calendar=unread", "calendar read failure gate");
  requireText(recurringRun, "compute-period.cjs", "live deterministic calculator contract");
  requireText(recurringRun, "organizer-owned", "live organizer event contract");
  requireText(dailyOperation, "next available working day", "available-workday return calculation");
  requireText(dailyOperation, "last working day before leave", "pre-leave workday extension");
  requireText(dailyOperation, "continue through the complete contiguous block", "upcoming leave traversal");
  requireText(dailyOperation, "notice return date and the Automatic Replies end date", "return-date consistency");
  requireText(dailyOperation, "OOF_RUN_BLOCKED calendar=unread", "calendar-read failure gate");
  requireText(dailyOperation, "Include events owned by the user (`organizer`)", "organizer OOF eligibility");
  requireText(dailyOperation, "does not cover the interval", "calendar coverage gate");
  requireText(dailyOperation, "calendar-derived expected switch", "calendar-derived comparison");
  requireText(dailyOperation, "scripts/compute-period.cjs", "deterministic period calculation");
  requireText(periodComputation, 'today: "2026-07-17"', "pre-leave regression date");
  requireText(periodComputation, 'nextWeekLeave.expectedEnd !== "2026-08-03T09:00"', "August 3 return regression");
  requireText(discovery, 'button[role="tab"][value="workSchedule"]', "Work Hours selector");
  requireText(discovery, 'button[role="tab"][value="calendar"]', "Calendar category selector");
  requireText(discovery, 'button[role="tab"][value="accounts-category"]', "Account category selector");
  requireText(discovery, 'runMode !== "scheduled"', "scheduled Work Hours skip");
  requireText(discovery, "if ((await document.count()) > 0) return document", "existing OWA settings reuse");
  requireText(discovery, "panelRetryCount === 0", "bounded settings-panel retry");
  requireText(discovery, "retries: panelRetryCount", "settings retry reporting");
  requireText(discovery, "launchPersistentContext", "persistent browser fallback");
  requireText(discovery, 'browserTransport: session.transport', "browser transport reporting");
  requireText(discovery, "authentication-required", "persistent profile authentication gate");
  requireText(discovery, "timeout: 300_000", "interactive sign-in wait");
  requireText(discovery, "persistent-profile-locked", "persistent profile lock error");
  requireText(discovery, '"Microsoft Scout"', "current Scout runtime path");
  requireText(discovery, "Access additional features", "responsive OWA settings launcher");
  if (discovery.includes("-match 'mcp-msedge'")) {
    throw new Error("CDP detection must not depend on the mcp-msedge process marker");
  }
  requireText(skill, "Do not install a browser", "browser install prohibition");
  requireText(workflow, "references scripts", "release references bundle");
  requireText(workflow, "CHANGELOG.md", "release changelog bundle");
  requireText(workflow, 'grep -Fq "## [$(cat VERSION)] - " CHANGELOG.md', "release changelog gate");
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
    path.join("scripts", "outlook-discovery.cjs"),
    path.join("scripts", "render-automation.cjs"),
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