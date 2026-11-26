import type { NoteRef } from "./note-ref";

export type Properties = Readonly<Record<string, unknown>>;

export interface LinkFact {
  readonly linkText: string;
  readonly line: number;
}

export interface PropertyLinkFact {
  readonly key: string;
  readonly linkText: string;
}

export interface NoteFacts {
  propertiesOf(note: NoteRef): Properties | null;
  linksIn(note: NoteRef): LinkFact[];
  embedsIn(note: NoteRef): LinkFact[];
  propertyLinksIn(note: NoteRef): PropertyLinkFact[];
}
