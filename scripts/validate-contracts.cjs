const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function requireText(text, expected, label) {
  if (!text.includes(expected)) throw new Error(`${label} is missing: ${expected}`);
}

function rejectText(text, forbidden, label) {
  if (text.includes(forbidden)) throw new Error(`${label} contains forbidden text: ${forbidden}`);
}

function main() {
  const skill = read("SKILL.md");
  const onboarding = read(path.join("references", "onboarding.md"));
  const recurring = read(path.join("references", "recurring-run.md"));
  const calculator = read(path.join("scripts", "compute-period.cjs"));
  const renderer = read(path.join("scripts", "render-messages.cjs"));
  const changelog = read("CHANGELOG.md");
  const version = read("VERSION").trim();

  const referenceFiles = fs.readdirSync(path.join(root, "references")).sort();
  const expectedReferences = ["onboarding.md", "recurring-run.md"];
  if (JSON.stringify(referenceFiles) !== JSON.stringify(expectedReferences)) {
    throw new Error(`references must contain only ${expectedReferences.join(" and ")}`);
  }

  requireText(skill, "## 👋 Welcome", "welcome");
  requireText(skill, "Created with care by Loïc Michel.", "creator credit");
  requireText(skill, "references/onboarding.md", "setup routing");
  requireText(skill, "references/recurring-run.md", "scheduled routing");
  requireText(skill, "No other runtime reference files are required", "reference map boundary");
  rejectText(skill, "references/daily-operation.md", "skill");
  rejectText(skill, "references/outlook-discovery.md", "skill");
  rejectText(skill, "references/automation.md", "skill");

  requireText(onboarding, "Before explicit confirmation, write nothing", "confirmation gate");
  requireText(onboarding, "OOF_SETUP_BLOCKED automation=duplicate", "duplicate gate");
  requireText(onboarding, "ownership conflict", "automation ownership gate");
  requireText(onboarding, "ID-only update", "pre-write automation disable");
  requireText(onboarding, "write-only fields", "mutation acknowledgement");
  requireText(onboarding, "complete HTML body", "mailbox full-body evidence");
  requireText(onboarding, "retry each mailbox read once on HTTP 5xx", "mailbox retry");
  requireText(onboarding, "setup.status: pending_automation", "safe setup transition");
  requireText(onboarding, "browserHeadless: true", "headless setup");
  requireText(onboarding, "enabled in production, disabled in test mode", "mode handling");
  requireText(onboarding, "Only then set `setup.status: complete`", "setup completion gate");

  requireText(recurring, "Do not read any other reference file during a scheduled run", "single run contract");
  requireText(recurring, "## Hard budgets", "bounded execution");
  requireText(recurring, "A failed call consumes its budget", "failed-call budget");
  requireText(recurring, "Never retry a failed navigation", "navigation retry gate");
  requireText(recurring, "22 days later", "calendar lookahead");
  requireText(recurring, "today-only", "calendar range rejection");
  requireText(recurring, "Follow pagination", "calendar pagination");
  requireText(recurring, "scripts/compute-period.cjs", "deterministic period");
  requireText(recurring, "scripts/render-messages.cjs", "deterministic messages");
  requireText(recurring, "OOF_RUN_BLOCKED outlook=browser-error", "browser failure gate");
  requireText(recurring, "OOF_RUN_BLOCKED outlook=write-uncommitted", "commit failure gate");
  requireText(recurring, "Save, Enregistrer, OK, or Apply", "localized commit controls");
  requireText(recurring, "may appear only after an edit", "deferred save");
  requireText(recurring, "Control+A", "whole-body replacement");
  requireText(recurring, "https://github.com/kayasax/OOF-Auto-reply", "literal repository URL");
  requireText(recurring, "If all values match, make no Automatic Replies edit", "no-op path");
  requireText(recurring, "Still evaluate the signature banner", "signature after no-op");
  requireText(recurring, "## Signature banner", "signature procedure");
  requireText(recurring, "stale, cancelled, or already-started banner", "stale signature handling");
  requireText(recurring, "verify the complete signature body", "signature verification");
  requireText(recurring, "successful ID-only automation update", "authentication recovery mutation");
  requireText(recurring, "In `test` mode", "test mode");
  requireText(recurring, "No progress narration", "silent automation");
  requireText(recurring, "Teams alert", "manual alert prohibition");
  requireText(recurring, "setup.auth_recovery_pending", "authentication recovery");

  requireText(calculator, 'saturdayDuringLeave.expectedStart !== "2026-07-17T18:00"', "weekend start regression");
  requireText(calculator, 'midLeave.expectedStart !== "2026-07-17T18:00"', "active leave regression");
  requireText(calculator, 'saturdayDuringLeave.expectedEnd !== "2026-08-03T09:00"', "August 3 end regression");
  requireText(calculator, 'nextWeekLeave.returnDate !== "2026-08-03"', "August 3 return regression");
  requireText(renderer, "internalPlainText", "paragraph-preserving internal body");
  requireText(renderer, "externalPlainText", "paragraph-preserving external body");
  requireText(renderer, "internalCanonicalText", "canonical verification body");
  requireText(renderer, '.replace(/<\\/p\\s*>/gi, "\\n\\n")', "paragraph rendering");

  requireText(changelog, "## [Unreleased]", "unreleased changelog section");
  requireText(changelog, `## [${version}] - `, "current version changelog entry");

  const publicFiles = [
    "CHANGELOG.md",
    "SKILL.md",
    "README.md",
    "HOWTO.md",
    "CONFIG-REFERENCE.md",
    path.join("docs", "HOST-COMPATIBILITY.md"),
    path.join("references", "onboarding.md"),
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

  console.log("OOF_CONTRACTS_VALIDATION_OK references=2");
}

main();
