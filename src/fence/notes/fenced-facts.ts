import type { LinkFact, NoteFacts, Properties, PropertyLinkFact } from "../../host/notes/note-facts";
import type { NoteRef } from "../../host/notes/note-ref";
import type { HandedNotes } from "./handed-notes";

export class FencedFacts implements NoteFacts {
  constructor(
    private readonly raw: NoteFacts,
    private readonly handed: HandedNotes,
  ) {}

  propertiesOf(note: NoteRef): Properties | null {
    return this.raw.propertiesOf(this.handed.held(note));
  }

  linksIn(note: NoteRef): LinkFact[] {
    return this.raw.linksIn(this.handed.held(note));
  }

  embedsIn(note: NoteRef): LinkFact[] {
    return this.raw.embedsIn(this.handed.held(note));
  }

  propertyLinksIn(note: NoteRef): PropertyLinkFact[] {
    return this.raw.propertyLinksIn(this.handed.held(note));
  }
}
