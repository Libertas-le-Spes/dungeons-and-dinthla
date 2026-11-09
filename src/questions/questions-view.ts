import type { WorkspaceLeaf } from "obsidian";
import type { QuestionRecord } from "../campaign/campaign";
import type { CampaignStore } from "../campaign/campaign-store";
import type { LinkActions } from "../views/linked-text";
import { CampaignListView, type ListCreate } from "../views/list-view";
import { QUESTIONS_VIEW, questionsKind } from "./questions-kind";

export class QuestionsView extends CampaignListView<QuestionRecord> {
  constructor(leaf: WorkspaceLeaf, store: CampaignStore, actions: LinkActions, create: ListCreate | null) {
    super(leaf, store, actions, questionsKind, create);
  }

  getViewType(): string {
    return QUESTIONS_VIEW;
  }
}
