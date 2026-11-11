import { existsSync, statSync } from "node:fs";
import { posix } from "node:path";
import { describe, expect, it } from "vitest";
import { PAGE_GLOBALS } from "./allowed/globals";
import { OBSIDIAN_IMPORTS } from "./allowed/obsidian-imports";
import { PAGE_MEMBERS } from "./allowed/page-members";
import { sourcePath } from "./scan/scan-paths";

interface SourcePlaces {
  isFile(key: string): boolean;
  isFolder(key: string): boolean;
}

class RealSourcePlaces implements SourcePlaces {
  isFile(key: string): boolean {
    const path = sourcePath(key);
    return existsSync(path) && statSync(path).isFile();
  }

  isFolder(key: string): boolean {
    const path = sourcePath(key);
    return existsSync(path) && statSync(path).isDirectory();
  }
}

class MadeUpSourcePlaces implements SourcePlaces {
  constructor(
    private readonly files: string[],
    private readonly folders: string[],
  ) {}

  isFile(key: string): boolean {
    return this.files.includes(posix.normalize(key));
  }

  isFolder(key: string): boolean {
    return this.folders.includes(posix.normalize(key).replace(/\/$/, ""));
  }
}

function isPlainSegment(segment: string): boolean {
  return segment !== "" && segment !== "." && segment !== "..";
}

function isPlainPath(key: string): boolean {
  const segments = key.split("/");
  if (key.endsWith("/")) segments.pop();
  return segments.every(isPlainSegment);
}

function isOneFile(places: SourcePlaces, key: string): boolean {
  return key.endsWith(".ts") && isPlainPath(key) && places.isFile(key);
}

function isOneAreaFolder(places: SourcePlaces, key: string): boolean {
  return key.endsWith("/") && isPlainPath(key) && places.isFolder(key);
}

function keysNotMeaningOneFile(places: SourcePlaces, keys: string[]): string[] {
  return keys.filter((key) => !isOneFile(places, key));
}

function keysNotMeaningOneFileOrArea(places: SourcePlaces, keys: string[]): string[] {
  return keys.filter((key) => !isOneFile(places, key) && !isOneAreaFolder(places, key));
}

const REAL = new RealSourcePlaces();

describe("the keys of the allowances matched by the start of a path", () => {
  it("name one file each, for the page members", () => {
    expect(Object.keys(PAGE_MEMBERS).length).toBeGreaterThan(0);
    expect(keysNotMeaningOneFile(REAL, Object.keys(PAGE_MEMBERS))).toEqual([]);
  });

  it("name one file each, for the page globals", () => {
    expect(Object.keys(PAGE_GLOBALS).length).toBeGreaterThan(0);
    expect(keysNotMeaningOneFile(REAL, Object.keys(PAGE_GLOBALS))).toEqual([]);
  });

  it("name one file or one whole area each, for the Obsidian imports", () => {
    expect(Object.keys(OBSIDIAN_IMPORTS).length).toBeGreaterThan(0);
    expect(keysNotMeaningOneFileOrArea(REAL, Object.keys(OBSIDIAN_IMPORTS))).toEqual([]);
  });
});

describe("the check on those keys, over made-up places", () => {
  const places = new MadeUpSourcePlaces(["main.ts", "views/dialogs/keys.ts", "views/data.json"], ["views", "views/dialogs", "views-other", "named.ts"]);

  it("refuses a file's key widened to the folder it is in", () => {
    expect(keysNotMeaningOneFile(places, ["views/dialogs/"])).toEqual(["views/dialogs/"]);
  });

  it("refuses a start of a path that is no file, and one that is a folder written without its slash", () => {
    expect(keysNotMeaningOneFile(places, ["views/dialogs/keys"])).toEqual(["views/dialogs/keys"]);
    expect(keysNotMeaningOneFileOrArea(places, ["views/dia"])).toEqual(["views/dia"]);
    expect(keysNotMeaningOneFileOrArea(places, ["views"])).toEqual(["views"]);
  });

  it("refuses a key for a file that is not there, for a folder that is named like a file, and for a file that is not source", () => {
    expect(keysNotMeaningOneFile(places, ["views/dialogs/gone.ts"])).toEqual(["views/dialogs/gone.ts"]);
    expect(keysNotMeaningOneFile(places, ["named.ts"])).toEqual(["named.ts"]);
    expect(keysNotMeaningOneFile(places, ["views/data.json"])).toEqual(["views/data.json"]);
  });

  it("refuses a key that can never match a path, though it names something that is there", () => {
    const spelled = ["views/../views/dialogs/keys.ts", "./main.ts", "views/./dialogs/keys.ts"];
    expect(keysNotMeaningOneFile(places, spelled)).toEqual(spelled);
    const areas = ["views//", "views/../views/", "./views/", "/"];
    expect(keysNotMeaningOneFileOrArea(places, areas)).toEqual(areas);
  });

  it("accepts one file, and accepts an area only where areas are allowed", () => {
    expect(keysNotMeaningOneFile(places, ["main.ts", "views/dialogs/keys.ts"])).toEqual([]);
    expect(keysNotMeaningOneFileOrArea(places, ["views/", "views/dialogs/", "views-other/"])).toEqual([]);
    expect(keysNotMeaningOneFile(places, ["views/"])).toEqual(["views/"]);
  });
});
