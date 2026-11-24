import type { NoteChanges, Stop } from "../../host/notes/note-changes";
import type { NoteFacts } from "../../host/notes/note-facts";
import type { NoteRef } from "../../host/notes/note-ref";
import type { CarriedGroup } from "./character-sheet";
import { HostCharacterNotes, type CharacterHost, type CharacterNotes, type CharacterNotesParts } from "./character-notes";
import { HeardPath } from "./heard-path";

export interface CarriedFrom {
  path: string;
  groups: CarriedGroup[];
}

export interface SheetNotes extends CharacterNotes {
  fileAt(path: string): NoteRef | null;
  carriedFromOf(file: NoteRef): CarriedFrom | null;
  onNoteMoved(moved: (path: string) => void): Stop;
}

export interface SheetHost extends CharacterHost {
  readonly facts: Pick<NoteFacts, "propertyLinksIn" | "propertiesOf">;
  readonly changes: Pick<NoteChanges, "onRead" | "onGone" | "onMoved">;
}

export interface SheetNotesParts extends CharacterNotesParts {
  readonly notes: SheetHost;
}

const CARRIED_FROM = "carried from";
const CARRIED_GROUPS: CarriedGroup[] = ["abilities", "values"];

export function carriedGroupsOf(listed: unknown): CarriedGroup[] {
  let names: unknown[] = [];
  if (Array.isArray(listed)) names = listed;
  else if (typeof listed === "string") names = [listed];
  return CARRIED_GROUPS.filter((group) => names.some((name) => typeof name === "string" && name.trim().toLowerCase() === group));
}

class BothStops {
  constructor(
    private readonly first: Stop,
    private readonly second: Stop,
  ) {}

  stop(): void {
    this.first();
    this.second();
  }
}

export class HostSheetNotes extends HostCharacterNotes implements SheetNotes {
  constructor(protected readonly sheetParts: SheetNotesParts) {
    super(sheetParts);
  }

  fileAt(path: string): NoteRef | null {
    return this.sheetParts.notes.store.note(path);
  }

  carriedFromOf(file: NoteRef): CarriedFrom | null {
    const held = this.heldOf(file);
    const { facts } = this.sheetParts.notes;
    const properties = facts.propertiesOf(held);
    if (properties === null) return null;
    const linkText = this.carriedFromLinkOf(held);
    if (linkText === null) return null;
    const path = this.pathOfLink(linkText, held.path);
    if (path === null || path === held.path) return null;
    return { path, groups: carriedGroupsOf(properties.carried) };
  }

  onNoteMoved(moved: (path: string) => void): Stop {
    const heard = new HeardPath(moved);
    const { changes } = this.sheetParts.notes;
    const both = new BothStops(changes.onGone(moved), changes.onMoved(heard.moved.bind(heard)));
    return both.stop.bind(both);
  }

  private carriedFromLinkOf(file: NoteRef): string | null {
    for (const link of this.sheetParts.notes.facts.propertyLinksIn(file)) {
      if (link.key === CARRIED_FROM) return link.linkText;
    }
    return null;
  }
}
