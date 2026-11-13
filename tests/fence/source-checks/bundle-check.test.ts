import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NOTHING_ALLOWED } from "../scan/running/allowance-sets";
import { fenceBreaches, HIDDEN_CODE, hiddenCodeIn, unscannedBundleInputs } from "../scan/running/bundle-check";
import { BUNDLED_PROJECT, bundledProjectFiles, entryProject } from "../scan/running/bundled-project";
import { ROOT, SOURCE_FOLDER, sourcePath, VIRTUAL_FOLDER } from "../scan/reading/scan-paths";
import { virtualFileSystem } from "../scan/running/virtual-files";
import { SourceScanner } from "../scan/running/source-scanner";

const PLANTED_FOLDER = `${VIRTUAL_FOLDER}/planted`;

interface Planted {
  name: string;
  files: Record<string, string>;
}

const VAULT_READER = 'import type { App } from "obsidian";\nexport const files = (app: App) => app.vault;\n';

const VAULT_READER_JS = "export const files = (app) => app.vault;\n";

const PLANTED: Planted[] = [
  { name: "mts", files: { "src/main.ts": 'export { files } from "./reader.mts";\n', "src/reader.mts": VAULT_READER } },
  {
    name: "js",
    files: { "src/main.ts": 'export { files } from "./reader";\n', "src/reader.js": VAULT_READER_JS, "src/reader.d.ts": "export declare const files: unknown;\n" },
  },
  { name: "outside", files: { "src/main.ts": 'export { files } from "../lib/reader";\n', "lib/reader.ts": VAULT_READER } },
  { name: "js-outside", files: { "src/main.ts": 'export { files } from "../lib/reader";\n', "lib/reader.js": VAULT_READER_JS } },
  {
    name: "declared-outside",
    files: { "src/main.ts": 'export { files } from "../lib/reader";\n', "lib/reader.js": VAULT_READER_JS, "lib/reader.d.ts": "export declare const files: unknown;\n" },
  },
];

interface PlantedOnDisk {
  name: string;
  files: Record<string, string>;
  found: string[];
}

const PLANTED_ON_DISK: PlantedOnDisk[] = [
  {
    name: "tsx beside ts",
    files: { "src/main.ts": 'export { files } from "./reader";\n', "src/reader.ts": "export const files = 1;\n", "src/reader.tsx": "export const files = 2;\n" },
    found: ["src/reader.tsx is bundled but not scanned", "src/reader.ts holds code but is scanned and not bundled"],
  },
  {
    name: "browser map",
    files: {
      "package.json": JSON.stringify({ browser: { "./src/reader.ts": "./src/other.ts" } }),
      "src/main.ts": 'export { files } from "./reader";\n',
      "src/reader.ts": "export const files = 1;\n",
      "src/other.ts": "export const files = 2;\n",
    },
    found: ["src/other.ts is bundled but not scanned", "src/reader.ts holds code but is scanned and not bundled"],
  },
  {
    name: "ts in a folder of src named node_modules",
    files: { "src/main.ts": 'export { files } from "./node_modules/reader";\n', "src/node_modules/reader.ts": "export const files = 1;\n" },
    found: [],
  },
];

function plantedFolder(planted: Planted): string {
  return `${PLANTED_FOLDER}/${planted.name}`;
}

function plantedProject(planted: Planted): string {
  return `${plantedFolder(planted)}/tsconfig.json`;
}

function plantedListing(planted: Planted): string[] {
  return Object.keys(planted.files).filter((path) => path.startsWith("src/")).map((path) => `${plantedFolder(planted)}/${path}`);
}

function scannedFiles(): Map<string, string> {
  const files = bundledProjectFiles();
  for (const planted of PLANTED) {
    files.set(plantedProject(planted), entryProject("../../../../..", "src/main.ts"));
    for (const [path, text] of Object.entries(planted.files)) files.set(`${plantedFolder(planted)}/${path}`, text);
  }
  return files;
}

let scanner: SourceScanner;

beforeAll(() => {
  scanner = new SourceScanner(ROOT, virtualFileSystem(VIRTUAL_FOLDER, scannedFiles()));
});

afterAll(() => {
  scanner.close();
});

function plantedBreaches(name: string): string[] {
  const planted = PLANTED.find((candidate) => candidate.name === name);
  if (planted === undefined) throw new Error(`No planted plugin is called ${name}.`);
  return fenceBreaches(scanner, plantedProject(planted), plantedListing(planted), NOTHING_ALLOWED).map((breach) => breach.replace(`${plantedFolder(planted)}/`, ""));
}

function plantOnDisk(planted: PlantedOnDisk): string {
  const root = mkdtempSync(join(tmpdir(), "dd-planted-"));
  const project = { extends: `${ROOT}/tsconfig.json`, compilerOptions: { types: [] }, files: ["src/main.ts"], include: [] };
  const files = { ...planted.files, "tsconfig.json": JSON.stringify(project) };
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

describe("the bundle check", () => {
  it("reads every file the bundle's entry point loads, outside node_modules", () => {
    const loaded = scanner.loadedFiles(BUNDLED_PROJECT);
    expect(loaded).toContain(sourcePath("main.ts"));
    expect(loaded).toContain(sourcePath("fence/gate/gatekeeper.ts"));
    expect(loaded.length).toBeGreaterThan(100);
  });

  it("scans exactly the files esbuild bundles, outside node_modules, and beyond them only files that hold nothing but types", async () => {
    expect(await unscannedBundleInputs(scanner, ROOT, BUNDLED_PROJECT)).toEqual([]);
  });

  it.each(PLANTED_ON_DISK)("finds a file esbuild bundles but the scan doesn't read, with a $name", async (planted) => {
    const root = plantOnDisk(planted);
    try {
      const found = await unscannedBundleInputs(scanner, root, `${root}/tsconfig.json`);
      expect(found.map((breach) => breach.replace(`${root}/`, ""))).toEqual(planted.found);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reads a library the bundle takes from where a linked node_modules points as a library", async () => {
    const root = plantOnDisk({ name: "linked", files: { "src/main.ts": 'export { value } from "pkg";\n' }, found: [] });
    const store = mkdtempSync(join(tmpdir(), "dd-store-"));
    try {
      mkdirSync(join(store, "pkg"));
      writeFileSync(join(store, "pkg", "package.json"), JSON.stringify({ name: "pkg", main: "index.js" }));
      writeFileSync(join(store, "pkg", "index.js"), "export const value = 1;\n");
      symlinkSync(store, join(root, "node_modules"));
      expect(await unscannedBundleInputs(scanner, root, `${root}/tsconfig.json`)).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(store, { recursive: true, force: true });
    }
  });

  it("scans a .mts file the entry point loads, and refuses it under src", () => {
    const breaches = plantedBreaches("mts");
    expect(breaches).toContain("src/reader.mts is code under src that the scan can't read as TypeScript");
    expect(breaches.some((breach) => breach.includes("reader.mts:2 reaches the vault through vault"))).toBe(true);
  });

  it("refuses a .js file under src, even with a declaration file beside it", () => {
    expect(plantedBreaches("js")).toContain("src/reader.js is code under src that the scan can't read as TypeScript");
  });

  it("scans a file outside src the entry point loads", () => {
    expect(plantedBreaches("outside").some((breach) => breach.includes("lib/reader.ts:2 reaches the vault through vault"))).toBe(true);
  });

  it("refuses a declaration file outside node_modules that the entry point loads, which could hide a .js file beside it", () => {
    expect(plantedBreaches("declared-outside")).toContain("lib/reader.d.ts is loaded from the entry point but isn't a plain TypeScript file");
  });

  it("refuses a .js file outside src that the entry point loads", () => {
    expect(plantedBreaches("js-outside")).toContain("lib/reader.js is loaded from the entry point but isn't a plain TypeScript file");
  });

  it("refuses a .tsx or .jsx file under src, which esbuild would bundle before a .ts file of the same name", () => {
    const paths = [`${SOURCE_FOLDER}campaign/reader.tsx`, `${SOURCE_FOLDER}campaign/reader.jsx`];
    expect(hiddenCodeIn(paths)).toEqual(paths.map((path) => `${path} is code under src that the scan can't read as TypeScript`));
  });

  it.each(HIDDEN_CODE)("refuses a %s file anywhere under src", (ending) => {
    const path = `${SOURCE_FOLDER}campaign/reader${ending}`;
    expect(hiddenCodeIn([path])).toEqual([`${path} is code under src that the scan can't read as TypeScript`]);
  });
});
