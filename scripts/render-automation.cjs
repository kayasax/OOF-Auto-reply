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
  return [
    "OOF Auto Reply stable bootstrap.",
    `Read the complete current run contract at ${quote(path.join(root, "references", "recurring-run.md"))} on every execution, then follow it exactly.`,
    `Resolve <resourceDir> in that contract to ${quote(root)}.`,
    "Do not use a cached, remembered, or previously saved version of the run contract.",
    "The validated private configuration selects production or test mode.",
  ].join("\n");
}

function selfTest() {
  const production = render({ mode: "production", resourceDir: "<resourceDir>" });
  const test = render({ mode: "test", resourceDir: "<resourceDir>" });
  const required = [
    "OOF Auto Reply stable bootstrap",
    "references\\recurring-run.md",
    "on every execution",
    "Do not use a cached",
    "configuration selects production or test mode",
  ];
  if (!required.every((item) => production.includes(item))) throw new Error("production contract self-test failed");
  if (test !== production) throw new Error("stable bootstrap must not embed mode-specific behavior");
  console.log("OOF_AUTOMATION_PROMPT_SELF_TEST_OK");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args["self-test"]) return selfTest();
  console.log(render({ mode: args.mode, resourceDir: args["resource-dir"] }));
}

if (require.main === module) main();

module.exports = { render };
