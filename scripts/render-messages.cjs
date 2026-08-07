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

function formatDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) throw new Error(`invalid date: ${value}`);
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
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

function decodeHtmlText(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function htmlToPlainText(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .split(/\r?\n/)
    .map((line) => decodeHtmlText(line).replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function htmlToCanonicalText(html) {
  return htmlToPlainText(html)
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
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

  return {
    variant,
    internalKey,
    externalKey,
    internal,
    external,
    internalPlainText: htmlToPlainText(internal),
    externalPlainText: htmlToPlainText(external),
    internalCanonicalText: htmlToCanonicalText(internal),
    externalCanonicalText: htmlToCanonicalText(external),
  };
}

function renderBannerTemplate(config, oofFirstDay, returnDate) {
  const template = config.pre_oof_banner?.template;
  if (!template) throw new Error("pre_oof_banner.template is missing from config");
  const variables = {
    oof_first_day: formatDate(oofFirstDay),
    return_day: formatDate(returnDate),
    backup_contact_email: config.backup_contact_email || "",
  };
  return renderTemplate(template, variables);
}

function selfTest() {
  const config = {
    messages: {
      away_internal: "<p>Away from {reply_start} until {reply_end}.</p>",
      away_external: "<p>Out from {reply_start} until {reply_end}.</p><p>Thank you.</p>",
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
    !result.external.includes("Monday, August 3, 2026 at 09:00") ||
    result.externalPlainText !==
      "Out from Friday, July 17, 2026 at 18:00 until Monday, August 3, 2026 at 09:00.\n\nThank you." ||
    result.internalCanonicalText !==
      "Away from Friday, July 17, 2026 at 18:00 until Monday, August 3, 2026 at 09:00."
  ) {
    throw new Error("away message rendering self-test failed");
  }
  console.log("OOF_MESSAGE_RENDER_SELF_TEST_OK variant=away");

  const bannerConfig = {
    backup_contact_email: "backup@example.com",
    pre_oof_banner: {
      template: "📅 Heads up, I'll be out of office {oof_first_day}. Back {return_day}. For anything urgent, reach {backup_contact_email}.",
    },
  };
  const banner = renderBannerTemplate(bannerConfig, "2026-07-20", "2026-08-03");
  if (
    !banner.includes("Monday, July 20, 2026") ||
    !banner.includes("Monday, August 3, 2026") ||
    !banner.includes("backup@example.com")
  ) {
    throw new Error("banner template rendering self-test failed");
  }
  console.log("OOF_BANNER_RENDER_SELF_TEST_OK");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args["self-test"]) return selfTest();
  if (args.mode === "banner") {
    if (!args.config || !args["oof-first-day"] || !args["return-date"]) {
      throw new Error("--config, --oof-first-day, and --return-date are required for banner mode");
    }
    const config = JSON.parse(fs.readFileSync(String(args.config), "utf8"));
    console.log(renderBannerTemplate(config, String(args["oof-first-day"]), String(args["return-date"])));
    return;
  }
  if (!args.config || !args.period) throw new Error("--config and --period are required");
  const config = JSON.parse(fs.readFileSync(String(args.config), "utf8"));
  const period = JSON.parse(String(args.period));
  console.log(JSON.stringify(renderMessages(config, period)));
}

if (require.main === module) main();

module.exports = { htmlToCanonicalText, htmlToPlainText, renderMessages, renderBannerTemplate };
