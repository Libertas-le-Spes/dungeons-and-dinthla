import { readdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { IMPORT_FORMS } from "./import-forms";
import { ImportedPaths } from "./imported-paths";

const SOURCE_FOLDER = fileURLToPath(new URL("../../src", import.meta.url));

let reader: ImportedPaths;

const READ_EVERY_FILE_TIME = 120_000;

beforeAll(() => {
  reader = new ImportedPaths();
  for (const file of filesUnder(SOURCE_FOLDER)) importedPathsIn(readFileSync(file, "utf8"));
}, READ_EVERY_FILE_TIME);

afterAll(() => {
  reader.close();
});

interface InnerFolder {
  folder: string;
  reaches: string[];
}

const INNER_FOLDERS: InnerFolder[] = [
  { folder: "names", reaches: ["names"] },
  { folder: "fence/paths", reaches: ["fence/paths", "names"] },
  { folder: "fence/gate", reaches: ["fence/gate", "fence/paths", "names"] },
  { folder: "beyond", reaches: ["beyond", "names", "pdf", "imports/layout"] },
  { folder: "pdf", reaches: ["pdf"] },
  { folder: "imports/layout", reaches: ["imports/layout"] },
  { folder: "characters/facts", reaches: ["characters/facts", "campaign", "notes"] },
  { folder: "characters/imported", reaches: ["characters/imported", "characters/facts", "imports/layout", "campaign", "kinds", "notes"] },
  { folder: "views/pending", reaches: ["views/pending"] },
  { folder: "views/dialogs", reaches: ["views/dialogs", "campaign", "kind-notes"] },
  { folder: "imports", reaches: ["imports", "imports/layout", "beyond", "names", "fence/gate", "campaign", "views/dialogs", "views/pending"] },
];

const BEYOND_IMPORTERS: string[] = ["imports"];
const IMPORTS_IMPORTERS: string[] = ["main.ts"];
const LAYOUT_IMPORTERS: string[] = ["imports", "characters", "beyond"];
const PDF_IMPORTERS: string[] = ["beyond"];

function filesUnder(path: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const inside = join(path, entry.name);
    if (entry.isDirectory()) found.push(...filesUnder(inside));
    if (entry.isFile()) found.push(inside);
  }
  return found;
}

function relativeToSource(file: string): string {
  return relative(SOURCE_FOLDER, file);
}

function filesIn(folder: string): string[] {
  return filesUnder(join(SOURCE_FOLDER, folder));
}

function isInside(target: string, folder: string): boolean {
  return target === folder || target.startsWith(`${folder}/`);
}

function folderOf(file: string, imported: string): string {
  const target = relative(SOURCE_FOLDER, resolve(dirname(file), imported));
  const inner = INNER_FOLDERS.find((candidate) => isInside(target, candidate.folder));
  if (inner !== undefined) return inner.folder;
  const [top] = target.split("/");
  if (top === undefined) throw new Error(`${imported} names no folder`);
  return top;
}

function pointsAtAFile(imported: string): boolean {
  return imported === "." || imported === ".." || imported.startsWith("./") || imported.startsWith("../") || isAbsolute(imported);
}

function importedPathsIn(text: string): string[] {
  return reader.in(text).filter(pointsAtAFile);
}

function breachesIn(inner: InnerFolder, file: string, text: string): string[] {
  const found: string[] = [];
  for (const imported of importedPathsIn(text)) {
    const folder = folderOf(file, imported);
    if (!inner.reaches.includes(folder)) found.push(`${relative(SOURCE_FOLDER, file)} imports from ${folder}`);
  }
  return found;
}

function importersOfIn(target: string, allowed: string[], file: string, text: string): string[] {
  const where = relative(SOURCE_FOLDER, file);
  if (isInside(where, target)) return [];
  if (allowed.some((folder) => isInside(where, folder))) return [];
  const imports = importedPathsIn(text).filter((imported) => folderOf(file, imported) === target);
  return imports.map(() => `${where} imports from ${target}`);
}

function importersOfBeyondIn(allowed: string[], file: string, text: string): string[] {
  return importersOfIn("beyond", allowed, file, text);
}

function importersOfPdfIn(allowed: string[], file: string, text: string): string[] {
  return importersOfIn("pdf", allowed, file, text);
}

function importersOfImportsIn(allowed: string[], file: string, text: string): string[] {
  return importersOfIn("imports", allowed, file, text);
}

function importersOfLayoutIn(allowed: string[], file: string, text: string): string[] {
  return importersOfIn("imports/layout", allowed, file, text);
}

function importersOf(target: string, allowed: string[]): string[] {
  return filesUnder(SOURCE_FOLDER).flatMap((file) => importersOfIn(target, allowed, file, readFileSync(file, "utf8")));
}

function reachesOutward(inner: InnerFolder): string[] {
  return filesIn(inner.folder).flatMap((file) => breachesIn(inner, file, readFileSync(file, "utf8")));
}

function innerFolderNamed(folder: string): InnerFolder {
  const inner = INNER_FOLDERS.find((candidate) => candidate.folder === folder);
  if (inner === undefined) throw new Error(`No inner folder is called ${folder}.`);
  return inner;
}

function breachesOfMadeUpFile(folder: string, text: string): string[] {
  return breachesIn(innerFolderNamed(folder), join(SOURCE_FOLDER, folder, "made-up.ts"), text);
}

function breachesOfMadeUpFileInside(folder: string, inside: string, text: string): string[] {
  return breachesIn(innerFolderNamed(folder), join(SOURCE_FOLDER, folder, inside, "made-up.ts"), text);
}

describe("the inner folders", () => {
  it.each(INNER_FOLDERS)("let src/$folder import only from the folders it may reach", (inner) => {
    expect(reachesOutward(inner)).toEqual([]);
  });

  it("hold every file under src/fence in a folder with a rule of its own", () => {
    const loose = filesIn("fence")
      .map((file) => relative(SOURCE_FOLDER, file))
      .filter((file) => !INNER_FOLDERS.some((inner) => isInside(file, inner.folder)));
    expect(loose).toEqual([]);
  });

  it("read the files inside the folders of src/fence, not only its top", () => {
    const read = INNER_FOLDERS.flatMap((inner) => filesIn(inner.folder)).map((file) => relative(SOURCE_FOLDER, file));
    expect(read).toContain(join("fence", "gate", "gatekeeper.ts"));
    expect(read).toContain(join("fence", "paths", "safe-path.ts"));
    expect(read.every((file) => file.endsWith(".ts"))).toBe(true);
  });

  it("let no folder outside src/beyond import from it, except the folders listed as importers", () => {
    expect(importersOf("beyond", BEYOND_IMPORTERS)).toEqual([]);
  });

  it("let no folder outside src/pdf import from it, except the folders listed as importers", () => {
    expect(importersOf("pdf", PDF_IMPORTERS)).toEqual([]);
  });

  it("let no folder outside src/imports import from it, and only main.ts besides", () => {
    expect(importersOf("imports", IMPORTS_IMPORTERS)).toEqual([]);
  });

  it("let no folder outside src/imports, except the folders listed as importers, import from its layout", () => {
    expect(importersOf("imports/layout", LAYOUT_IMPORTERS)).toEqual([]);
  });

  it("read the files inside the folders of src/imports, not only its top", () => {
    const read = filesIn("imports").map(relativeToSource);
    expect(read).toContain(join("imports", "layout", "plugin-section.ts"));
    expect(read).toContain(join("imports", "note", "writing", "import-writer.ts"));
  });

  it("read the files inside the folders of src/beyond, not only its top", () => {
    const read = filesIn("beyond").map((file) => relative(SOURCE_FOLDER, file));
    expect(read).toContain(join("beyond", "shape", "route.ts"));
    expect(read).toContain(join("beyond", "text", "neutral-text.ts"));
  });
});

describe("the rule the inner folders are checked by, over made-up files", () => {
  it.each(IMPORT_FORMS)("refuses an outward import written as $form", ({ written }) => {
    expect(breachesOfMadeUpFile("fence/gate", written("../../campaign/one"))).toEqual(["fence/gate/made-up.ts imports from campaign"]);
  });

  it("refuses an outward import by an absolute path", () => {
    expect(breachesOfMadeUpFile("fence/gate", `import { a } from "${join(SOURCE_FOLDER, "campaign", "one")}";`)).toEqual(["fence/gate/made-up.ts imports from campaign"]);
  });

  it("refuses an import of the folder above, written as a bare ..", () => {
    expect(breachesOfMadeUpFile("fence/gate", 'import { a } from "..";')).toEqual(["fence/gate/made-up.ts imports from fence"]);
  });

  it("reads the end of an import that runs over several lines", () => {
    expect(breachesOfMadeUpFile("fence/gate", 'import {\n  a,\n  b,\n} from "../../campaign/one";')).toEqual(["fence/gate/made-up.ts imports from campaign"]);
  });

  it("leaves out an import of a package, and a word that only ends in import", () => {
    expect(breachesOfMadeUpFile("fence/gate", 'import { a } from "obsidian";\nreimport("../../campaign/one");')).toEqual([]);
  });

  it("refuses paths importing from gate, though both are in fence", () => {
    expect(breachesOfMadeUpFile("fence/paths", 'import type { Gate } from "../gate/gatekeeper";')).toEqual(["fence/paths/made-up.ts imports from fence/gate"]);
  });

  it("allows gate to import from paths, names and itself", () => {
    const text = ['import { a } from "../paths/fence";', 'import { b } from "./gatekeeper";', 'import { c } from "../../names/file-name";'].join("\n");
    expect(breachesOfMadeUpFile("fence/gate", text)).toEqual([]);
  });

  it.each(IMPORT_FORMS)("refuses a file outside beyond that imports from it, written as $form", ({ written }) => {
    const file = join(SOURCE_FOLDER, "campaign", "made-up.ts");
    expect(importersOfBeyondIn([], file, written("../beyond/shape/route"))).toEqual(["campaign/made-up.ts imports from beyond"]);
  });

  it("allows a folder listed as an importer to import from beyond", () => {
    const file = join(SOURCE_FOLDER, "imports", "made-up.ts");
    expect(importersOfBeyondIn(["imports"], file, 'import { a } from "../beyond/shape/route";')).toEqual([]);
  });

  it("allows a file outside beyond that imports from elsewhere", () => {
    const file = join(SOURCE_FOLDER, "campaign", "made-up.ts");
    expect(importersOfBeyondIn([], file, 'import { a } from "../names/name-key";')).toEqual([]);
  });

  it("allows files inside beyond to import from beyond", () => {
    const file = join(SOURCE_FOLDER, "beyond", "text", "made-up.ts");
    expect(importersOfBeyondIn([], file, 'import { a } from "../shape/route";')).toEqual([]);
  });

  it("refuses beyond importing from the campaign folder", () => {
    expect(breachesOfMadeUpFile("beyond", 'import { a } from "../campaign/one";')).toEqual(["beyond/made-up.ts imports from campaign"]);
  });

  it("refuses beyond importing from the gate", () => {
    expect(breachesOfMadeUpFile("beyond", 'import { a } from "../fence/gate/gatekeeper";')).toEqual(["beyond/made-up.ts imports from fence/gate"]);
  });

  it("allows beyond to import from itself, from names and from pdf", () => {
    const text = ['import { a } from "./shape/route";', 'import { b } from "../names/name-key";', 'import { c } from "../pdf/read-pdf-fields";'].join("\n");
    expect(breachesOfMadeUpFile("beyond", text)).toEqual([]);
  });

  it("refuses names importing from beyond", () => {
    expect(breachesOfMadeUpFile("names", 'import { a } from "../beyond/shape/route";')).toEqual(["names/made-up.ts imports from beyond"]);
  });

  it("refuses names importing from fence", () => {
    expect(breachesOfMadeUpFile("names", 'import { a } from "../fence/paths/fence";')).toEqual(["names/made-up.ts imports from fence/paths"]);
  });
});

describe("the rule for who may import src/pdf, over made-up files", () => {
  it.each(IMPORT_FORMS)("refuses a file outside pdf that imports from it, written as $form", ({ written }) => {
    const file = join(SOURCE_FOLDER, "campaign", "made-up.ts");
    expect(importersOfPdfIn(PDF_IMPORTERS, file, written("../pdf/read-pdf-fields"))).toEqual(["campaign/made-up.ts imports from pdf"]);
  });

  it("allows a file inside beyond, at any depth, to import from pdf", () => {
    const file = join(SOURCE_FOLDER, "beyond", "sheet", "parts", "made-up.ts");
    expect(importersOfPdfIn(PDF_IMPORTERS, file, 'import { a } from "../../../pdf/read-pdf-fields";')).toEqual([]);
  });

  it("allows a file inside pdf to import from pdf", () => {
    const file = join(SOURCE_FOLDER, "pdf", "fields", "made-up.ts");
    expect(importersOfPdfIn(PDF_IMPORTERS, file, 'import { a } from "../read-pdf-fields";')).toEqual([]);
  });

  it("refuses names importing from pdf", () => {
    const file = join(SOURCE_FOLDER, "names", "made-up.ts");
    expect(importersOfPdfIn(PDF_IMPORTERS, file, 'import { a } from "../pdf/read-pdf-fields";')).toEqual(["names/made-up.ts imports from pdf"]);
  });
});

describe("the rule for src/pdf, over made-up files", () => {
  it.each(IMPORT_FORMS)("refuses an import of the campaign folder written as $form", ({ written }) => {
    expect(breachesOfMadeUpFile("pdf", written("../campaign/one"))).toEqual(["pdf/made-up.ts imports from campaign"]);
  });

  it("refuses an import of names, which the reader has no need of", () => {
    expect(breachesOfMadeUpFile("pdf", 'import { a } from "../names/file-name";')).toEqual(["pdf/made-up.ts imports from names"]);
  });

  it("refuses an import of the fence folders, so the reader can't touch the vault", () => {
    expect(breachesOfMadeUpFile("pdf", 'import { a } from "../fence/gate/gatekeeper";')).toEqual(["pdf/made-up.ts imports from fence/gate"]);
  });

  it("refuses a file deep inside src/pdf importing outward", () => {
    expect(breachesOfMadeUpFileInside("pdf", "fields/sources", 'import { a } from "../../../beyond/one";')).toEqual(["pdf/fields/sources/made-up.ts imports from beyond"]);
  });

  it("allows the files of src/pdf to import from each other, at any depth", () => {
    const text = ['import { a } from "./one";', 'import { b } from "../fields/two";', 'import { c } from "../../pdf/three";'].join("\n");
    expect(breachesOfMadeUpFileInside("pdf", "streams", text)).toEqual([]);
  });

  it("reads every file under src/pdf, including those in subfolders", () => {
    const read = filesIn("pdf").map((file) => relative(SOURCE_FOLDER, file));
    expect(read).toContain(join("pdf", "read-pdf-fields.ts"));
    expect(read).toContain(join("pdf", "streams", "inflate", "bounded-inflater.ts"));
  });
});

describe("the rules for src/imports and its layout, over made-up files", () => {
  it("allows imports to reach beyond, names, the gate, the campaign folder, the views, its layout and itself", () => {
    const text = [
      'import { g } from "../views/dialogs/change-dialog";',
      'import { a } from "../beyond/shape/route";',
      'import { b } from "../names/name-key";',
      'import { c } from "../fence/gate/fenced-files";',
      'import { d } from "../campaign/paths/session-file";',
      'import { e } from "./layout/plugin-section";',
      'import { f } from "./note/writing/imported-note";',
    ].join("\n");
    expect(breachesOfMadeUpFile("imports", text)).toEqual([]);
  });

  it.each(["../fence/paths/fence", "../pdf/read-pdf-fields", "../characters/reading/sheet-values", "../funds/items/item-writer", "../kinds/reference-kind", "../interface/view/campaign-view"])(
    "refuses imports importing from %s",
    (path) => {
      expect(breachesOfMadeUpFile("imports", `import { a } from "${path}";`).length).toBe(1);
    },
  );

  it.each(IMPORT_FORMS)("refuses imports importing from the vault's other folders, written as $form", ({ written }) => {
    expect(breachesOfMadeUpFile("imports", written("../characters/one"))).toEqual(["imports/made-up.ts imports from characters"]);
  });

  it("refuses the layout importing from any other part of imports", () => {
    expect(breachesOfMadeUpFile("imports/layout", 'import { a } from "../note/reading/note-layout";')).toEqual(["imports/layout/made-up.ts imports from imports"]);
  });

  it("refuses the layout importing from beyond or names", () => {
    expect(breachesOfMadeUpFile("imports/layout", 'import { a } from "../../beyond/shape/route";')).toEqual(["imports/layout/made-up.ts imports from beyond"]);
    expect(breachesOfMadeUpFile("imports/layout", 'import { a } from "../../names/name-key";')).toEqual(["imports/layout/made-up.ts imports from names"]);
  });

  it("allows the layout to import from itself", () => {
    expect(breachesOfMadeUpFile("imports/layout", 'import { a } from "./plugin-section";')).toEqual([]);
  });

  it.each(IMPORT_FORMS)("refuses a file outside imports that imports from it, written as $form", ({ written }) => {
    const file = join(SOURCE_FOLDER, "campaign", "made-up.ts");
    expect(importersOfImportsIn(IMPORTS_IMPORTERS, file, written("../imports/note/writing/imported-note"))).toEqual(["campaign/made-up.ts imports from imports"]);
  });

  it("allows a file inside imports, at any depth, to import from imports", () => {
    const file = join(SOURCE_FOLDER, "imports", "note", "made-up.ts");
    expect(importersOfImportsIn(IMPORTS_IMPORTERS, file, 'import { a } from "../../imports/note/other";')).toEqual([]);
  });

  it("refuses a file outside imports that imports from its layout, unless the folder is listed", () => {
    const file = join(SOURCE_FOLDER, "characters", "made-up.ts");
    const text = 'import { a } from "../imports/layout/plugin-section";';
    expect(importersOfLayoutIn([], file, text)).toEqual(["characters/made-up.ts imports from imports/layout"]);
    expect(importersOfLayoutIn(["characters"], file, text)).toEqual([]);
  });

  it("allows a file in characters, at any depth, to import from the layout", () => {
    const file = join(SOURCE_FOLDER, "characters", "imported", "made-up.ts");
    expect(importersOfLayoutIn(LAYOUT_IMPORTERS, file, 'import { a } from "../../imports/layout/plugin-sections";')).toEqual([]);
  });

  it("refuses a file in characters that imports from imports beyond its layout", () => {
    const file = join(SOURCE_FOLDER, "characters", "imported", "made-up.ts");
    expect(importersOfImportsIn(IMPORTS_IMPORTERS, file, 'import { a } from "../../imports/note/reading/note-layout";')).toEqual(["characters/imported/made-up.ts imports from imports"]);
  });

  it("allows main.ts to import from imports", () => {
    const file = join(SOURCE_FOLDER, "main.ts");
    expect(importersOfImportsIn(IMPORTS_IMPORTERS, file, 'import { a } from "./imports/dialog/opening/beyond-openers";')).toEqual([]);
  });

  it("refuses a folder other than main.ts that imports from imports", () => {
    const file = join(SOURCE_FOLDER, "interface", "sections", "made-up.ts");
    expect(importersOfImportsIn(IMPORTS_IMPORTERS, file, 'import { a } from "../../imports/dialog/opening/beyond-openers";')).toEqual(["interface/sections/made-up.ts imports from imports"]);
  });

  it("refuses a file in funds that imports from the layout", () => {
    const file = join(SOURCE_FOLDER, "funds", "made-up.ts");
    expect(importersOfLayoutIn(LAYOUT_IMPORTERS, file, 'import { a } from "../imports/layout/plugin-sections";')).toEqual(["funds/made-up.ts imports from imports/layout"]);
  });

  it("allows the notes of imports to import from the layout", () => {
    const file = join(SOURCE_FOLDER, "imports", "note", "made-up.ts");
    expect(importersOfLayoutIn(LAYOUT_IMPORTERS, file, 'import { a } from "../layout/plugin-section";')).toEqual([]);
  });

  it("refuses names importing from imports", () => {
    expect(breachesOfMadeUpFile("names", 'import { a } from "../imports/layout/plugin-section";')).toEqual(["names/made-up.ts imports from imports/layout"]);
  });
});

describe("the inner folders of src/characters, over made-up files", () => {
  it("refuses an import from the sheet's own reading into the imported folder", () => {
    expect(breachesOfMadeUpFileInside("characters/imported", "reading", 'import { a } from "../../reading/sheet-values";')).toEqual([
      "characters/imported/reading/made-up.ts imports from characters",
    ]);
  });

  it("refuses an import from the pages into the imported folder", () => {
    expect(breachesOfMadeUpFileInside("characters/imported", "drawing", 'import type { A } from "../../pages/character-creators";')).toEqual([
      "characters/imported/drawing/made-up.ts imports from characters",
    ]);
  });

  it("lets the imported folder import the facts both sides share", () => {
    expect(breachesOfMadeUpFileInside("characters/imported", "reading", 'import { a } from "../../facts/same-name";')).toEqual([]);
  });

  it("refuses an import from the facts folder back into the sheet's reading", () => {
    expect(breachesOfMadeUpFile("characters/facts", 'import { a } from "../reading/sheet-values";')).toEqual(["characters/facts/made-up.ts imports from characters"]);
  });
});

describe("what src/imports may take from src/views, over made-up files", () => {
  it("lets the import dialog build on the shared dialogs", () => {
    expect(breachesOfMadeUpFileInside("imports", "dialog", 'import { a } from "../../views/dialogs/change-dialog";')).toEqual([]);
  });

  it("refuses any other part of src/views", () => {
    expect(breachesOfMadeUpFileInside("imports", "dialog", 'import { a } from "../../views/lists/row-keys";')).toEqual(["imports/dialog/made-up.ts imports from views"]);
  });
});

