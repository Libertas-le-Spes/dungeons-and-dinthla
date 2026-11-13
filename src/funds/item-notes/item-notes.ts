import type { Campaign, SessionNote } from "../../campaign/record/campaign";
import { itemsFolderOf } from "../../campaign/paths/campaign-folders";
import type { FencedFileActions } from "../../fence/gate/fenced-file-actions";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import type { FencedMetadata } from "../../fence/gate/fenced-metadata";
import type { MakeTally } from "../../note-keeping/make-result";
import type { MakerFiles } from "../../note-keeping/new-note-maker";
import { SaidOnce } from "../../note-keeping/said-once";
import { ItemHolderKeeper } from "./item-holder-keeper";
import { ItemNoteBusy } from "./item-note-busy";
import { ItemNoteMaker } from "./item-note-maker";
import { planItemNotes, type ItemNotePlan } from "./item-note-plan";

export interface ItemNotesStore {
  readonly current: Campaign;
  readonly campaignFolder: string | null;
  readonly opening: boolean;
  readonly sessionNotes: SessionNote[];
  subscribe(listener: (campaign: Campaign) => void): () => void;
}

export interface ItemNotesNeeds {
  store: ItemNotesStore;
  files: Pick<FencedFiles, "markdownFilesUnder"> & MakerFiles;
  metadata: Pick<FencedMetadata, "getFileCache">;
  actions: Pick<FencedFileActions, "processFrontMatter" | "trashFile">;
  failed(error: unknown): void;
  say(message: string): void;
}

export class ItemNotes {
  private readonly said: SaidOnce;
  private readonly keeper: ItemHolderKeeper;
  private readonly maker: ItemNoteMaker;

  constructor(private readonly needs: ItemNotesNeeds) {
    const busy = new ItemNoteBusy();
    this.said = new SaidOnce(needs.say);
    this.keeper = new ItemHolderKeeper({ ...needs, campaignFolder: () => needs.store.campaignFolder, busy });
    this.maker = new ItemNoteMaker({ files: needs.files, actions: needs.actions, busy, failed: needs.failed });
  }

  start(): () => void {
    this.keeper.campaignRead(this.needs.store.current);
    return this.needs.store.subscribe((campaign) => this.keeper.campaignRead(campaign));
  }

  sessionSaved(): void {
    const plan = this.plan();
    if (plan === null) return;
    this.tellRefusals(plan);
    for (const note of plan.notes) {
      if (note.file !== null) this.keeper.noteSaved(note, note.file);
      else void this.maker.make(note);
    }
  }

  async makeMissing(): Promise<MakeTally> {
    const tally: MakeTally = { made: 0, failed: 0 };
    const plan = this.plan();
    if (plan === null) return tally;
    this.tellRefusals(plan);
    for (const note of plan.notes) {
      const result = await this.maker.make(note);
      if (result === "made") tally.made += 1;
      if (result === "failed") tally.failed += 1;
    }
    return tally;
  }

  private tellRefusals(plan: ItemNotePlan): void {
    for (const message of plan.refusals) this.said.say(message, message);
  }

  private plan(): ItemNotePlan | null {
    const { store, files } = this.needs;
    const folder = store.campaignFolder;
    if (folder === null || store.opening) return null;
    const itemsFolder = itemsFolderOf(folder);
    return planItemNotes(store.current, store.sessionNotes, itemsFolder, files.markdownFilesUnder(itemsFolder));
  }
}
