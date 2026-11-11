import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import { Fence } from "../../../src/fence/paths/fence";
import { Drafts } from "../../../src/session-notes/drafts/drafts";
import { DraftKeeping } from "../../../src/session-notes/kept/draft-keeping";
import { DELETED, MISSING } from "../../../src/session-notes/kept/kinds/kept-kinds";
import { FakeEvents, fileAt } from "../../fence/gate/fake-raw-vault";

const FOLDER = "D&D";
const ONE = "D&D/Pale Moon/Sessions/Session 1.md";
const TWO = "D&D/Pale Moon/Sessions/Session 2.md";
const OUTSIDE = "Games/Pale Moon/Sessions/Session 1.md";
const NOTE_KEY = "note:D&D/Pale Moon/Characters/Mira.md";
const AT = 1_000;

function keepingWith(kept: Record<string, string>, notes: string[]) {
  const events = new FakeEvents();
  const files = {
    on: vi.fn((name: string, callback: (...data: never[]) => unknown) => events.on(name, callback as (...data: unknown[]) => unknown)),
    offref: vi.fn(),
    getFileByPath: vi.fn((path: string): TFile | null => {
      if (!notes.includes(path)) return null;
      return fileAt(path);
    }),
  };
  const fence = new Fence(() => FOLDER, ".obsidian");
  const drafts = new Drafts(kept, () => {});
  const keeping = new DraftKeeping(drafts, { files, fence, campaignsFolder: () => FOLDER, now: () => AT });
  keeping.load();
  return { keeping, drafts, events, files };
}

function keptOf(keeping: DraftKeeping): unknown[][] {
  return keeping.keptDrafts.kept().map((draft) => [draft.kind, draft.path, draft.text]);
}

describe("DraftKeeping", () => {
  it("sets aside the lines of a session note inside the Campaigns folder that is gone", () => {
    const { keeping, drafts } = keepingWith({ [ONE]: "? Who" }, []);
    keeping.setAsideGoneNotes();
    expect(drafts.textOf(ONE)).toBe("");
    expect(keptOf(keeping)).toEqual([[MISSING, ONE, "? Who"]]);
  });

  it("keeps the lines of a session note the fence finds", () => {
    const { keeping, drafts } = keepingWith({ [ONE]: "? Who" }, [ONE]);
    keeping.setAsideGoneNotes();
    expect(drafts.textOf(ONE)).toBe("? Who");
    expect(keptOf(keeping)).toEqual([]);
  });

  it("keeps the lines of a note outside the Campaigns folder live, so changing the folder sets nothing aside", () => {
    const { keeping, drafts, files } = keepingWith({ [OUTSIDE]: "? Who" }, []);
    keeping.setAsideGoneNotes();
    expect(drafts.textOf(OUTSIDE)).toBe("? Who");
    expect(keptOf(keeping)).toEqual([]);
    expect(files.getFileByPath).not.toHaveBeenCalled();
  });

  it("keeps a whole-note draft live without looking its note up", () => {
    const { keeping, drafts, files } = keepingWith({ [NOTE_KEY]: '{"base":"","text":"Mira"}' }, []);
    keeping.setAsideGoneNotes();
    expect(drafts.textOf(NOTE_KEY)).toBe('{"base":"","text":"Mira"}');
    expect(files.getFileByPath).not.toHaveBeenCalled();
  });

  it("moves a session note's lines with the note when it is renamed", () => {
    const { drafts, events } = keepingWith({ [ONE]: "? Who" }, [ONE]);
    events.trigger("rename", fileAt(TWO), ONE);
    expect(drafts.textOf(TWO)).toBe("? Who");
    expect(drafts.textOf(ONE)).toBe("");
  });

  it("moves a whole-note draft with its note when it is renamed", () => {
    const { drafts, events } = keepingWith({ [NOTE_KEY]: '{"base":"","text":"Mira"}' }, []);
    events.trigger("rename", fileAt("D&D/Pale Moon/Characters/Mira Vale.md"), "D&D/Pale Moon/Characters/Mira.md");
    expect(drafts.textOf("note:D&D/Pale Moon/Characters/Mira Vale.md")).toBe('{"base":"","text":"Mira"}');
  });

  it("sets aside a session note's lines when the note is deleted", () => {
    const { keeping, events } = keepingWith({ [ONE]: "? Who" }, [ONE]);
    events.trigger("delete", { path: ONE });
    expect(keptOf(keeping)).toEqual([[DELETED, ONE, "? Who"]]);
  });

  it("stops listening to the fenced files once unloaded", () => {
    const { keeping, files } = keepingWith({}, []);
    keeping.unload();
    expect(files.offref).toHaveBeenCalledTimes(3);
  });
});
