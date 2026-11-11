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

function filesUnder(path: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const inside = join(path, entry.name);
    if (entry.isDirectory()) found.push(...filesUnder(inside));
    if (entry.isFile()) found.push(inside);
  }
  return found;
}

function filesIn(folder: string): string[] {
  return filesUnder(join(SOURCE_FOLDER, folder));
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

  it("finds an import from an outer folder, from a file inside a folder of the inner one", () => {
    expect(folderOf(join(SOURCE_FOLDER, "fence", "paths", "safe-path.ts"), "../../campaign/file-name")).toBe("campaign");
  });

  it("stays in the inner folder for an import between two of its own folders", () => {
    expect(folderOf(join(SOURCE_FOLDER, "fence", "gate", "gatekeeper.ts"), "../paths/fence")).toBe("fence");
  });

  it("reads the files in the folders inside an inner folder, not only its top", () => {
    const read = filesIn("fence").map((file) => relative(SOURCE_FOLDER, file));
    expect(read).toContain(join("fence", "gate", "gatekeeper.ts"));
    expect(read).toContain(join("fence", "paths", "safe-path.ts"));
    expect(read.every((file) => file.endsWith(".ts"))).toBe(true);
  });
});
