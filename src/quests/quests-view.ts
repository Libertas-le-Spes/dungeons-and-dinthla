import type { WorkspaceLeaf } from "obsidian";
import type { QuestRecord } from "../campaign/campaign";
import type { CampaignStore } from "../campaign/campaign-store";
import type { LinkActions } from "../views/linked-text";
import { CampaignListView, type ListCreate } from "../views/list-view";
import { QUESTS_VIEW, questsKind } from "./quests-kind";

export class QuestsView extends CampaignListView<QuestRecord> {
  constructor(leaf: WorkspaceLeaf, store: CampaignStore, actions: LinkActions, create: ListCreate | null) {
    super(leaf, store, actions, questsKind, create);
  }

  getViewType(): string {
    return QUESTS_VIEW;
  }
}
