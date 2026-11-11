import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const DOCS = `${ROOT}/docs`;
const NAMED_FILE = /`((?:src|tests|scripts)\/[A-Za-z0-9/._-]+\.ts|[a-z][a-z0-9-]*(?:\/[a-z0-9-]+)+\.ts)`/g;
const NAMED_FOLDER = /`((?:src|tests|scripts)\/[A-Za-z0-9/._-]*\/)`/g;

function docFiles(): string[] {
  return readdirSync(DOCS).filter((name) => name.endsWith(".md"));
}

function pathsNamedIn(doc: string, pattern: RegExp): string[] {
  const text = readFileSync(`${DOCS}/${doc}`, "utf8");
  return [...text.matchAll(pattern)].map(([, named]) => named!);
}

function placeOf(named: string): string {
  if (named.startsWith("src/") || named.startsWith("tests/") || named.startsWith("scripts/")) return `${ROOT}/${named}`;
  return `${ROOT}/src/${named}`;
}

function missingFrom(doc: string): string[] {
  const named = [...pathsNamedIn(doc, NAMED_FILE), ...pathsNamedIn(doc, NAMED_FOLDER)];
  return named.filter((path) => !existsSync(placeOf(path)));
}

describe("the paths the docs name", () => {
  it.each(docFiles())("are all there, in %s", (doc) => {
    expect(missingFrom(doc)).toEqual([]);
  });

  it("reads a path out of every doc that names one", () => {
    const naming = docFiles().filter((doc) => readFileSync(`${DOCS}/${doc}`, "utf8").includes(".ts`"));
    expect(naming.length).toBeGreaterThan(0);
    for (const doc of naming) expect(pathsNamedIn(doc, NAMED_FILE).length, doc).toBeGreaterThan(0);
  });
});
