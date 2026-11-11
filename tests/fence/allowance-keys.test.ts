import { existsSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PAGE_GLOBALS } from "./allowed/globals";
import { OBSIDIAN_IMPORTS } from "./allowed/obsidian-imports";
import { PAGE_MEMBERS } from "./allowed/page-members";
import { sourcePath } from "./scan/scan-paths";

function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

function isFolder(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

function isOneFile(key: string): boolean {
  return key.endsWith(".ts") && isFile(sourcePath(key));
}

function isOneFileOrOneArea(key: string): boolean {
  if (isOneFile(key)) return true;
  return key.endsWith("/") && isFolder(sourcePath(key));
}

function keysNotMeaningOneFile(keys: string[]): string[] {
  return keys.filter((key) => !isOneFile(key));
}

function keysNotMeaningOneFileOrArea(keys: string[]): string[] {
  return keys.filter((key) => !isOneFileOrOneArea(key));
}

describe("the keys of the allowances matched by the start of a path", () => {
  it("name one file each, for the page members", () => {
    expect(Object.keys(PAGE_MEMBERS).length).toBeGreaterThan(0);
    expect(keysNotMeaningOneFile(Object.keys(PAGE_MEMBERS))).toEqual([]);
  });

  it("name one file each, for the page globals", () => {
    expect(Object.keys(PAGE_GLOBALS).length).toBeGreaterThan(0);
    expect(keysNotMeaningOneFile(Object.keys(PAGE_GLOBALS))).toEqual([]);
  });

  it("name one file or one whole area each, for the Obsidian imports", () => {
    expect(Object.keys(OBSIDIAN_IMPORTS).length).toBeGreaterThan(0);
    expect(keysNotMeaningOneFileOrArea(Object.keys(OBSIDIAN_IMPORTS))).toEqual([]);
  });
});

describe("the check on those keys", () => {
  it("refuses a file's key widened to the folder it is in", () => {
    expect(keysNotMeaningOneFile(["views/dialogs/"])).toEqual(["views/dialogs/"]);
  });

  it("refuses a file's key widened to a start of a path that is no folder", () => {
    expect(keysNotMeaningOneFile(["views/dialogs/keys"])).toEqual(["views/dialogs/keys"]);
    expect(keysNotMeaningOneFileOrArea(["views/dia"])).toEqual(["views/dia"]);
  });

  it("refuses a key for a file that is not there", () => {
    expect(keysNotMeaningOneFile(["views/dialogs/gone.ts"])).toEqual(["views/dialogs/gone.ts"]);
  });

  it("accepts one file, and accepts an area only where areas are allowed", () => {
    expect(keysNotMeaningOneFile(["views/dialogs/keys.ts"])).toEqual([]);
    expect(keysNotMeaningOneFileOrArea(["views/"])).toEqual([]);
    expect(keysNotMeaningOneFile(["views/"])).toEqual(["views/"]);
  });
});
