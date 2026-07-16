const path = require("node:path");

function parseArgs(values) {
  return Object.fromEntries(
    values.map((value) => {
      const [key, ...rest] = value.replace(/^--/, "").split("=");
      return [key, rest.join("=") || true];
    }),
  );
}

function quote(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function render({ mode, resourceDir }) {
  if (!["production", "test"].includes(mode)) throw new Error("--mode must be production or test");
  const root = resourceDir || "<resourceDir>";
  const config = path.join(root, "config.json");
  const scripts = path.join(root, "scripts");
  const writeRule =
    mode === "test"
      ? "Perform a read-only dry run. Never toggle, edit, save, or verify an Outlook write."
      : "Perform the confirmed production operation, then reopen Outlook settings and verify the saved state.";
  return [
    `OOF Auto Reply recurring run, confirmed mode: ${mode}.`,
    `STEP 1. Read the complete private configuration at ${quote(config)}.`,
    `STEP 2. Run node ${quote(path.join(scripts, "config-status.cjs"))} --config=${quote(config)}. If usable is not true, stop with OOF_RUN_BLOCKED setup=incomplete. Never perform onboarding from this schedule.`,
    `STEP 3. If update_check.enabled is not false, run node ${quote(path.join(scripts, "check-update.cjs"))}. If updateAvailable is true and latest differs from update_check.last_notified_version, prepend 🔔 OOF_UPDATE_AVAILABLE installed=<installed> latest=<latest> url=<url> and persist latest to update_check.last_notified_version. Otherwise remain silent and do not change the marker. A failed update check never blocks later steps.`,
    `STEP 4. Run node ${quote(path.join(scripts, "outlook-discovery.cjs"))} --mode=scheduled. Scheduled discovery skips Work Hours. Use only the confirmed timezone, working_days, and working_hours from the configuration. Never use playwright-browser_run_code.`,
    `STEP 5. Read ${quote(path.join(root, "references", "daily-operation.md"))}. Read public holidays and accepted calendar OOF events at least 21 days ahead, then compute away or workday behavior from that reference.`,
    `STEP 6. ${writeRule}`,
    "STEP 7. End with OOF_RUN_OK status=<away|workday|test> update=<none|version> outlook=<read|written|blocked>.",
  ].join("\n");
}

function selfTest() {
  const production = render({ mode: "production", resourceDir: "<resourceDir>" });
  const test = render({ mode: "test", resourceDir: "<resourceDir>" });
  const required = [
    "OOF_RUN_BLOCKED setup=incomplete",
    "🔔 OOF_UPDATE_AVAILABLE",
    "--mode=scheduled",
    "skips Work Hours",
    "Never use playwright-browser_run_code",
    "OOF_RUN_OK",
  ];
  if (!required.every((item) => production.includes(item))) throw new Error("production contract self-test failed");
  if (!test.includes("read-only dry run") || test.includes("verify the saved state")) {
    throw new Error("test mode contract self-test failed");
  }
  console.log("OOF_AUTOMATION_PROMPT_SELF_TEST_OK");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args["self-test"]) return selfTest();
  console.log(render({ mode: args.mode, resourceDir: args["resource-dir"] }));
}

if (require.main === module) main();

module.exports = { render };
