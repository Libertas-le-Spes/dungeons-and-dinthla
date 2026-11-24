import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { IMPORT_FORMS } from "./import-forms";
import { ImportedPaths } from "./imported-paths";
import { ADAPTER_ONLY_AREAS, coreBreachesOf, isAdapterSide, SOURCE } from "./obsidian-side";
import { allTies, tiedPaths } from "./obsidian-ties";

const ADAPTER = join(SOURCE, "obsidian");

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
    if (entry.isFile() && inside.endsWith(".ts")) found.push(inside);
  }
  return found;
}

function foldersUnder(path: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const inside = join(path, entry.name);
    found.push(inside, ...foldersUnder(inside));
  }
  return found;
}

const SOURCE_PATHS = filesUnder(SOURCE).map((file) => relative(SOURCE, file));

const TIED = tiedPaths(await allTies());

function breaches(path: string): string[] {
  const file = join(SOURCE, path);
  return coreBreachesOf(reader, file, readFileSync(file, "utf8"));
}

function madeUp(path: string, text: string): string[] {
  return coreBreachesOf(reader, join(SOURCE, path), text);
}

function coreAreas(): string[] {
  const areas: string[] = [];
  for (const entry of readdirSync(SOURCE, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== "obsidian") areas.push(entry.name);
  }
  return areas;
}

describe("the plugin's own code, kept apart from Obsidian", () => {
  it.each(SOURCE_PATHS.filter((path) => !TIED.includes(path)))("lets %s load nothing of Obsidian and reach nothing on the Obsidian side, as it isn't listed", (path) => {
    expect(breaches(path)).toEqual([]);
  });

  it("lists only existing core files, each under its own area, never the Obsidian side or a folder", async () => {
    for (const area of await allTies()) {
      for (const path of area.paths) {
        expect(path.startsWith(`${area.area}/`)).toBe(true);
        expect(path.endsWith(".ts")).toBe(true);
        expect(statSync(join(SOURCE, path)).isFile()).toBe(true);
        expect(isAdapterSide(path)).toBe(false);
      }
    }
  });

  it("keeps the Obsidian side in src/obsidian, one folder per area, and no obsidian folder anywhere else", () => {
    const strays: string[] = [];
    for (const folder of foldersUnder(SOURCE)) {
      if (folder.endsWith("/obsidian") && folder !== ADAPTER) strays.push(folder);
    }
    expect(strays).toEqual([]);
    if (!existsSync(ADAPTER)) return;
    const known = [...coreAreas(), ...ADAPTER_ONLY_AREAS];
    for (const entry of readdirSync(ADAPTER, { withFileTypes: true })) {
      expect(entry.isDirectory()).toBe(true);
      expect(known).toContain(entry.name);
    }
  });

  it("lets no source file import the in-memory test host", () => {
    for (const file of filesUnder(SOURCE)) expect(readFileSync(file, "utf8")).not.toMatch(/tests\/host/);
  });
});

describe("the rule, over made-up files", () => {
  it.each(IMPORT_FORMS)("refuses Obsidian loaded by a core file through $form", ({ written }) => {
    expect(madeUp("funds/page/made-up.ts", written("obsidian"))).not.toEqual([]);
  });

  it.each([
    ["CodeMirror", 'const language = require("@codemirror/language");'],
    ["an Obsidian type inside a type", 'export type Note = import("obsidian").TFile;'],
    ["an export from Obsidian", 'export { Notice } from "obsidian";'],
    ["the Obsidian side's code", 'import { FundsPageView } from "../../obsidian/funds/page/funds-page-view";'],
    ["the gate", 'import type { FencedFiles } from "../../fence/gate/fenced-files";'],
    ["the plugin's start", 'import DungeonsAndDinthla from "../../main";'],
  ])("refuses a core file reaching %s", (_case, text) => {
    expect(madeUp("funds/page/made-up.ts", text)).not.toEqual([]);
  });

  it.each([
    ["the Obsidian side loading Obsidian", "obsidian/funds/page/made-up.ts", 'import { Notice } from "obsidian";'],
    ["the gate loading Obsidian", "fence/gate/made-up.ts", 'import type { Vault } from "obsidian";'],
    ["a core file reaching other core code", "funds/page/made-up.ts", 'import { nameKeyOf } from "../../names/name-key";'],
    ["a core folder whose name only starts with obsidian", "obsidian-notes/made-up.ts", 'import { nameKeyOf } from "../names/name-key";'],
  ])("allows %s", (_case, path, text) => {
    expect(madeUp(path, text)).toEqual([]);
  });

  it("refuses a core folder that only starts with obsidian when it loads Obsidian", () => {
    expect(madeUp("obsidian-notes/made-up.ts", 'import { Notice } from "obsidian";')).not.toEqual([]);
  });
});
