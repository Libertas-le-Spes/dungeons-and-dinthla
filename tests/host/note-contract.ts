import { describe, expect, it } from "vitest";
import type { HostNotes } from "../../src/host/host";
import type { NoteRef } from "../../src/host/notes/note-ref";

export interface ContractHost {
  readonly notes: HostNotes;
  put(path: string, text: string): NoteRef;
}

export function noteContract(name: string, make: () => ContractHost): void {
  describe(`${name}, as a notes program the plugin can run in`, () => {
    it("finds a note by its path, with its name, and finds nothing at a path with no note", () => {
      const host = make();
      host.put("D&D/Pale Moon/Sessions/Session 1.md", "? Who");
      const note = host.notes.store.note("D&D/Pale Moon/Sessions/Session 1.md");
      expect([note?.path, note?.basename]).toEqual(["D&D/Pale Moon/Sessions/Session 1.md", "Session 1"]);
      expect(host.notes.store.note("D&D/Pale Moon/Sessions/Session 9.md")).toBeNull();
    });

    it("reads back what a change wrote, and returns that text", async () => {
      const host = make();
      const note = host.put("D&D/Pale Moon/Sessions/Session 1.md", "? Who");
      expect(await host.notes.store.change(note, (text) => `${text}\n! Find it`)).toBe("? Who\n! Find it");
      expect(await host.notes.store.read(note)).toBe("? Who\n! Find it");
    });

    it("keeps the same handle through a move, reading the new path", async () => {
      const host = make();
      const note = host.put("D&D/Pale Moon/Characters/Mira.md", "Mira");
      await host.notes.store.move(note, "D&D/Pale Moon/Fallen/Mira.md");
      expect(note.path).toBe("D&D/Pale Moon/Fallen/Mira.md");
      expect(host.notes.store.note("D&D/Pale Moon/Fallen/Mira.md")).toBe(note);
    });

    it("makes a note it can find again, and lists the notes under a folder", async () => {
      const host = make();
      await host.notes.store.make("D&D/Pale Moon/Items/Rope.md", "lines:");
      expect(host.notes.store.note("D&D/Pale Moon/Items/Rope.md")?.basename).toBe("Rope");
      expect(host.notes.store.notesUnder("D&D/Pale Moon/Items").map(pathOf)).toEqual(["D&D/Pale Moon/Items/Rope.md"]);
    });

    it("tells who listens that a note changed, moved or went, and stops telling once stopped", async () => {
      const host = make();
      const note = host.put("D&D/Pale Moon/Sessions/Session 1.md", "? Who");
      const heard: string[] = [];
      const stop = host.notes.changes.onChanged((changed) => void heard.push(`changed ${changed.path}`));
      host.notes.changes.onMoved((moved, oldPath) => void heard.push(`moved ${oldPath} to ${moved.path}`));
      host.notes.changes.onGone((path) => void heard.push(`gone ${path}`));
      await host.notes.store.change(note, (text) => text);
      stop();
      await host.notes.store.change(note, (text) => text);
      await host.notes.store.move(note, "D&D/Pale Moon/Sessions/Session 2.md");
      await host.notes.keeping.throwAway(note);
      expect(heard).toEqual(["changed D&D/Pale Moon/Sessions/Session 1.md", "moved D&D/Pale Moon/Sessions/Session 1.md to D&D/Pale Moon/Sessions/Session 2.md", "gone D&D/Pale Moon/Sessions/Session 2.md"]);
    });
  });
}

function pathOf(note: NoteRef): string {
  return note.path;
}
