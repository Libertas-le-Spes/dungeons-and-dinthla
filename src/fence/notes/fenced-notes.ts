import type { HostNotes } from "../../host/host";
import type { LinkLookup } from "../../host/notes/link-lookup";
import type { NoteChanges } from "../../host/notes/note-changes";
import type { NoteFacts } from "../../host/notes/note-facts";
import type { NoteKeeping } from "../../host/notes/note-keeping";
import type { NoteStore } from "../../host/notes/note-store";
import type { Fence } from "../paths/fence";
import { FencedChanges } from "./fenced-changes";
import { FencedFacts } from "./fenced-facts";
import { FencedKeeping } from "./fenced-keeping";
import { FencedLinks } from "./fenced-links";
import { FencedStore } from "./fenced-store";
import { HandedNotes } from "./handed-notes";
import type { WriteReport } from "./write-report";

export class FencedNotes implements HostNotes {
  readonly store: NoteStore;
  readonly keeping: NoteKeeping;
  readonly changes: NoteChanges;
  readonly facts: NoteFacts;
  readonly links: LinkLookup;

  constructor(raw: HostNotes, fence: Fence, report: WriteReport) {
    const handed = new HandedNotes(fence);
    this.store = new FencedStore(raw.store, handed, report);
    this.keeping = new FencedKeeping(raw.keeping, handed, report);
    this.changes = new FencedChanges(raw.changes, handed);
    this.facts = new FencedFacts(raw.facts, handed);
    this.links = new FencedLinks(raw.links, handed);
  }
}
