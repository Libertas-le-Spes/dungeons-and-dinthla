import { readdirSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Allowances } from "./scan/allowances";
import { isNeverAllowed, NOTHING_ALLOWED } from "./scan/allowance-sets";
import { fenceBreaches } from "./scan/bundle-check";
import { BUNDLED_PROJECT, bundledProjectFiles } from "./scan/bundled-project";
import { ROOT, SOURCE_FOLDER, sourcePath, VIRTUAL_FOLDER } from "./scan/scan-paths";
import { virtualFileSystem } from "./scan/virtual-files";
import { SourceScanner } from "./source-scanner";

const GATEKEEPER_FOLDER = "fence/";
const PARSED_DATA = ["settings/draft-record.ts"];
const ALLOWED = ["fence/gatekeeper.ts", "fence/fenced-files.ts", "fence/fenced-file-actions.ts", "fence/folder-choices.ts", "fence/vault-settings.ts"];
const EDITOR_TEXT_READERS = ["campaign/editor-text.ts"];
const BASES_READERS = ["characters/characters-view.ts"];
const CODE_MIRROR_READERS = ["editor/marker-decorations.ts"];
const LOOSE_CASTERS = ["fence/fenced-metadata.ts", "interface/campaign-view-registered.ts", "interface/one-campaign-tab.ts", "interface/seen-tab.ts"];
const FILE_OPENERS = ["characters/open-character-sheet.ts", "characters/open-character.ts", "interface/open-in-editor.ts", "views/open-link.ts", "views/open-view.ts"];
const VIEW_STATE_SETTERS = ["interface/campaign-view.ts", "interface/one-campaign-tab.ts", "interface/open-campaign.ts", "interface/take-open-leaves.ts", "interface/view-state-patch.ts"];
const ACTIVE_FILE_READERS = ["characters/open-character.ts", "views/open-view.ts"];
const ACTIVE_VIEW_READERS = ["interface/open-in-editor.ts", "interface/shown-campaign-path.ts"];
const EVENT_TRIGGERS = ["fence/fenced-files.ts"];
const LEAF_VIEW_READERS = ["main.ts", "interface/one-campaign-tab.ts", "interface/seen-tab.ts", "interface/view-state-patch.ts"];
const VIEW_FILE_READERS = ["main.ts", "campaign/editor-text.ts", "editor/marker-decorations.ts", "interface/campaign-takeover.ts"];
const NOTE_EVENT_LISTENERS = ["main.ts"];
const GATE_BUILDERS = ["main.ts"];

function isOneOf(files: string[]): (path: string) => boolean {
  return (path) => files.some((file) => path === sourcePath(file));
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
};

let scanner: SourceScanner;

beforeAll(() => {
  scanner = new SourceScanner(ROOT, virtualFileSystem(VIRTUAL_FOLDER, bundledProjectFiles()));
});

afterAll(() => {
  scanner.close();
});

function sourceListing(): string[] {
  const all = readdirSync(SOURCE_FOLDER, { recursive: true, encoding: "utf8", withFileTypes: true });
  return all.filter((entry) => entry.isFile()).map((entry) => `${entry.parentPath}/${entry.name}`.split("\\").join("/").replace(/\/+/g, "/"));
}

function breachesOf(file: string, allowances: Allowances): string[] {
  return scanner.breaches(BUNDLED_PROJECT, [sourcePath(file)], allowances);
}

describe("the plugin's own source", () => {
  it("lets only the gatekeeper's allowed files reach the vault, walk its folders or Obsidian's file metadata, only the allowed files read an editor's text, and none write through an editor or view", () => {
    expect(fenceBreaches(scanner, BUNDLED_PROJECT, sourceListing(), SOURCE_ALLOWANCES)).toEqual([]);
  });

  it("allows only files in the gatekeeper's own folder, each of which still needs it", () => {
    const loaded = scanner.loadedFiles(BUNDLED_PROJECT);
    for (const allowed of ALLOWED) {
      expect(allowed.startsWith(GATEKEEPER_FOLDER)).toBe(true);
      expect(loaded).toContain(sourcePath(allowed));
      expect(breachesOf(allowed, NOTHING_ALLOWED)).not.toEqual([]);
    }
  });

  it("lets only the file that parses the plugin's saved data read every key of a value it can't type, which it still needs", () => {
    for (const parsed of PARSED_DATA) {
      const breaches = breachesOf(parsed, NOTHING_ALLOWED);
      expect(breaches).not.toEqual([]);
      for (const breach of breaches) expect(breach).toContain("reads every key of a value");
    }
  });

  it("lets only the allowed files read an editor's text, each of which still needs it and does nothing else the fence refuses", () => {
    for (const reader of EDITOR_TEXT_READERS) {
      const breaches = breachesOf(reader, { ...SOURCE_ALLOWANCES, editorReading: isNeverAllowed });
      expect(breaches).not.toEqual([]);
      for (const breach of breaches) expect(breach).toContain("reads the text of an editor or view");
    }
  });

  it("lets only the allowed files cast through unknown or any, each of which still needs it and does nothing else the fence refuses", () => {
    for (const caster of LOOSE_CASTERS) {
      const breaches = breachesOf(caster, { ...SOURCE_ALLOWANCES, looseCasts: isNeverAllowed });
      expect(breaches).not.toEqual([]);
      for (const breach of breaches) expect(breach).toContain("casts through unknown or any");
    }
  });

  it("lets only the characters Bases view read what Bases lists, which it still needs and does nothing else the fence refuses", () => {
    for (const reader of BASES_READERS) {
      const breaches = breachesOf(reader, NOTHING_ALLOWED);
      expect(breaches).not.toEqual([]);
      for (const breach of breaches) expect(breach).toContain("reads a note's text through Obsidian");
    }
  });

  it("lets only the marker colouring reach CodeMirror, which it still needs and does nothing else the fence refuses", () => {
    for (const reader of CODE_MIRROR_READERS) {
      const breaches = breachesOf(reader, { ...SOURCE_ALLOWANCES, codeMirror: isNeverAllowed });
      expect(breaches).not.toEqual([]);
      for (const breach of breaches) expect(breach).toMatch(/loads CodeMirror|reaches the editor/);
    }
  });

  it.each([
    { allowance: "fileOpening", files: FILE_OPENERS, breach: "opens, shows or picks a note with openFile" },
    { allowance: "viewState", files: VIEW_STATE_SETTERS, breach: "opens, shows or picks a note with setViewState" },
    { allowance: "activeFile", files: ACTIVE_FILE_READERS, breach: "opens, shows or picks a note with getActiveFile" },
    { allowance: "activeView", files: ACTIVE_VIEW_READERS, breach: "opens, shows or picks a note with getActiveViewOfType" },
    { allowance: "eventTrigger", files: EVENT_TRIGGERS, breach: "takes trigger without calling it with what it can read" },
    { allowance: "leafView", files: LEAF_VIEW_READERS, breach: "reads the view of a leaf" },
    { allowance: "viewFile", files: VIEW_FILE_READERS, breach: "reads the file of a view" },
    { allowance: "noteEvents", files: NOTE_EVENT_LISTENERS, breach: "workspace event, which hands over any note" },
    { allowance: "gateBuilding", files: GATE_BUILDERS, breach: "builds the gate's Gatekeeper" },
  ] as const)("lets only the files allowed $allowance do it, each of which still needs it", ({ allowance, files, breach }) => {
    const allowedEverythingElse: Allowances = { ...SOURCE_ALLOWANCES, [allowance]: isNeverAllowed };
    for (const file of files) {
      const breaches = breachesOf(file, allowedEverythingElse);
      expect(breaches, file).not.toEqual([]);
      for (const found of breaches) expect(found).toContain(breach);
    }
  });
});
