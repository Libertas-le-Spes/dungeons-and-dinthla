import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { IMPORT_FORMS } from "./import-forms";
import { ImportedPaths } from "./imported-paths";

const NOTE_FOLDER = fileURLToPath(new URL("../../src/imports/note", import.meta.url));

interface NoteFolder {
  folder: string;
  reaches: string[];
}

const NOTE_FOLDERS: NoteFolder[] = [
  { folder: "reading", reaches: ["reading"] },
  { folder: "rows", reaches: ["rows"] },
  { folder: "properties", reaches: ["properties", "rows"] },
  { folder: "sections", reaches: ["sections", "rows"] },
  { folder: "changes", reaches: ["changes", "reading"] },
  { folder: "matching", reaches: ["matching"] },
  { folder: "writing", reaches: ["writing", "reading", "properties", "sections", "changes"] },
];

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
    if (entry.isFile()) found.push(inside);
  }
  return found;
}

function noteFolderOf(target: string): string | null {
  const inside = relative(NOTE_FOLDER, target);
  if (inside.startsWith("..")) return null;
  const [first] = inside.split("/");
  if (first === undefined) return null;
  return first;
}

function breachesIn(note: NoteFolder, file: string, text: string): string[] {
  const found: string[] = [];
  for (const imported of reader.in(text)) {
    if (!imported.startsWith(".")) continue;
    const target = noteFolderOf(resolve(dirname(file), imported));
    if (target === null || note.reaches.includes(target)) continue;
    found.push(`${relative(NOTE_FOLDER, file)} imports from ${target}`);
  }
  return found;
}

function breachesOfFolder(note: NoteFolder): string[] {
  const found: string[] = [];
  for (const file of filesUnder(join(NOTE_FOLDER, note.folder))) found.push(...breachesIn(note, file, readFileSync(file, "utf8")));
  return found;
}

function noteFolderNamed(folder: string): NoteFolder {
  for (const note of NOTE_FOLDERS) {
    if (note.folder === folder) return note;
  }
  throw new Error(`No note folder is called ${folder}.`);
}

function breachesOfMadeUpFile(folder: string, inside: string, text: string): string[] {
  return breachesIn(noteFolderNamed(folder), join(NOTE_FOLDER, folder, inside, "made-up.ts"), text);
}

function folderNameOf(entry: NoteFolder): string {
  return entry.folder;
}

function isFolderEntry(entry: { isDirectory(): boolean }): boolean {
  return entry.isDirectory();
}

function isFileEntry(entry: { isFile(): boolean }): boolean {
  return entry.isFile();
}

function nameOfEntry(entry: { name: string }): string {
  return entry.name;
}

describe("the folders inside src/imports/note", () => {
  it.each(NOTE_FOLDERS)("let src/imports/note/$folder import only from the note folders it may reach", (note) => {
    expect(breachesOfFolder(note)).toEqual([]);
  });

  it("have a rule for every folder the note holds", () => {
    const folders = readdirSync(NOTE_FOLDER, { withFileTypes: true }).filter(isFolderEntry).map(nameOfEntry);
    expect(folders.sort()).toEqual(NOTE_FOLDERS.map(folderNameOf).sort());
  });

  it("hold no loose file at the top of src/imports/note", () => {
    const loose = readdirSync(NOTE_FOLDER, { withFileTypes: true }).filter(isFileEntry);
    expect(loose.map(nameOfEntry)).toEqual([]);
  });

  it("hold at most ten files in any one folder", () => {
    const crowded: string[] = [];
    for (const entry of readdirSync(NOTE_FOLDER, { recursive: true, withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const inside = readdirSync(join(entry.parentPath, entry.name), { withFileTypes: true }).filter(isFileEntry);
      if (inside.length > 10) crowded.push(`${entry.name} holds ${inside.length}`);
    }
    expect(crowded).toEqual([]);
  });
});

describe("the rule for the folders inside src/imports/note, over made-up files", () => {
  it.each(IMPORT_FORMS)("refuses changes importing from writing, written as $form", ({ written }) => {
    expect(breachesOfMadeUpFile("changes", "", written("../writing/guarding/read-back"))).toEqual(["changes/made-up.ts imports from writing"]);
  });

  it("refuses sections importing from properties", () => {
    expect(breachesOfMadeUpFile("sections", "lines", 'import { a } from "../../properties/kinds/class-property";')).toEqual(["sections/lines/made-up.ts imports from properties"]);
  });

  it("refuses reading importing from any other note folder", () => {
    expect(breachesOfMadeUpFile("reading", "", 'import { a } from "../writing/import-writer";')).toEqual(["reading/made-up.ts imports from writing"]);
    expect(breachesOfMadeUpFile("reading", "", 'import { a } from "../changes/import-changes";')).toEqual(["reading/made-up.ts imports from changes"]);
  });

  it("refuses properties importing from sections", () => {
    expect(breachesOfMadeUpFile("properties", "kinds", 'import { a } from "../../sections/contents/section-content";')).toEqual(["properties/kinds/made-up.ts imports from sections"]);
  });

  it("allows writing to import from the folders below it", () => {
    const text = ['import { a } from "../reading/note-layout";', 'import { b } from "../changes/import-changes";', 'import { c } from "../sections/contents/section-contents";'].join("\n");
    expect(breachesOfMadeUpFile("writing", "", text)).toEqual([]);
  });

  it("allows a folder to import from itself at any depth, and from outside the note", () => {
    const text = ['import { a } from "../helpers/one";', 'import { b } from "../../../layout/plugin-section";', 'import { c } from "obsidian";'].join("\n");
    expect(breachesOfMadeUpFile("properties", "kinds", text)).toEqual([]);
  });

  it("refuses matching importing from reading", () => {
    expect(breachesOfMadeUpFile("matching", "", 'import { a } from "../reading/note-layout";')).toEqual(["matching/made-up.ts imports from reading"]);
  });
});
