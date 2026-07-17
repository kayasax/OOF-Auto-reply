const fs = require("node:fs");

function parseArgs(values) {
  return Object.fromEntries(
    values.map((value) => {
      const [key, ...rest] = value.replace(/^--/, "").split("=");
      return [key, rest.join("=") || true];
    }),
  );
}

function formatWallTime(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value || "");
  if (!match) throw new Error(`invalid local date-time: ${value}`);
  const [, year, month, day, hour, minute] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const dateText = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  return `${dateText} at ${hour}:${minute}`;
}

function renderTemplate(template, variables) {
  if (typeof template !== "string" || !template.trim()) throw new Error("message template is missing");
  const rendered = template.replace(/\{([a-z_]+)\}/gi, (token, name) => {
    if (!(name in variables)) throw new Error(`unresolved template variable: ${token}`);
    return variables[name];
  });
  if (/\{[a-z_]+\}/i.test(rendered)) throw new Error("rendered message contains unresolved variables");
  return rendered;
}

function renderMessages(config, period) {
  const variant = period.messageVariant;
  if (!['away', 'non_working_hours'].includes(variant)) throw new Error(`unsupported message variant: ${variant}`);
  const variables = {
    reply_start: formatWallTime(period.expectedStart),
    reply_end: formatWallTime(period.expectedEnd),
    return_date: period.returnDate || "",
    backup_contact_email: config.backup_contact_email || "",
    signature_tag: config.signature_tag || "",
  };
  const internalKey = variant === "away" ? "away_internal" : "non_working_hours_internal";
  const externalKey = variant === "away" ? "away_external" : "non_working_hours_external";
  const internal = renderTemplate(config.messages?.[internalKey], variables);
  const external = renderTemplate(config.messages?.[externalKey], variables);

  if (variant === "away") {
    const forbidden = /working hours|outside business hours|heads up|📅/i;
    if (forbidden.test(internal) || forbidden.test(external)) {
      throw new Error("away body contains non-working-hours or pre-OOF banner wording");
    }
  }

  return { variant, internalKey, externalKey, internal, external };
}

function selfTest() {
  const config = {
    messages: {
      away_internal: "<p>Away from {reply_start} until {reply_end}.</p>",
      away_external: "<p>Out from {reply_start} until {reply_end}.</p>",
      non_working_hours_internal: "<p>Internal working hours.</p>",
      non_working_hours_external: "<p>External working hours.</p>",
    },
  };
  const period = {
    messageVariant: "away",
    expectedStart: "2026-07-17T18:00",
    expectedEnd: "2026-08-03T09:00",
    returnDate: "2026-08-03",
  };
  const result = renderMessages(config, period);
  if (
    result.internalKey !== "away_internal" ||
    !result.internal.includes("Friday, July 17, 2026 at 18:00") ||
    !result.external.includes("Monday, August 3, 2026 at 09:00")
  ) {
    throw new Error("away message rendering self-test failed");
  }
  console.log("OOF_MESSAGE_RENDER_SELF_TEST_OK variant=away");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args["self-test"]) return selfTest();
  if (!args.config || !args.period) throw new Error("--config and --period are required");
  const config = JSON.parse(fs.readFileSync(String(args.config), "utf8"));
  const period = JSON.parse(String(args.period));
  console.log(JSON.stringify(renderMessages(config, period)));
}

if (require.main === module) main();

module.exports = { renderMessages };
