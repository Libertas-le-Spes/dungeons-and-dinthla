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
});
