import { CampaignStore } from "../campaign/reading/campaign-store";
import type { HeardWrites } from "../fence/notes/heard-writes";
import { FencedNotes } from "../fence/notes/fenced-notes";
import type { WriteReport } from "../fence/notes/write-report";
import { Fence } from "../fence/paths/fence";
import type { HostNotes } from "../host/host";
import type { Clock } from "../host/keeping/clock";
import type { DeviceStorage } from "../host/keeping/device-storage";
import type { PluginData } from "../host/keeping/plugin-data";
import type { NoteSyntax } from "../host/rules/note-syntax";
import type { PathSpelling } from "../host/rules/path-spelling";
import type { Telling } from "../host/showing/telling";
import { KeptAgreement } from "../imports/agreement/kept-agreement";
import type { Closing } from "../settings/drafts/flush-when-closing";
import type { Timer } from "../settings/drafts/local-drafts";
import type { Dialogs } from "../views/dialogs/dialog-view";
import { messageOf } from "../views/dialogs/message-of";
import { CampaignFollowing } from "./campaign-following";
import { NoteKeeping } from "./note-keeping";
import { PluginDrafts } from "./plugin-drafts";
import { SavedSettings } from "./saved-settings";

export interface PluginHost {
  readonly notes: HostNotes;
  readonly written: HeardWrites;
  readonly report: WriteReport;
  readonly spelling: PathSpelling;
  readonly syntax: NoteSyntax;
  readonly settingsFolder: string;
  readonly data: PluginData;
  readonly device: DeviceStorage;
  readonly clock: Clock;
  readonly timer: Timer;
  readonly closing: Closing;
  readonly telling: Telling;
  readonly dialogs: Dialogs;
}

export interface PluginShowing {
  activePath(): string | null;
  showBackgrounds(): void;
  showCampaignTabsAgain(): void;
}

export class StartedPlugin {
  readonly fence: Fence;
  readonly notes: FencedNotes;
  readonly store: CampaignStore;
  readonly saved: SavedSettings;
  readonly following: CampaignFollowing;
  readonly agreement: KeptAgreement;
  private drafts: PluginDrafts | null = null;
  private keeping: NoteKeeping | null = null;

  constructor(
    private readonly host: PluginHost,
    showing: PluginShowing,
  ) {
    this.fence = new Fence(this.campaignsFolderPath.bind(this), host.settingsFolder, host.spelling);
    this.notes = new FencedNotes(host.notes, this.fence, host.report);
    this.store = new CampaignStore(this.notes.store, host.syntax);
    this.saved = new SavedSettings({ data: host.data, device: host.device, settingsFolder: host.settingsFolder, telling: host.telling }, this.store, this.lookAgain.bind(this));
    this.following = new CampaignFollowing({
      notes: this.notes,
      store: this.store,
      saved: this.saved,
      telling: host.telling,
      activePath: showing.activePath,
      showBackgrounds: showing.showBackgrounds,
      showCampaignTabsAgain: showing.showCampaignTabsAgain,
    });
    this.agreement = new KeptAgreement({
      settings: { agreed: this.agreed.bind(this), keepAgreed: this.keepAgreed.bind(this) },
      device: host.device,
      notKept: this.agreementNotKept.bind(this),
    });
  }

  load(): Promise<void> {
    return this.saved.load();
  }

  keepDrafts(): PluginDrafts {
    const { device, timer, closing, clock, telling } = this.host;
    const drafts = new PluginDrafts({ device, timer, closing, clock, telling, changes: this.notes.changes, store: this.notes.store, fence: this.fence }, this.saved);
    drafts.start();
    this.drafts = drafts;
    return drafts;
  }

  async startCampaign(): Promise<void> {
    const keeping = new NoteKeeping({
      notes: this.notes,
      syntax: this.host.syntax,
      written: this.host.written,
      shown: this.store,
      saver: this.saved.saver,
      telling: this.host.telling,
      dialogs: this.host.dialogs,
      campaignFolders: this.following.campaignFolders.bind(this.following),
    });
    keeping.start();
    this.keeping = keeping;
    await this.following.start();
  }

  stop(): void {
    if (this.drafts !== null) this.drafts.stop();
    if (this.keeping !== null) this.keeping.stop();
    this.following.stop();
  }

  private campaignsFolderPath(): string | null {
    return this.saved.campaignsFolder.path;
  }

  private lookAgain(): Promise<void> {
    return this.following.lookAgain();
  }

  private agreed(): boolean {
    return this.saved.saver.settings.beyondAgreed;
  }

  private keepAgreed(): Promise<void> {
    return this.saved.saver.save({ beyondAgreed: true });
  }

  private agreementNotKept(error: unknown): void {
    this.host.telling.say(`Couldn't remember your answer about D&D Beyond: ${messageOf(error)}`);
  }
}

export function startPlugin(host: PluginHost, showing: PluginShowing): StartedPlugin {
  return new StartedPlugin(host, showing);
}
