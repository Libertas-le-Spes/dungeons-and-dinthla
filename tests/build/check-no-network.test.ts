import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const SCRIPT = fileURLToPath(new URL("../../scripts/check-no-network.ts", import.meta.url));

let folder: string;

afterEach(() => {
  rmSync(folder, { recursive: true, force: true });
});

function checkedRelease(plugin: string, styles: string) {
  folder = mkdtempSync(join(tmpdir(), "dd-release-"));
  writeFileSync(join(folder, "main.js"), plugin);
  writeFileSync(join(folder, "styles.css"), styles);
  return spawnSync(process.execPath, [SCRIPT], { cwd: folder, encoding: "utf8" });
}

describe("check-no-network", () => {
  it("fails and names both release files when each holds network code", () => {
    const run = checkedRelease('fetch("https://example.invalid/a.json");', ".dd-frame { background-image: url(https://example.invalid/a.png); }");
    expect(run.status).not.toBe(0);
    expect(run.stderr).toContain("main.js holds network code: fetch");
    expect(run.stderr).toContain("styles.css holds network code: a url( that is not a base64 data URL");
  });

  it("passes and says so for each release file when neither holds network code", () => {
    const run = checkedRelease('var import_obsidian = require("obsidian");', ".dd-frame { color: red; }");
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("main.js holds no network code.");
    expect(run.stdout).toContain("styles.css holds no network code.");
  });
});
