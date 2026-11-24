import { InMemoryNotes } from "./in-memory-notes";
import { noteContract } from "./note-contract";

function memoryHost() {
  const notes = new InMemoryNotes();
  return { notes, put: notes.put.bind(notes) };
}

noteContract("The in-memory host", memoryHost);
