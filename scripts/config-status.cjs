const fs = require("node:fs");
const path = require("node:path");

function parseArgs(values) {
  return Object.fromEntries(
    values.map((value) => {
      const [key, ...rest] = value.replace(/^--/, "").split("=");
      return [key, rest.join("=") || true];
    }),
  );
}

function validateConfig(config) {
  const missingCore = [];
  const missingGate = [];
  if (!config?.timezone) missingCore.push("timezone");
  if (!Array.isArray(config?.working_days) || config.working_days.length === 0) missingCore.push("working_days");
  if (!config?.working_hours?.start) missingCore.push("working_hours.start");
  if (!config?.working_hours?.end) missingCore.push("working_hours.end");
  if (!/^[A-Z]{2}$/.test(config?.holiday_country || "")) missingCore.push("holiday_country");
  if (config?.setup?.status !== "complete") missingGate.push("setup.status");
  if (!["production", "test"].includes(config?.setup?.mode)) missingGate.push("setup.mode");
  if (!config?.setup?.scheduled_run_time) missingGate.push("setup.scheduled_run_time");
  return {
    usable: missingCore.length === 0 && missingGate.length === 0,
    coreComplete: missingCore.length === 0,
    missing: [...missingCore, ...missingGate],
    missingCore,
    missingGate,
  };
}

function selfTest() {
  const complete = {
    setup: { status: "complete", mode: "production", scheduled_run_time: "07:30" },
    timezone: "Europe/Paris",
    working_days: ["Mon"],
    working_hours: { start: "08:00", end: "17:00" },
    holiday_country: "FR",
  };
  const valid = validateConfig(complete);
  const invalid = validateConfig({ setup: { status: "incomplete", mode: "test" } });
  const legacy = validateConfig({ ...complete, setup: undefined });
  if (
    !valid.usable ||
    invalid.usable ||
    !invalid.missing.includes("setup.status") ||
    !legacy.coreComplete ||
    legacy.usable
  ) {
    throw new Error("config validation self-test failed");
  }
  console.log("OOF_CONFIG_STATUS_SELF_TEST_OK");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args["self-test"]) return selfTest();
  const configPath = path.resolve(String(args.config || path.join(__dirname, "..", "config.json")));
  if (!fs.existsSync(configPath)) {
    console.log(JSON.stringify({ usable: false, reason: "missing", missing: ["config.json"] }));
    return;
  }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const result = validateConfig(config);
    console.log(JSON.stringify({ ...result, reason: result.usable ? "complete" : "incomplete" }));
  } catch {
    console.log(JSON.stringify({ usable: false, reason: "invalid-json", missing: ["config.json"] }));
  }
}

if (require.main === module) main();

module.exports = { validateConfig };
