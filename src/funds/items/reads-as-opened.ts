import { buildCampaign } from "../../campaign/reading/build-campaign";
import type { ItemRecord, SessionNote } from "../../campaign/record/campaign";
import type { EditorFiles } from "../../campaign/writing/note-editor";
import { sessionNoteOf } from "../../campaign/paths/session-file";
import type { ItemSource } from "./item-source";

function isSameHolding(candidate: ItemRecord, item: ItemRecord): boolean {
  if (candidate.name !== item.name) return false;
  return candidate.source.path === item.source.path && candidate.source.line === item.source.line;
}

function sameItem(items: ItemRecord[], item: ItemRecord): boolean {
  for (const candidate of items) {
    if (isSameHolding(candidate, item)) return JSON.stringify(candidate) === JSON.stringify(item);
  }
  return false;
}

async function readAgain(files: EditorFiles, sessions: SessionNote[]): Promise<SessionNote[] | null> {
  const fresh: SessionNote[] = [];
  for (const session of sessions) {
    const file = files.note(session.path);
    if (file === null) return null;
    fresh.push(sessionNoteOf(session.path, session.number, await files.read(file)));
  }
  return fresh;
}

export async function readsAsOpened(files: EditorFiles, store: ItemSource, sessions: SessionNote[], item: ItemRecord): Promise<boolean> {
  if (!sameItem(store.current.items, item)) return false;
  const fresh = await readAgain(files, sessions);
  if (fresh === null) return false;
  return sameItem(buildCampaign(fresh).items, item);
}
