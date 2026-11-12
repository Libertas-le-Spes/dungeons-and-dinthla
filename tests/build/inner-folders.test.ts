import { readdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { IMPORT_FORMS } from "./import-forms";
import { ImportedPaths } from "./imported-paths";

const SOURCE_FOLDER = fileURLToPath(new URL("../../src", import.meta.url));

let reader: ImportedPaths;

beforeAll(() => {
  reader = new ImportedPaths();
});

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
  { folder: "beyond", reaches: ["beyond", "names"] },
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

  it("refuses beyond importing from the campaign folder", () => {
    expect(breachesOfMadeUpFile("beyond", 'import { a } from "../campaign/one";')).toEqual(["beyond/made-up.ts imports from campaign"]);
  });

  it("refuses beyond importing from the gate", () => {
    expect(breachesOfMadeUpFile("beyond", 'import { a } from "../fence/gate/gatekeeper";')).toEqual(["beyond/made-up.ts imports from fence/gate"]);
  });

  it("allows beyond to import from itself and from names", () => {
    const text = ['import { a } from "./shape/route";', 'import { b } from "../names/name-key";'].join("\n");
    expect(breachesOfMadeUpFile("beyond", text)).toEqual([]);
  });

  it("refuses names importing from beyond", () => {
    expect(breachesOfMadeUpFile("names", 'import { a } from "../beyond/shape/route";')).toEqual(["names/made-up.ts imports from beyond"]);
  });

  it("refuses names importing from fence", () => {
    expect(breachesOfMadeUpFile("names", 'import { a } from "../fence/paths/fence";')).toEqual(["names/made-up.ts imports from fence/paths"]);
  });
});
