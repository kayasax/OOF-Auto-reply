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
  const discovery = read(path.join("scripts", "outlook-discovery.cjs"));
  const workflow = read(path.join(".github", "workflows", "release.yml"));
  const lines = skill.split(/\r?\n/).length;

  if (lines > 140) throw new Error(`SKILL.md is not a short orchestrator: ${lines} lines`);
  requireText(skill, "## 👋 Welcome", "welcome");
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
  requireText(discovery, 'button[role="tab"][value="workSchedule"]', "Work Hours selector");
  requireText(discovery, 'runMode !== "scheduled"', "scheduled Work Hours skip");
  requireText(discovery, "targetAvailable", "existing OWA settings reuse");
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