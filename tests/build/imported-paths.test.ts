import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { IMPORT_FORMS } from "./import-forms";
import { ImportedPaths } from "./imported-paths";

let reader: ImportedPaths;

beforeAll(() => {
  reader = new ImportedPaths();
});

afterAll(() => {
  reader.close();
});

describe("the paths read from the imports in a file's text", () => {
  it.each(IMPORT_FORMS)("include the path of $form", ({ written }) => {
    expect(reader.in(written("../one/two"))).toEqual(["../one/two"]);
  });

  it("include a package's name as written, for the rule to set aside", () => {
    expect(reader.in('import { a } from "obsidian";')).toEqual(["obsidian"]);
  });

  it("leave out the text of a string, a comment or a function that only ends in import", () => {
    const text = ['const a = \'import "../one";\';', '// import "../two";', 'const b = reimport("../three");', "const c = `from '../four'`;"].join("\n");
    expect(reader.in(text)).toEqual([]);
  });

  it.each([
    ["a template with a substitution", "const a = (n: string) => import(`../b/${n}`);"],
    ["a concatenation", 'const a = (n: string) => import("../b/" + n);'],
    ["a concatenation of constants", 'const a = () => import("../b/" + "x");'],
    ["a name", "const a = (n: string) => import(n);"],
    ["a require of a concatenation", 'const a = (n: string) => require("../b/" + n);'],
    ["a call with no path", "const a = () => import();"],
  ])("refuse a dynamic path that isn't written out, as %s", (_form, text) => {
    expect(() => reader.in(text)).toThrow("can't be read");
  });
});
