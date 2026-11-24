import { vi } from "vitest";
import type { App, TFile } from "obsidian";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import type { CharacterNotes } from "../../../src/characters/reading/character-notes";
import type { CharacterEditing } from "../../../src/characters/editing/open-character";
import { OBSIDIAN_SHOWING } from "../../host/showing/obsidian-showing";
import { STUB_SPELLING } from "../../host/stub-spelling";
import { STUB_SYNTAX } from "../../host/stub-syntax";

export const CAMPAIGNS = ["Ashen Road", "Pale Moon"];
export const MIRA = "Pale Moon/Characters/Mira.md";

export interface Setup {
  active?: string | null;
  files?: string[];
  ownNote?: string;
  sessions?: SessionNote[];
  readFails?: boolean;
}

export function setUp({ active = MIRA, files = [MIRA, "Drafts/Characters/Mira.md"], ownNote = "", sessions = [], readFails = false }: Setup = {}) {
  const read = vi.fn(async () => {
    if (readFails) throw new Error("the disk is gone");
    return ownNote;
  });
  const fileAt = (path: string) => ({ path, basename: path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/, "") }) as TFile;
  const app = {
    workspace: {
      getActiveFile: () => {
        if (active === null) return null;
        return fileAt(active);
      },
    },
  } as unknown as App;
  const held = (path: string) => {
    if (!files.includes(path)) return null;
    return fileAt(path);
  };
  const characters = {
    campaignFolders: () => CAMPAIGNS,
    sessionsOf: async () => sessions,
    pathOfLink: (linktext: string) => `Pale Moon/Characters/${linktext}.md`,
  } as unknown as CharacterNotes;
  const store = { read, note: held, files: () => [], hasFolder: () => true, makeFolder: vi.fn(), make: vi.fn(async (path: string) => fileAt(path)), change: vi.fn() };
  const notes = { store, keeping: { moveWithLinks: vi.fn(), throwAway: vi.fn() } };
  const editing: CharacterEditing = { showing: OBSIDIAN_SHOWING, notes, characters, spelling: STUB_SPELLING, syntax: STUB_SYNTAX };
  return { app, editing, read, fileAt };
}

