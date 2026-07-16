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
  const discovery = read(path.join("scripts", "outlook-discovery.cjs"));
  const workflow = read(path.join(".github", "workflows", "release.yml"));
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
  requireText(discovery, 'button[role="tab"][value="workSchedule"]', "Work Hours selector");
  requireText(discovery, 'button[role="tab"][value="calendar"]', "Calendar category selector");
  requireText(discovery, 'button[role="tab"][value="accounts-category"]', "Account category selector");
  requireText(discovery, 'runMode !== "scheduled"', "scheduled Work Hours skip");
  requireText(discovery, "if ((await document.count()) > 0) return document", "existing OWA settings reuse");
  requireText(discovery, "panelRetryCount === 0", "bounded settings-panel retry");
  requireText(discovery, "retries: panelRetryCount", "settings retry reporting");
  requireText(discovery, "Access additional features", "responsive OWA settings launcher");
  if (discovery.includes("-match 'mcp-msedge'")) {
    throw new Error("CDP detection must not depend on the mcp-msedge process marker");
  }
  requireText(skill, "Do not install a browser", "browser install prohibition");
  requireText(workflow, "references scripts", "release references bundle");

  const publicFiles = [
    "SKILL.md",
    "README.md",
    "HOWTO.md",
    "CONFIG-REFERENCE.md",
    path.join("docs", "HOST-COMPATIBILITY.md"),
    path.join("references", "onboarding.md"),
    path.join("references", "outlook-discovery.md"),
    path.join("references", "automation.md"),
    path.join("references", "daily-operation.md"),
    path.join("scripts", "check-update.cjs"),
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