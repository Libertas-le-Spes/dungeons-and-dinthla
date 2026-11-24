import type { NoteFacts, Properties } from "../host/notes/note-facts";
import type { NoteStore } from "../host/notes/note-store";

export interface SessionProperties {
  title: string;
  played: string;
}

export interface SessionPropertyNotes {
  readonly store: Pick<NoteStore, "note">;
  readonly facts: Pick<NoteFacts, "propertiesOf">;
}

function textOf(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function propertiesIn(path: string, notes: SessionPropertyNotes): Properties {
  const note = notes.store.note(path);
  if (note === null) return {};
  const properties = notes.facts.propertiesOf(note);
  if (properties === null) return {};
  return properties;
}

export function sessionPropertiesOf(path: string, notes: SessionPropertyNotes): SessionProperties {
  const properties = propertiesIn(path, notes);
  return { title: textOf(properties.title), played: textOf(properties.played) };
}
