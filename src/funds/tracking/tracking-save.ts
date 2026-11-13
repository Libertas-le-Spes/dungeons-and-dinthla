import { writeInSession } from "../../campaign/changes/write-in-session";
import { OpenedSession } from "../../campaign/paths/session-gone";
import { sessionNoteOf } from "../../campaign/paths/session-file";
import type { SessionNote } from "../../campaign/record/campaign";
import { NoteEditor, type EditorFiles } from "../../campaign/writing/note-editor";
import type { RecordChange } from "../../campaign/changes/record-change";
import type { TrackSaving } from "./track-item-modal";
import type { TrackedItem } from "./tracked-item";
import { trackingChange, type TrackingSessions } from "./tracking-change";
import { refusalForTracking } from "./tracking-refusal";

function withLiveText(sessions: readonly SessionNote[], sessionPath: string, liveText: string): SessionNote[] {
  const live: SessionNote[] = [];
  for (const session of sessions) {
    if (session.path === sessionPath) live.push(sessionNoteOf(session.path, session.number, liveText));
    else live.push(session);
  }
  return live;
}

class LiveTrackingWriter {
  private readonly editor: NoteEditor;

  constructor(
    files: EditorFiles,
    private readonly store: TrackingSessions,
    private readonly tracked: TrackedItem,
    private readonly sessionPath: string,
  ) {
    this.editor = new NoteEditor(files);
  }

  async apply(): Promise<boolean> {
    return this.editor.appendShownChecked(this.sessionPath, [this.tracked.line], this.refusalFor.bind(this));
  }

  private refusalFor(liveText: string): string | null {
    return refusalForTracking(withLiveText(this.store.sessionNotes, this.sessionPath, liveText), this.tracked, this.sessionPath);
  }
}

export class TrackingSave implements TrackSaving {
  private readonly writer: LiveTrackingWriter;
  private readonly session: OpenedSession;

  constructor(
    files: EditorFiles,
    private readonly store: TrackingSessions,
    private readonly tracked: TrackedItem,
    private readonly sessionPath: string,
  ) {
    this.writer = new LiveTrackingWriter(files, store, tracked, sessionPath);
    this.session = new OpenedSession(files, sessionPath);
  }

  async save(): Promise<boolean> {
    return writeInSession(this.session, this.change.bind(this), this.writer);
  }

  private change(): RecordChange<TrackedItem> {
    return trackingChange(this.store, this.tracked, this.sessionPath);
  }
}
