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
let panelRetryCount = 0;

function shouldReadWorkHours(runMode) {
  return runMode !== "scheduled";
}

function detectCdpEndpoint() {
  if (args.cdp) return args.cdp;
  if (process.env.PLAYWRIGHT_MCP_CDP_ENDPOINT) return process.env.PLAYWRIGHT_MCP_CDP_ENDPOINT;
  if (process.platform !== "win32") return null;

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
  try {
    const port = execFileSync(
      "powershell.exe",
      ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script],
      { encoding: "utf8", timeout: 5_000, stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

function persistentProfileDir() {
  if (args["user-data-dir"]) return path.resolve(String(args["user-data-dir"]));
  if (process.env.OOF_AUTO_REPLY_BROWSER_PROFILE) {
    return path.resolve(process.env.OOF_AUTO_REPLY_BROWSER_PROFILE);
  }
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) throw new Error("browser-profile: LOCALAPPDATA is unavailable; pass --user-data-dir");
  return path.join(localAppData, "OOF-Auto-Reply", "browser-profile");
}

function resolvePlaywrightRequire() {
  const localAppData = process.env.LOCALAPPDATA || "";
  const candidates = [
    path.join(process.cwd(), "package.json"),
    path.join(
      localAppData,
      "Programs",
      "Microsoft Scout",
      "resources",
      "app.asar.unpacked",
      "node_modules",
      "playwright",
      "package.json",
    ),
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

async function openBrowserSession(chromium) {
  const cdpEndpoint = detectCdpEndpoint();
  if (cdpEndpoint) {
    const browser = await chromium.connectOverCDP(cdpEndpoint);
    const context = browser.contexts()[0];
    if (!context) {
      await browser.close();
      throw new Error("browser-context: CDP browser has no context");
    }
    return { browser, context, transport: "cdp", close: () => browser.close() };
  }

  const profile = persistentProfileDir();
  fs.mkdirSync(profile, { recursive: true });
  try {
    const context = await chromium.launchPersistentContext(profile, {
      channel: "msedge",
      headless: mode === "scheduled",
    });
    return { browser: null, context, transport: "persistent", close: () => context.close() };
  } catch (error) {
    const detail = /SingletonLock|ProcessSingleton|profile.*(?:use|lock)|user data directory is already in use/i.test(
      error.message,
    )
      ? "persistent-profile-locked"
      : "persistent-launch-failed";
    throw new Error(`browser-launch: ${detail}: ${error.message}`);
  }
}

async function requireAuthenticatedOutlook(page) {
  if (!/login\.microsoftonline\.com|login\.live\.com/i.test(page.url())) return;
  if (mode === "scheduled") {
    throw new Error("authentication-required: run Outlook discovery interactively once");
  }
  await page
    .waitForURL(/outlook\.(?:cloud\.microsoft|office\.com)\//i, {
      waitUntil: "domcontentloaded",
      timeout: 300_000,
    })
    .catch(() => {
      throw new Error("authentication-required: visible Outlook sign-in was not completed within 5 minutes");
    });
  await page.waitForTimeout(2_000);
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

async function openSettingsShell(page) {
  let document = page.locator('[role="dialog"]').filter({ hasText: TEXT.settings }).last();
  if ((await document.count()) > 0) return document;

  const direct = page.locator('button[aria-label="Paramètres"], button[aria-label="Settings"]').first();
  await direct.waitFor({ state: "visible", timeout: 2_000 }).catch(() => {});
  if (await isVisible(direct)) {
    await direct.click();
  } else {
    const overflow = page
      .getByRole("button", {
        name: /Accéder à des fonctionnalités supplémentaires|Access additional features/i,
      })
      .first();
    await overflow.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    if (!(await isVisible(overflow))) throw new Error("Outlook settings launcher is unavailable");
    await overflow.click();
    const settingsItem = page.getByRole("menuitem", { name: TEXT.settings }).first();
    await settingsItem.waitFor({ state: "visible", timeout: 5_000 });
    await settingsItem.click();
  }

  document = page.locator('[role="dialog"]').filter({ hasText: TEXT.settings }).last();
  await document.waitFor({ state: "attached", timeout: 15_000 });
  return document;
}

async function settingsDocument(page, route) {
  let document = page.locator('[role="dialog"]').filter({ hasText: TEXT.settings }).last();
  if ((await document.count()) > 0) return document;

  document = await openSettingsShell(page).catch(() =>
    page.locator('[role="dialog"]').filter({ hasText: TEXT.settings }).last(),
  );
  if ((await document.count()) > 0) return document;

  await page.goto(route, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(1_500);

  document = page.locator('[role="dialog"]').filter({ hasText: TEXT.settings }).last();
  await document.waitFor({ state: "attached", timeout: 8_000 }).catch(() => {});
  if ((await document.count()) === 0 && panelRetryCount === 0) {
    panelRetryCount += 1;
    document = await openSettingsShell(page);
  }
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
  const calendar = document.locator('button[role="tab"][value="calendar"]').first();
  if ((await isVisible(calendar)) && (await calendar.getAttribute("aria-selected")) !== "true") {
    await calendar.evaluate((button) => button.click());
    await page.waitForTimeout(300);
  }
  const workHoursButton = document.locator(WORK_SCHEDULE_SELECTOR).first();
  await workHoursButton.waitFor({ state: "attached", timeout: 8_000 }).catch(() => {});
  if ((await workHoursButton.count()) === 0) throw new Error("Work hours button is unavailable");
  await workHoursButton.evaluate((button) => {
    button.scrollIntoView({ block: "center" });
    button.click();
  });
  await document
    .locator('input[aria-label*="Monday"][aria-label*="début"], input[aria-label*="Monday"][aria-label*="start"]')
    .first()
    .waitFor({ state: "visible", timeout: 15_000 });

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
  const account = document.locator('button[role="tab"][value="accounts-category"]').first();
  if ((await isVisible(account)) && (await account.getAttribute("aria-selected")) !== "true") {
    await account.evaluate((button) => button.click());
    await page.waitForTimeout(300);
  }
  const automaticRepliesTab = document.locator('button[role="tab"][value="automaticReply"]').first();
  await automaticRepliesTab.waitFor({ state: "attached", timeout: 8_000 }).catch(() => {});
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
  await signaturesTab.waitFor({ state: "attached", timeout: 8_000 }).catch(() => {});
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
    const oldLocalAppData = process.env.LOCALAPPDATA;
    process.env.LOCALAPPDATA = "C:\\Users\\example\\AppData\\Local";
    if (!persistentProfileDir().endsWith(path.join("OOF-Auto-Reply", "browser-profile"))) {
      throw new Error("persistent profile path contract changed");
    }
    if (oldLocalAppData === undefined) delete process.env.LOCALAPPDATA;
    else process.env.LOCALAPPDATA = oldLocalAppData;
    console.log("OOF_OUTLOOK_DISCOVERY_SELF_TEST_OK");
    return;
  }
  const hostRequire = resolvePlaywrightRequire();
  const { chromium } = hostRequire("playwright");
  const started = Date.now();
  const session = await openBrowserSession(chromium);
  try {
    const { context } = session;
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
    await requireAuthenticatedOutlook(page);

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
          browserTransport: session.transport,
          retries: panelRetryCount,
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
    await session.close();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
