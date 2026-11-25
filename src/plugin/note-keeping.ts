import type { CampaignStore } from "../campaign/reading/campaign-store";
import { SavedCampaign } from "../campaign/reading/saved-campaign";
import type { HeardWrites } from "../fence/notes/heard-writes";
import type { HostNotes } from "../host/host";
import type { NoteSyntax } from "../host/rules/note-syntax";
import type { Telling } from "../host/showing/telling";
import { ItemNotes } from "../funds/item-notes/item-notes";
import { startKindNotes } from "../kind-notes/watching/kind-notes-wiring";
import { DmNameQuestions } from "../references/asking/dm-name-questions";
import { RoleRoutedNotes } from "../references/asking/role-routed-notes";
import { ReferenceNotes } from "../references/making/reference-notes";
import { newNamesDialogIn } from "../references/new-names/new-names-dialog";
import { NotesMade } from "../settings/saved/notes-made";
import type { SettingsSaver } from "../settings/saved/settings-saver";
import { askInNoticeOf } from "../views/dialogs/differing-notice";
import type { Dialogs } from "../views/dialogs/dialog-view";
import { messageOf } from "../views/dialogs/message-of";

export interface NoteKeepingNeeds {
  readonly notes: HostNotes;
  readonly syntax: NoteSyntax;
  readonly written: HeardWrites;
  readonly shown: CampaignStore;
  readonly saver: SettingsSaver;
  readonly telling: Telling;
  readonly dialogs: Dialogs;
  campaignFolders(): string[];
}

export class NoteKeeping {
  private readonly stops: (() => void)[] = [];

  constructor(private readonly needs: NoteKeepingNeeds) {}

  start(): void {
    const { notes, syntax, telling, dialogs } = this.needs;
    const saved = new SavedCampaign({ shown: this.needs.shown, notes, failed: this.notRead.bind(this) }, syntax);
    const say = telling.sayUntilDismissed.bind(telling);
    const items = new ItemNotes({ store: saved, notes, syntax, failed: this.itemNotWritten.bind(this), say });
    const references = new ReferenceNotes({ store: saved, notes, syntax, say, askNewNames: newNamesDialogIn(dialogs) });
    const dmQuestions = new DmNameQuestions({ store: saved, notes, syntax, campaignFolders: this.needs.campaignFolders, say, askNewNames: newNamesDialogIn(dialogs) });
    const routed = new RoleRoutedNotes({ store: saved, notes, forDm: dmQuestions, forOthers: references });
    this.stops.push(items.start(), references.start(), dmQuestions.start());
    this.stops.push(startKindNotes({ notes, syntax, written: this.needs.written, saved, made: new NotesMade(this.needs.saver), items, references: routed, say, ask: askInNoticeOf(telling) }));
    this.stops.push(saved.start());
  }

  stop(): void {
    for (const stop of this.stops) stop();
    this.stops.length = 0;
  }

  private notRead(error: unknown): void {
    this.needs.telling.say(`Couldn't read the saved session notes: ${messageOf(error)}`);
  }

  private itemNotWritten(error: unknown): void {
    this.needs.telling.say(`Couldn't write an item's note: ${messageOf(error)}`);
  }
}
