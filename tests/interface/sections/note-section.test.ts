import { describe, expect, it, vi } from "vitest";
import { noteSection } from "../../../src/interface/sections/note-section";
import { NoNotePage } from "../../../src/note-page/no-note-page";
import { NoteDrafts } from "../../../src/note-editing/note-drafts";
import { NotePage } from "../../../src/note-page/note-page";
import type { NoteSaver } from "../../../src/note-editing/note-saver";
import { Drafts } from "../../../src/session-notes/drafts/drafts";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import type { PageFrame } from "../../../src/obsidian/views/frames/page-frame";
import { AT_ONCE_PAUSES } from "../../host/made-up-pauses";
import { fakeMentionNotes, NO_MENTIONS } from "../../note-page/fake-mention-notes";

function made(path: string | null) {
  const texts = { read: vi.fn(async () => "The wheel turns."), onChanged: () => () => {}, onGone: () => () => {} };
  const needs = { texts, drafts: new NoteDrafts(new Drafts({}, () => {})), saver: {} as NoteSaver, actions: { openRow: vi.fn(), openLink: vi.fn() }, mentionNotes: fakeMentionNotes(NO_MENTIONS).notes, pauses: AT_ONCE_PAUSES, isCampaignNote: () => true, openInEditor: vi.fn() };
  const root = obsidianDocument().createElement("div");
  const page = noteSection(needs)(root, vi.fn(), path, vi.fn());
  page.load();
  return { page, root, texts };
}

describe("noteSection", () => {
  it("makes the note page for the note the tab shows", async () => {
    const { page, root, texts } = made("Pale Moon/Places/Old Mill.md");
    expect((page as PageFrame).page).toBeInstanceOf(NotePage);
    expect(root.querySelector("h2")!.textContent).toBe("Old Mill");
    expect(texts.read).toHaveBeenCalledExactlyOnceWith("Pale Moon/Places/Old Mill.md");
  });

  it("says to open a note when the tab shows none", () => {
    const { page, root, texts } = made(null);
    expect((page as PageFrame).page).toBeInstanceOf(NoNotePage);
    expect(root.querySelector(".dd-empty")?.textContent).toBe("No note open.");
    expect(texts.read).not.toHaveBeenCalled();
  });
});
