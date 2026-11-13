import { SessionChangeWriter } from "../../campaign/changes/session-change-writer";
import { writeInSession } from "../../campaign/changes/write-in-session";
import { OpenedSession } from "../../campaign/paths/session-gone";
import type { EditorFiles } from "../../campaign/writing/note-editor";
import type { RecordChange } from "../../campaign/changes/record-change";
import type { TrackSaving } from "./track-item-modal";
import type { TrackedItem } from "./tracked-item";
import { trackingChange, type TrackingSessions } from "./tracking-change";

export class TrackingSave implements TrackSaving {
  private readonly writer: SessionChangeWriter;
  private readonly session: OpenedSession;

  constructor(
    files: EditorFiles,
    private readonly store: TrackingSessions,
    private readonly tracked: TrackedItem,
    private readonly sessionPath: string,
  ) {
    this.writer = new SessionChangeWriter(files);
    this.session = new OpenedSession(files, sessionPath);
  }

  async save(): Promise<boolean> {
    return writeInSession(this.session, this.change.bind(this), this.writer);
  }

  private change(): RecordChange<TrackedItem> {
    return trackingChange(this.store, this.tracked, this.sessionPath);
  }
}
