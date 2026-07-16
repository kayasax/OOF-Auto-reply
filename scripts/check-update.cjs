const fs = require("node:fs");
const path = require("node:path");

const repository = "kayasax/OOF-Auto-reply";
const installed = fs.readFileSync(path.join(__dirname, "..", "VERSION"), "utf8").trim();

function parse(version) {
  const match = String(version).trim().replace(/^v/i, "").match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : null;
}

function isNewer(candidate, current) {
  const left = parse(candidate);
  const right = parse(current);
  if (!left || !right) return false;
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] > right[index];
  }
  return false;
}

function selfTest() {
  const cases = [
    ["v0.1.5", "0.1.4", true],
    ["0.2.0", "0.1.9", true],
    ["1.0.0", "0.9.9", true],
    ["0.1.4", "0.1.4", false],
    ["0.1.3", "0.1.4", false],
    ["invalid", "0.1.4", false],
  ];
  if (cases.some(([candidate, current, expected]) => isNewer(candidate, current) !== expected)) {
    throw new Error("version comparison self-test failed");
  }
  console.log("OOF_UPDATE_CHECK_SELF_TEST_OK");
}

(async () => {
  if (process.argv.includes("--self-test")) return selfTest();
  try {
    const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "oof-auto-reply-update-check",
      },
      signal: AbortSignal.timeout(5_000),
    });
    if (response.status === 404) {
      console.log(JSON.stringify({ installed, updateAvailable: false, reason: "no-release" }));
      return;
    }
    if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}`);
    const release = await response.json();
    const asset = release.assets?.find((item) => item.name === "OOF-auto-reply-skill.zip");
    console.log(
      JSON.stringify({
        installed,
        latest: release.tag_name,
        updateAvailable: isNewer(release.tag_name, installed),
        url: asset?.browser_download_url || release.html_url,
        assetAvailable: Boolean(asset),
      }),
    );
  } catch (error) {
    console.log(JSON.stringify({ installed, updateAvailable: false, reason: "check-unavailable" }));
  }
})();

module.exports = { isNewer, parse };
