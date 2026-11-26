import { describe, expect, it, vi } from "vitest";
import { CampaignStore } from "../../src/campaign/reading/campaign-store";
import type { NoteChanges } from "../../src/host/notes/note-changes";
import { NoteKeeping } from "../../src/plugin/note-keeping";
import { SettingsSaver } from "../../src/settings/saved/settings-saver";
import { settingsOf } from "../../src/settings/saved/plugin-settings";
import { InMemoryNotes } from "../host/in-memory-notes";
import { RecordedTelling } from "../host/showing/recorded-telling";
import { STUB_SYNTAX } from "../host/stub-syntax";

const CHANGE_EVENTS = ["onMade", "onChanged", "onGone", "onMoved", "onFolderMoved", "onRead", "onLinksSettled"] as const;

class CountedChanges {
  listening = 0;

  constructor(private readonly notes: InMemoryNotes) {}

  changes(): NoteChanges {
    const counted: Record<string, unknown> = {};
    for (const event of CHANGE_EVENTS) counted[event] = this.counting.bind(this, event);
    return counted as unknown as NoteChanges;
  }

  private counting(event: (typeof CHANGE_EVENTS)[number], heard: never): () => void {
    this.listening += 1;
    const stop = (this.notes[event] as (heard: never) => () => void).call(this.notes, heard);
    return this.stopped.bind(this, stop);
  }

  private stopped(stop: () => void): void {
    this.listening -= 1;
    stop();
  }
}

function keepingWith(notes: InMemoryNotes, changes: NoteChanges, shown: CampaignStore, telling: RecordedTelling): NoteKeeping {
  const fenced = { store: notes, keeping: notes, changes, facts: notes, links: notes };
  const saver = new SettingsSaver(settingsOf({}, ".obsidian"), async () => {});
  return new NoteKeeping({ notes: fenced, syntax: STUB_SYNTAX, written: { listen: () => () => {} }, shown, saver, telling, dialogs: { open: vi.fn() }, campaignFolders: () => ["D&D/Pale Moon"] });
}

describe("NoteKeeping", () => {
  it("stops every note listener it started", () => {
    const notes = new InMemoryNotes();
    const counted = new CountedChanges(notes);
    const keeping = keepingWith(notes, counted.changes(), new CampaignStore(notes, STUB_SYNTAX), new RecordedTelling());
    keeping.start();
    expect(counted.listening).toBeGreaterThan(0);
    keeping.stop();
    expect(counted.listening).toBe(0);
  });

  it("says so when the saved session notes can't be read", async () => {
    const shownNotes = new InMemoryNotes();
    const savedNotes = new InMemoryNotes();
    for (const notes of [shownNotes, savedNotes]) {
      notes.put("D&D/Pale Moon/Pale Moon.md", "");
      notes.put("D&D/Pale Moon/Sessions/Session 1.md", "? Who");
    }
    vi.spyOn(savedNotes, "readKept").mockRejectedValue(new Error("The disk is gone."));
    const shown = new CampaignStore(shownNotes, STUB_SYNTAX);
    const telling = new RecordedTelling();
    keepingWith(savedNotes, savedNotes, shown, telling).start();
    await shown.open("D&D/Pale Moon");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(telling.said).toContain("Couldn't read the saved session notes: The disk is gone.");
  });
});
