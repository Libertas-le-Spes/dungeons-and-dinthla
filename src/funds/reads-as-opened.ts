import { buildCampaign } from "../campaign/build-campaign";
import type { ItemRecord, SessionNote } from "../campaign/campaign";
import type { EditorFiles } from "../campaign/note-editor";
import { sessionNoteOf } from "../campaign/session-file";
import type { ItemSource } from "./item-source";

function sameItem(items: ItemRecord[], item: ItemRecord): boolean {
  const now = items.find((candidate) => candidate.name === item.name);
  return JSON.stringify(now) === JSON.stringify(item);
}

async function readAgain(files: EditorFiles, sessions: SessionNote[]): Promise<SessionNote[] | null> {
  const fresh: SessionNote[] = [];
  for (const session of sessions) {
    const file = files.getFileByPath(session.path);
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
