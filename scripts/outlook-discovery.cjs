const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const { createRequire } = require("node:module");

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, "").split("=");
    return [key, value.join("=") || true];
  }),
);
const mode = args.mode || "full";
const WORK_SCHEDULE_SELECTOR = 'button[role="tab"][value="workSchedule"]';

function shouldReadWorkHours(runMode) {
  return runMode !== "scheduled";
}

function detectCdpEndpoint() {
  if (args.cdp) return args.cdp;
  if (process.env.PLAYWRIGHT_MCP_CDP_ENDPOINT) return process.env.PLAYWRIGHT_MCP_CDP_ENDPOINT;
  if (process.platform !== "win32") throw new Error("Pass --cdp=<endpoint> on non-Windows hosts");

  const script = [
    "$ports = Get-CimInstance Win32_Process |",
    "Where-Object { $_.Name -eq 'msedge.exe'",
    "-and $_.CommandLine -match '--remote-debugging-port=(\\d+)' } |",
    "ForEach-Object { [regex]::Match($_.CommandLine, '--remote-debugging-port=(\\d+)').Groups[1].Value } |",
    "Select-Object -Unique;",
    "foreach ($port in $ports) {",
    "try { $tabs = Invoke-RestMethod \"http://127.0.0.1:$port/json\" -TimeoutSec 1;",
    "if ($tabs.url -match 'outlook\\.(cloud\\.microsoft|office\\.com)/mail/options/') {",
    "Write-Output $port; exit 0 } } catch {} };",
    "foreach ($port in $ports) {",
    "try { $tabs = Invoke-RestMethod \"http://127.0.0.1:$port/json\" -TimeoutSec 1;",
    "if ($tabs.url -match 'outlook\\.(cloud\\.microsoft|office\\.com)/mail/') {",
    "Write-Output $port; exit 0 } } catch {} };",
    "exit 2",
  ].join(" ");
  const port = execFileSync(
    "powershell.exe",
    ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script],
    { encoding: "utf8", timeout: 5_000 },
  ).trim();
  return `http://127.0.0.1:${port}`;
}

function resolvePlaywrightRequire() {
  const localAppData = process.env.LOCALAPPDATA || "";
  const candidates = [
    path.join(process.cwd(), "package.json"),
    path.join(
      localAppData,
      "Programs",
      "Clawpilot",
      "Microsoft Scout",
      "resources",
      "app.asar.unpacked",
      "node_modules",
      "playwright",
      "package.json",
    ),
  ];
  const packageJson = candidates.find((candidate) => fs.existsSync(candidate));
  if (!packageJson) throw new Error("Playwright runtime was not found");
  return createRequire(packageJson);
}

const TEXT = {
  settings: /Paramètres|Settings/i,
  calendar: /Calendrier|Calendar/i,
  workHours: /Horaires et lieu de travail|Work hours and location/i,
  account: /Compte|Account/i,
  automaticReplies: /Réponses automatiques|Automatic replies/i,
  signatures: /^Signatures$/i,
  editSignature: /Modifier la signature|Edit signature/i,
  cancel: /^(Annuler|Cancel)$/i,
};

async function isVisible(locator) {
  return (await locator.count()) > 0 && locator.first().isVisible().catch(() => false);
}

async function settingsDocument(page, route) {
  let document = page.locator('[role="dialog"]').filter({ hasText: TEXT.settings }).last();
  const target = new URL(route).pathname.toLowerCase();
  const targetSelector = target.includes("workhoursandlocation")
    ? WORK_SCHEDULE_SELECTOR
    : target.includes("automaticreply")
      ? 'button[role="tab"][value="automaticReply"]'
      : null;
  if ((await document.count()) > 0) {
    const routeMatches = page.url().toLowerCase().includes(target);
    const targetAvailable =
      targetSelector !== null && (await document.locator(targetSelector).count()) > 0;
    if (routeMatches || targetAvailable) return document;
  }

  await page.goto(route, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(1_500);

  document = page.locator('[role="dialog"]').filter({ hasText: TEXT.settings }).last();
  await document.waitFor({ state: "attached", timeout: 8_000 }).catch(() => {});
  if ((await document.count()) === 0) throw new Error("Outlook settings document did not open");
  return document;
}

async function selectTab(document, name) {
  const tab = document.getByRole("tab", { name }).first();
  if (!(await isVisible(tab))) throw new Error(`Settings tab is unavailable: ${name}`);
  await tab.click({ force: true });
  await tab.page().waitForTimeout(500);
}

async function readWorkHours(page) {
  const document = await settingsDocument(
    page,
    "https://outlook.cloud.microsoft/mail/options/calendar/workHoursAndLocation",
  );
  const calendar = document.getByRole("tab", { name: TEXT.calendar }).first();
  if ((await isVisible(calendar)) && (await calendar.getAttribute("aria-selected")) !== "true") {
    await calendar.click({ force: true });
    await page.waitForTimeout(300);
  }
  const workHoursButton = document.locator(WORK_SCHEDULE_SELECTOR).first();
  if ((await workHoursButton.count()) === 0) throw new Error("Work hours button is unavailable");
  await workHoursButton.evaluate((button) => {
    button.scrollIntoView({ block: "center" });
    button.click();
  });
  await document
    .locator('input[aria-label*="Monday"][aria-label*="début"], input[aria-label*="Monday"][aria-label*="start"]')
    .first()
    .waitFor({ state: "visible", timeout: 5_000 });

  const text = (await document.innerText()).replace(/\s+/g, " ");
  const days = await document.locator('input[type="checkbox"][aria-label]').evaluateAll((elements) =>
    elements
      .map((element) => ({ day: element.getAttribute("aria-label"), checked: element.checked }))
      .filter(({ day }) =>
        /^(dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi|sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/i.test(
          day || "",
        ),
      ),
  );
  const times = await document.locator("input[aria-label]").evaluateAll((elements) =>
    elements
      .map((element) => ({ label: element.getAttribute("aria-label"), value: element.value }))
      .filter(({ label }) => /heure de (début|fin)|start time|end time/i.test(label || "")),
  );

  return {
    workScheduleSelected: (await workHoursButton.getAttribute("aria-selected")) === "true",
    timezone: text.match(/\(UTC[^)]*\)\s*[^.]+/i)?.[0] || null,
    days,
    times,
  };
}

async function readAutomaticRepliesAndSignature(page) {
  const document = await settingsDocument(
    page,
    "https://outlook.cloud.microsoft/mail/options/accounts-category/automaticReply",
  );
  const automaticRepliesTab = document.locator('button[role="tab"][value="automaticReply"]').first();
  if ((await automaticRepliesTab.count()) === 0) throw new Error("Automatic Replies tab is unavailable");
  await automaticRepliesTab.evaluate((button) => button.click());
  await page.waitForTimeout(300);
  const automaticReplies = await document.evaluate((root) => ({
    text: root.innerText.replace(/\s+/g, " "),
    controls: [...root.querySelectorAll('input, textarea, [contenteditable="true"], [role="switch"]')].map(
      (element) => ({
        label: element.getAttribute("aria-label"),
        value: element.value || "",
        checked:
          typeof element.checked === "boolean" ? element.checked : element.getAttribute("aria-checked"),
        html: element.getAttribute("contenteditable") === "true" ? element.innerHTML : undefined,
      }),
    ),
  }));

  const signaturesTab = document
    .locator('button[role="tab"][value="signatures-subcategory"]')
    .first();
  if ((await signaturesTab.count()) === 0) throw new Error("Signatures tab is unavailable");
  await signaturesTab.evaluate((button) => button.click());
  await page.waitForTimeout(300);
  const edit = document.getByRole("button", { name: TEXT.editSignature }).first();
  await edit.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});
  if (await isVisible(edit)) {
    await edit.click();
    await page.waitForTimeout(500);
  }
  const signature = await document.evaluate((root) => ({
    text: root.innerText.replace(/\s+/g, " "),
    editors: [...root.querySelectorAll('input, textarea, [contenteditable="true"], [role="textbox"]')].map(
      (element) => ({
        label: element.getAttribute("aria-label"),
        value: element.value || "",
        text: (element.innerText || element.textContent || "").replace(/\s+/g, " ").trim(),
        html: element.getAttribute("contenteditable") === "true" ? element.innerHTML : undefined,
      }),
    ),
  }));
  const cancel = document.getByText(TEXT.cancel).first();
  if (await isVisible(cancel)) await cancel.click();

  return { automaticReplies, signature };
}

async function main() {
  if (args["self-test"]) {
    if (WORK_SCHEDULE_SELECTOR !== 'button[role="tab"][value="workSchedule"]') {
      throw new Error("work schedule selector contract changed");
    }
    if (shouldReadWorkHours("scheduled")) {
      throw new Error("scheduled mode must skip Work Hours");
    }
    console.log("OOF_OUTLOOK_DISCOVERY_SELF_TEST_OK");
    return;
  }
  const cdpEndpoint = detectCdpEndpoint();
  const hostRequire = resolvePlaywrightRequire();
  const { chromium } = hostRequire("playwright");
  const started = Date.now();
  const browser = await chromium.connectOverCDP(cdpEndpoint);
  try {
    const context = browser.contexts()[0];
    let page =
      context.pages().find((candidate) => /outlook\.(?:cloud\.microsoft|office\.com)\/mail\/options\//i.test(candidate.url())) ||
      context.pages().find((candidate) => /outlook\.(?:cloud\.microsoft|office\.com)/i.test(candidate.url()));
    if (!page) {
      page = await context.newPage();
      await page.goto("https://outlook.cloud.microsoft/mail/", {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      await page.waitForTimeout(2_000);
    }

    const workHours = shouldReadWorkHours(mode)
      ? await readWorkHours(page).catch((error) => {
            throw new Error(`work-hours: ${error.message}`);
          })
      : null;
    const outlook = await readAutomaticRepliesAndSignature(page).catch((error) => {
      throw new Error(`outlook-settings: ${error.message}`);
    });
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode,
          elapsedMs: Date.now() - started,
          url: page.url(),
          workHours,
          ...outlook,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
