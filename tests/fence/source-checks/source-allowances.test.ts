import { readdirSync } from "node:fs";
import { relative } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import type { Allowances } from "../scan/reading/allowances";
import { isNeverAllowed, isNoNameAllowed, isPageAttribute, isPageOption, isPageTag, NOTHING_ALLOWED } from "../scan/running/allowance-sets";
import { scannedFiles, unreadableCode } from "../scan/running/bundle-check";
import { NameUses, type NameRefusal } from "../scan/running/name-uses";
import { BUNDLED_PROJECT, bundledProjectFiles } from "../scan/running/bundled-project";
import { ROOT, SOURCE_FOLDER, sourcePath, VIRTUAL_FOLDER } from "../scan/reading/scan-paths";
import { virtualFileSystem } from "../scan/running/virtual-files";
import { SourceScanner } from "../scan/running/source-scanner";
import { PAGE_GLOBALS, PLAIN_GLOBALS } from "../allowed/globals";
import { OBSIDIAN_IMPORTS } from "../allowed/obsidian-imports";
import { COMPUTED_KEY_READERS } from "../allowed/computed-keys";
import { PAGE_ESCAPE_READERS, PAGE_ESCAPES, PAGE_MEMBERS } from "../allowed/page-members";

const GATEKEEPER_FOLDER = "fence/gate/";
const PARSED_DATA = ["settings/drafts/draft-record.ts", "beyond/reply/json/json-reader.ts"];
const ALLOWED = ["fence/gate/gatekeeper.ts", "fence/gate/fenced-files.ts", "fence/gate/fenced-file-actions.ts", "fence/gate/folder-choices.ts", "fence/gate/vault-settings.ts"];
const EDITOR_TEXT_READERS = ["campaign/reading/editor-text.ts"];
const BASES_READERS = ["characters/pages/characters-view.ts"];
const CODE_MIRROR_READERS = ["editor/marker-decorations.ts"];
const LOOSE_CASTERS = ["fence/gate/fenced-metadata.ts", "interface/view/campaign-view-registered.ts", "interface/tabs/one-campaign-tab.ts", "interface/tabs/seen-tab.ts"];
const FILE_OPENERS = ["characters/editing/open-character-sheet.ts", "characters/editing/open-character.ts", "interface/view/open-in-editor.ts", "views/opening/open-link.ts", "views/opening/open-view.ts"];
const VIEW_STATE_SETTERS = ["interface/view/campaign-view.ts", "interface/tabs/one-campaign-tab.ts", "interface/tabs/open-campaign.ts", "interface/takeover/take-open-leaves.ts", "interface/takeover/view-state-patch.ts"];
const ACTIVE_FILE_READERS = ["characters/editing/open-character.ts", "views/opening/open-view.ts"];
const ACTIVE_VIEW_READERS = ["interface/view/editor-wiring.ts", "interface/view/open-in-editor.ts", "interface/view/shown-campaign-path.ts"];
const EVENT_TRIGGERS = ["fence/gate/fenced-files.ts"];
const LEAF_VIEW_READERS = ["main.ts", "interface/tabs/one-campaign-tab.ts", "interface/tabs/seen-tab.ts", "interface/takeover/view-state-patch.ts"];
const VIEW_FILE_READERS = ["main.ts", "campaign/reading/editor-text.ts", "editor/marker-decorations.ts", "interface/takeover/campaign-takeover.ts"];
const NOTE_EVENT_LISTENERS = ["main.ts"];
const GATE_BUILDERS = ["main.ts"];
const NETWORK_CALLERS = ["online/beyond-call.ts"];
const BEYOND_CALLERS = ["online/beyond-call.ts", "online/call-rules.ts", "imports/dialog/online/online-wiring.ts", "imports/dialog/online/online-import.ts"];
const POST_PROCESSING = ["main.ts"];
const PAGE_TEXT_READERS = ["reading/colour-markers.ts"];
const ELEMENT_QUERIERS = ["reading/colour-markers.ts", "characters/pages/character-sheet-page.ts", "funds/page/funds-page.ts", "views/lists/row-focus.ts"];

function isOneOf(files: string[]): (path: string) => boolean {
  return (path) => files.some((file) => path === sourcePath(file));
}

function namesFor(path: string, allowed: Record<string, string[]>): string[] {
  return Object.entries(allowed).flatMap(([place, names]) => {
    if (!path.startsWith(sourcePath(place))) return [];
    return names;
  });
}

function isImportAllowed(path: string, name: string): boolean {
  return namesFor(path, OBSIDIAN_IMPORTS).includes(name);
}

function isPageMemberAllowed(path: string, name: string): boolean {
  return namesFor(path, PAGE_MEMBERS).includes(name);
}

function isGlobalAllowed(path: string, name: string): boolean {
  return PLAIN_GLOBALS.includes(name) || namesFor(path, PAGE_GLOBALS).includes(name);
}

const isGatekeeper = isOneOf(ALLOWED);

const readsKeysOfAnything = isOneOf([...ALLOWED, ...PARSED_DATA]);

const SOURCE_ALLOWANCES: Allowances = {
  vault: isGatekeeper,
  keyReading: readsKeysOfAnything,
  editorReading: isOneOf(EDITOR_TEXT_READERS),
  fileTree: isGatekeeper,
  looseCasts: isOneOf(LOOSE_CASTERS),
  noteReading: isOneOf(BASES_READERS),
  codeMirror: isOneOf(CODE_MIRROR_READERS),
  fileOpening: isOneOf(FILE_OPENERS),
  viewState: isOneOf(VIEW_STATE_SETTERS),
  activeFile: isOneOf(ACTIVE_FILE_READERS),
  activeView: isOneOf(ACTIVE_VIEW_READERS),
  eventTrigger: isOneOf(EVENT_TRIGGERS),
  leafView: isOneOf(LEAF_VIEW_READERS),
  viewFile: isOneOf(VIEW_FILE_READERS),
  noteEvents: isOneOf(NOTE_EVENT_LISTENERS),
  gateBuilding: isOneOf(GATE_BUILDERS),
  network: isOneOf(NETWORK_CALLERS),
  beyondCalling: isOneOf(BEYOND_CALLERS),
  obsidianImports: isImportAllowed,
  globals: isGlobalAllowed,
  postProcessing: isOneOf(POST_PROCESSING),
  pageMembers: isPageMemberAllowed,
  computedKeys: isOneOf(COMPUTED_KEY_READERS),
  pageText: isOneOf(PAGE_TEXT_READERS),
  elementQueries: isOneOf(ELEMENT_QUERIERS),
  tags: isPageTag,
  attributes: isPageAttribute,
  elementOptions: isPageOption,
};

const scanner = new SourceScanner(ROOT, virtualFileSystem(VIRTUAL_FOLDER, bundledProjectFiles()));
const LOADED = scanner.loadedFiles(BUNDLED_PROJECT);
const SCANNED = scannedFiles(LOADED);

afterAll(() => {
  scanner.close();
});

function sourceListing(): string[] {
  const all = readdirSync(SOURCE_FOLDER, { recursive: true, encoding: "utf8", withFileTypes: true });
  return all.filter((entry) => entry.isFile()).map((entry) => `${entry.parentPath}/${entry.name}`.split("\\").join("/").replace(/\/+/g, "/"));
}

function shownPath(path: string): string {
  return relative(SOURCE_FOLDER, path);
}

function isOutsideSource(path: string): boolean {
  return !path.startsWith(SOURCE_FOLDER);
}

function breachesOf(file: string, allowances: Allowances): string[] {
  return scanner.breaches(BUNDLED_PROJECT, [sourcePath(file)], allowances);
}

function placeOf(path: string, allowed: Record<string, string[]>): string | null {
  const place = Object.keys(allowed).find((candidate) => path.startsWith(sourcePath(candidate)));
  if (place === undefined) return null;
  return place;
}

function filesOfPlace(place: string, allowed: Record<string, string[]>): string[] {
  const files: string[] = [];
  for (const path of SCANNED) {
    if (placeOf(path, allowed) === place) files.push(path);
  }
  return files;
}

interface ListedName {
  place: string;
  name: string;
}

function listedNames(allowed: Record<string, string[]>): ListedName[] {
  const listed: ListedName[] = [];
  for (const [place, names] of Object.entries(allowed)) {
    for (const name of names) listed.push({ place, name });
  }
  return listed;
}

interface NameList {
  list: string;
  allowed: Record<string, string[]>;
}

const NAME_LISTS: NameList[] = [
  { list: "Obsidian imports", allowed: OBSIDIAN_IMPORTS },
  { list: "page globals", allowed: PAGE_GLOBALS },
  { list: "page members", allowed: PAGE_MEMBERS },
];

const IMPORTS_REFUSED: NameRefusal = { allowances: { ...SOURCE_ALLOWANCES, obsidianImports: isNoNameAllowed }, breach: /^src\/[^:]+:\d+ imports (?<name>\w+) from obsidian/ };

const PAGE_GLOBALS_REFUSED: NameRefusal = { allowances: { ...SOURCE_ALLOWANCES, globals: isPlainGlobalOnly }, breach: /^src\/[^:]+:\d+ uses the global (?<name>\w+)$/ };

const PAGE_MEMBERS_REFUSED: NameRefusal = { allowances: { ...SOURCE_ALLOWANCES, pageMembers: isNoNameAllowed }, breach: /^src\/[^:]+:\d+ uses the page's (?<name>\S+), which/ };

function isPlainGlobalOnly(_path: string, name: string): boolean {
  return PLAIN_GLOBALS.includes(name);
}

const IMPORT_USES = new NameUses(scanner, BUNDLED_PROJECT, IMPORTS_REFUSED);
const PAGE_GLOBAL_USES = new NameUses(scanner, BUNDLED_PROJECT, PAGE_GLOBALS_REFUSED);
const PAGE_MEMBER_USES = new NameUses(scanner, BUNDLED_PROJECT, PAGE_MEMBERS_REFUSED);

function repeatsIn(names: string[]): string[] {
  const seen = new Set<string>();
  const repeats: string[] = [];
  for (const name of names) {
    if (seen.has(name)) repeats.push(name);
    seen.add(name);
  }
  return repeats;
}

function isPlainWord(name: string): boolean {
  return /^\w+$/.test(name);
}

function unplainIn(names: string[]): string[] {
  const unplain: string[] = [];
  for (const name of names) {
    if (!isPlainWord(name)) unplain.push(name);
  }
  return unplain;
}

interface StillNeeded {
  allowance: string;
  file: string;
  allowances: Allowances;
  breach: string | RegExp;
}

function allowedEverythingBut(allowance: keyof Allowances): Allowances {
  return { ...SOURCE_ALLOWANCES, [allowance]: isNeverAllowed };
}

function neededBy(allowance: keyof Allowances, files: string[], breach: string | RegExp): StillNeeded[] {
  const needed: StillNeeded[] = [];
  for (const file of files) needed.push({ allowance, file, allowances: allowedEverythingBut(allowance), breach });
  return needed;
}

function onlyNeededBy(allowance: string, files: string[], breach: string): StillNeeded[] {
  const needed: StillNeeded[] = [];
  for (const file of files) needed.push({ allowance, file, allowances: NOTHING_ALLOWED, breach });
  return needed;
}

const STILL_NEEDED: StillNeeded[] = [
  ...onlyNeededBy("keyReading", PARSED_DATA, "reads every key of a value"),
  ...onlyNeededBy("noteReading", BASES_READERS, "reads a note's text through Obsidian"),
  ...neededBy("editorReading", EDITOR_TEXT_READERS, "reads the text of an editor or view"),
  ...neededBy("looseCasts", LOOSE_CASTERS, "casts through unknown or any"),
  ...neededBy("codeMirror", CODE_MIRROR_READERS, /loads CodeMirror|reaches the editor/),
  ...neededBy("fileOpening", FILE_OPENERS, "opens, shows or picks a note with openFile"),
  ...neededBy("viewState", VIEW_STATE_SETTERS, "opens, shows or picks a note with setViewState"),
  ...neededBy("activeFile", ACTIVE_FILE_READERS, "opens, shows or picks a note with getActiveFile"),
  ...neededBy("activeView", ACTIVE_VIEW_READERS, "opens, shows or picks a note with getActiveViewOfType"),
  ...neededBy("eventTrigger", EVENT_TRIGGERS, "takes trigger without calling it with what it can read"),
  ...neededBy("leafView", LEAF_VIEW_READERS, "reads the view of a leaf"),
  ...neededBy("viewFile", VIEW_FILE_READERS, "reads the file of a view"),
  ...neededBy("noteEvents", NOTE_EVENT_LISTENERS, "workspace event, which hands over any note"),
  ...neededBy("gateBuilding", GATE_BUILDERS, "builds the gate's Gatekeeper"),
  ...neededBy("beyondCalling", BEYOND_CALLERS, /names (callBeyond|BeyondCalls), which only the files that call D&D Beyond may/),
  ...neededBy("network", NETWORK_CALLERS, /names requestUrl, which only the file allowed the network may/),
  ...neededBy("postProcessing", POST_PROCESSING, "registers a post-processor"),
  ...neededBy("computedKeys", COMPUTED_KEY_READERS, "reads a key that isn't written in place"),
  ...neededBy("pageText", PAGE_TEXT_READERS, "reads the page's text"),
  ...neededBy("elementQueries", ELEMENT_QUERIERS, "looks elements up"),
];

describe("the plugin's own source", () => {
  it("holds no code the scan can't read, and loads only plain TypeScript from the entry point", () => {
    expect(unreadableCode(sourceListing(), LOADED)).toEqual([]);
  });

  it("is loaded from inside src only, so every file the bundle loads is scanned below", () => {
    expect(SCANNED.filter(isOutsideSource)).toEqual([]);
    expect(SCANNED.length).toBeGreaterThan(0);
  });

  it.each(SCANNED.map(shownPath))("passes every rule of the fence in %s, with only the allowances it is given", (file) => {
    expect(breachesOf(file, SOURCE_ALLOWANCES)).toEqual([]);
  });
});

describe("the files allowed past the fence", () => {
  it.each(ALLOWED)("allow %s to reach the vault only because it is in the gatekeeper's own folder and still needs it", (file) => {
    expect(file.startsWith(GATEKEEPER_FOLDER)).toBe(true);
    expect(LOADED).toContain(sourcePath(file));
    expect(breachesOf(file, NOTHING_ALLOWED)).not.toEqual([]);
  });

  it.each(STILL_NEEDED)("allow $allowance to $file, which still needs it and does nothing else the fence refuses", ({ file, allowances, breach }) => {
    const breaches = breachesOf(file, allowances);
    expect(breaches).not.toEqual([]);
    for (const found of breaches) expect(found).toMatch(breach);
  });
});

describe("the lists of names each place may use", () => {
  it.each(NAME_LISTS)("name each of the $list once in a place, and no place with none", ({ allowed }) => {
    for (const [place, names] of Object.entries(allowed)) {
      expect(names, place).not.toEqual([]);
      expect(repeatsIn(names), place).toEqual([]);
    }
  });

  it.each(NAME_LISTS)("name only plain words in the $list, so each is found in a file's text as a whole word", ({ allowed }) => {
    for (const [place, names] of Object.entries(allowed)) expect(unplainIn(names), place).toEqual([]);
  });

  it.each(listedNames(OBSIDIAN_IMPORTS))("let $place import $name from Obsidian only while a file there still does", ({ place, name }) => {
    expect(IMPORT_USES.fileUsing(filesOfPlace(place, OBSIDIAN_IMPORTS), name)).not.toBeNull();
  });

  it.each(listedNames(PAGE_GLOBALS))("let $place use the page or timer global $name only while it still does", ({ place, name }) => {
    expect(PAGE_GLOBAL_USES.fileUsing(filesOfPlace(place, PAGE_GLOBALS), name)).not.toBeNull();
  });

  it.each(listedNames(PAGE_MEMBERS))("let $place use the page's $name only while it still does", ({ place, name }) => {
    expect(PAGE_MEMBER_USES.fileUsing(filesOfPlace(place, PAGE_MEMBERS), name)).not.toBeNull();
  });

  it("let only the marker colouring reach past the plugin's own elements", () => {
    const reaching = Object.entries(PAGE_MEMBERS).flatMap(([file, names]) => {
      const allowed = PAGE_ESCAPE_READERS[file];
      return names.filter((name) => PAGE_ESCAPES.includes(name) && (allowed === undefined || !allowed.includes(name))).map((name) => `${file} ${name}`);
    });
    expect(reaching).toEqual([]);
  });
});
