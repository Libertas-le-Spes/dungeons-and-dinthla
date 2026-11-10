import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SOURCE_FOLDER = fileURLToPath(new URL("../../src", import.meta.url));
const IMPORTED = /from\s+"(\.{1,2}\/[^"]+)"/g;

interface InnerFolder {
  folder: string;
  reaches: string[];
}

const INNER_FOLDERS: InnerFolder[] = [
  { folder: "names", reaches: ["names"] },
  { folder: "fence", reaches: ["fence", "names"] },
];

function filesIn(folder: string): string[] {
  return readdirSync(join(SOURCE_FOLDER, folder)).map((name) => join(SOURCE_FOLDER, folder, name));
}

function folderOf(file: string, imported: string): string {
  const target = relative(SOURCE_FOLDER, resolve(dirname(file), imported));
  const [top] = target.split("/");
  if (top === undefined) throw new Error(`${imported} names no folder`);
  return top;
}

function importedPathsIn(text: string): string[] {
  const paths: string[] = [];
  for (const [, imported] of text.matchAll(IMPORTED)) {
    if (imported !== undefined) paths.push(imported);
  }
  return paths;
}

function importedFolders(file: string): string[] {
  return importedPathsIn(readFileSync(file, "utf8")).map((imported) => folderOf(file, imported));
}

function reachesOutward(inner: InnerFolder): string[] {
  const found: string[] = [];
  for (const file of filesIn(inner.folder)) {
    for (const folder of importedFolders(file)) {
      if (!inner.reaches.includes(folder)) found.push(`${relative(SOURCE_FOLDER, file)} imports from ${folder}`);
    }
  }
  return found;
}

describe("the inner folders", () => {
  it.each(INNER_FOLDERS)("let src/$folder import only from the folders inside it", (inner) => {
    expect(reachesOutward(inner)).toEqual([]);
  });

  it("finds an import from an outer folder", () => {
    expect(folderOf(join(SOURCE_FOLDER, "fence", "safe-path.ts"), "../campaign/file-name")).toBe("campaign");
  });
});
