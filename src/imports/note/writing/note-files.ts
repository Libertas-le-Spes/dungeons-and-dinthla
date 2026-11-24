import type { NoteStore } from "../../../host/notes/note-store";

export type NoteFiles = Pick<NoteStore, "change" | "read" | "make" | "makeFolder" | "hasFolder" | "files">;
