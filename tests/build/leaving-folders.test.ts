import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { IMPORT_FORMS } from "./import-forms";
import { ImportedPaths } from "./imported-paths";

const IMPORTS_FOLDER = fileURLToPath(new URL("../../src/imports", import.meta.url));
const LEAVING = "leaving";

interface LeavingFolder {
  folder: string;
  reaches: string[];
}

const LEAVING_FOLDERS: LeavingFolder[] = [
  { folder: "properties", reaches: ["properties"] },
  { folder: "snapshot", reaches: ["snapshot"] },
  { folder: "writes", reaches: ["writes"] },
  { folder: "reasons", reaches: ["reasons", "writes"] },
  { folder: "cast", reaches: ["cast", "properties", "switching"] },
  { folder: "switching", reaches: ["switching", "reasons", "snapshot", "properties", "writes", "cast"] },
  { folder: "choices", reaches: ["choices", "switching", "reasons", "cast", "writes"] },
  { folder: "dialog", reaches: ["dialog", "choices", "switching", "reasons", "properties", "cast", "writes"] },
];

const OUTSIDE_LEAVING_REACHED = ["note", "layout"];
const NEVER_IMPORTING_LEAVING = ["note", "layout"];

let reader: ImportedPaths;

beforeAll(() => {
  reader = new ImportedPaths();
});

afterAll(() => {
  reader.close();
});

function filesUnder(path: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const inside = join(path, entry.name);
    if (entry.isDirectory()) found.push(...filesUnder(inside));
    if (entry.isFile()) found.push(inside);
  }
  return found;
}

function importsFolderPartsOf(file: string, imported: string): string[] | null {
  const inside = relative(IMPORTS_FOLDER, resolve(dirname(file), imported));
  if (inside.startsWith("..")) return null;
  return inside.split("/");
}

function reachedName(parts: readonly string[]): string {
  const [top, below] = parts;
  if (top === LEAVING && below !== undefined) return below;
  if (top === undefined) return "";
  return `imports/${top}`;
}

function isAllowed(leaving: LeavingFolder, parts: readonly string[]): boolean {
  const [top] = parts;
  if (top === LEAVING) return leaving.reaches.includes(reachedName(parts));
  if (top === undefined) return false;
  return OUTSIDE_LEAVING_REACHED.includes(top);
}

function relativeImportsOf(text: string): string[] {
  const found: string[] = [];
  for (const imported of reader.in(text)) {
    if (imported.startsWith(".")) found.push(imported);
  }
  return found;
}

function breachesIn(leaving: LeavingFolder, file: string, text: string): string[] {
  const found: string[] = [];
  for (const imported of relativeImportsOf(text)) {
    const parts = importsFolderPartsOf(file, imported);
    if (parts === null || isAllowed(leaving, parts)) continue;
    found.push(`${relative(IMPORTS_FOLDER, file)} imports from ${reachedName(parts)}`);
  }
  return found;
}

function importersOfLeavingIn(file: string, text: string): string[] {
  const found: string[] = [];
  for (const imported of relativeImportsOf(text)) {
    const parts = importsFolderPartsOf(file, imported);
    if (parts === null) continue;
    const [top] = parts;
    if (top === LEAVING) found.push(`${relative(IMPORTS_FOLDER, file)} imports from leaving`);
  }
  return found;
}

function leavingFolderNamed(folder: string): LeavingFolder {
  for (const leaving of LEAVING_FOLDERS) {
    if (leaving.folder === folder) return leaving;
  }
  throw new Error(`No leaving folder is called ${folder}.`);
}

function breachesOfMadeUpFile(folder: string, text: string): string[] {
  return breachesIn(leavingFolderNamed(folder), join(IMPORTS_FOLDER, LEAVING, folder, "made-up.ts"), text);
}

function breachesOfFolder(leaving: LeavingFolder): string[] {
  const found: string[] = [];
  for (const file of filesUnder(join(IMPORTS_FOLDER, LEAVING, leaving.folder))) found.push(...breachesIn(leaving, file, readFileSync(file, "utf8")));
  return found;
}

function folderNameOf(leaving: LeavingFolder): string {
  return leaving.folder;
}

function directoryNamesIn(path: string): string[] {
  const names: string[] = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.isDirectory()) names.push(entry.name);
  }
  return names;
}

function fileNamesIn(path: string): string[] {
  const names: string[] = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.isFile()) names.push(entry.name);
  }
  return names;
}

describe("the folders inside src/imports/leaving", () => {
  it.each(LEAVING_FOLDERS)("let src/imports/leaving/$folder import only from the folders it may reach", (leaving) => {
    expect(breachesOfFolder(leaving)).toEqual([]);
  });

  it("have a rule for every folder, hold no loose file, and hold at most ten files each", () => {
    const leavingFolder = join(IMPORTS_FOLDER, LEAVING);
    expect(directoryNamesIn(leavingFolder).sort()).toEqual(LEAVING_FOLDERS.map(folderNameOf).sort());
    expect(fileNamesIn(leavingFolder)).toEqual([]);
    for (const leaving of LEAVING_FOLDERS) expect(fileNamesIn(join(leavingFolder, leaving.folder)).length).toBeLessThanOrEqual(10);
  });

  it.each(NEVER_IMPORTING_LEAVING)("are never imported from src/imports/%s", (folder) => {
    const found: string[] = [];
    for (const file of filesUnder(join(IMPORTS_FOLDER, folder))) found.push(...importersOfLeavingIn(file, readFileSync(file, "utf8")));
    expect(found).toEqual([]);
  });
});

describe("the rule for the folders inside src/imports/leaving, over made-up files", () => {
  it.each(IMPORT_FORMS)("refuses the reasons importing from switching, written as $form", ({ written }) => {
    expect(breachesOfMadeUpFile("reasons", written("../switching/main-switch"))).toEqual(["leaving/reasons/made-up.ts imports from switching"]);
  });

  it("refuses the snapshot, the writes and the properties importing from any other leaving folder", () => {
    expect(breachesOfMadeUpFile("snapshot", 'import { a } from "../properties/property-setter";')).toEqual(["leaving/snapshot/made-up.ts imports from properties"]);
    expect(breachesOfMadeUpFile("properties", 'import { a } from "../snapshot/snapshot-text";')).toEqual(["leaving/properties/made-up.ts imports from snapshot"]);
    expect(breachesOfMadeUpFile("writes", 'import { a } from "../switching/switch-plan";')).toEqual(["leaving/writes/made-up.ts imports from switching"]);
  });

  it("refuses switching importing from the dialog, and any leaving folder importing from the import dialog", () => {
    expect(breachesOfMadeUpFile("switching", 'import { a } from "../dialog/main-offers";')).toEqual(["leaving/switching/made-up.ts imports from dialog"]);
    expect(breachesOfMadeUpFile("switching", 'import { a } from "../../dialog/failure-words";')).toEqual(["leaving/switching/made-up.ts imports from imports/dialog"]);
  });

  it("allows the dialog to import from the folders below it, and every folder from the note and the layout", () => {
    const text = ['import { a } from "../switching/main-switch";', 'import { b } from "../reasons/died";', 'import { c } from "../../note/writing/note-files";', 'import { d } from "../../layout/standing";'].join("\n");
    expect(breachesOfMadeUpFile("dialog", text)).toEqual([]);
  });

  it("refuses the note importing from leaving", () => {
    const file = join(IMPORTS_FOLDER, "note", "writing", "made-up.ts");
    expect(importersOfLeavingIn(file, 'import { a } from "../../leaving/snapshot/snapshot-text";')).toEqual(["note/writing/made-up.ts imports from leaving"]);
  });
});
