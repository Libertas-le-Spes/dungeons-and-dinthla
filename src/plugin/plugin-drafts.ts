import type { Fence } from "../fence/paths/fence";
import type { Clock } from "../host/keeping/clock";
import type { DeviceStorage } from "../host/keeping/device-storage";
import type { NoteChanges } from "../host/notes/note-changes";
import type { NoteStore } from "../host/notes/note-store";
import type { Telling } from "../host/showing/telling";
import { Drafts } from "../session-notes/drafts/drafts";
import { DraftKeeping } from "../session-notes/kept/draft-keeping";
import { flushWhenClosing, type Closing } from "../settings/drafts/flush-when-closing";
import { LocalDrafts, type Timer } from "../settings/drafts/local-drafts";
import { messageOf } from "../views/dialogs/message-of";
import type { SavedSettings } from "./saved-settings";

export interface DraftsHost {
  readonly device: DeviceStorage;
  readonly timer: Timer;
  readonly closing: Closing;
  readonly clock: Clock;
  readonly telling: Pick<Telling, "say">;
  readonly changes: Pick<NoteChanges, "onMoved" | "onGone">;
  readonly store: Pick<NoteStore, "note">;
  readonly fence: Pick<Fence, "holds">;
}

export class PluginDrafts {
  readonly drafts: Drafts;
  readonly keeping: DraftKeeping;
  private readonly local: LocalDrafts;

  constructor(
    private readonly host: DraftsHost,
    private readonly saved: SavedSettings,
  ) {
    this.local = new LocalDrafts(host.device, host.timer, { written: saved.oldDraftsKept.bind(saved), failed: this.notKept.bind(this) });
    this.drafts = new Drafts(this.local.read(), this.draftsChanged.bind(this));
    this.keeping = new DraftKeeping(this.drafts, {
      changes: host.changes,
      store: host.store,
      fence: host.fence,
      campaignsFolder: this.campaignsFolder.bind(this),
      now: host.clock.now.bind(host.clock),
    });
  }

  start(): void {
    flushWhenClosing(this.local, this.host.closing);
    this.keeping.start();
    this.saved.moveOldDrafts(this.keeping.keptDrafts, this.local);
  }

  stop(): void {
    this.keeping.stop();
  }

  setAsideGoneNotes(): void {
    this.keeping.setAsideGoneNotes();
  }

  private draftsChanged(): void {
    this.local.changed(this.drafts.all());
  }

  private campaignsFolder(): string | null {
    return this.saved.campaignsFolder.path;
  }

  private notKept(error: unknown): void {
    this.host.telling.say(`Couldn't keep the text typed in the campaign tab: ${messageOf(error)}`);
  }
}
