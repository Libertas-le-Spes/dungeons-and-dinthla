import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const NAMED_SOURCE_FILE = /src\/[a-z][a-z0-9-]*(?:\/[a-z0-9-]+)*\.tsx?/g;
const MADE_UP_IN_BUNDLE_CHECK = ["src/other.ts", "src/reader.ts", "src/reader.tsx"];

function filesUnder(folder: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(join(ROOT, folder), { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) found.push(...filesUnder(path));
    if (entry.isFile() && path.endsWith(".ts")) found.push(path);
  }
  return found;
}

function sourceFilesNamedIn(file: string): string[] {
  const text = readFileSync(join(ROOT, file), "utf8");
  return [...text.matchAll(NAMED_SOURCE_FILE)].map(([named]) => named);
}

function missingFrom(file: string): string[] {
  return sourceFilesNamedIn(file).filter((named) => !existsSync(join(ROOT, named)) && !MADE_UP_IN_BUNDLE_CHECK.includes(named));
}

describe("the source files the tests and scripts name", () => {
  const files = [...filesUnder("tests"), ...filesUnder("scripts")];

  it.each(files)("are all there, in %s", (file) => {
    expect(missingFrom(file)).toEqual([]);
  });

  it("finds a source file named in some test", () => {
    const naming = files.filter((file) => sourceFilesNamedIn(file).length > 0);
    expect(naming.length).toBeGreaterThan(0);
  });

  it("holds only made-up paths in its list of them", () => {
    for (const made of MADE_UP_IN_BUNDLE_CHECK) expect(existsSync(join(ROOT, made)), made).toBe(false);
  });
});
