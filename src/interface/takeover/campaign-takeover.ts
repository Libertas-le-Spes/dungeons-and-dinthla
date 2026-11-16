import type { ViewState } from "obsidian";
import { CAMPAIGN_ICON, CAMPAIGN_TITLE, CAMPAIGN_VIEW } from "../view/campaign-view";
import { pageOfFile } from "./opened-file-page";
import { RETIRED_SHEET_VIEW } from "./retired-views";

export type ShownViewState = ViewState & { icon?: string; title?: string };

export interface Takeover {
  campaignViewRegistered(): boolean;
  holds(path: string): boolean;
  campaignFolders(): string[];
  keptInEditor(leaf: object, path: string): boolean;
}

const EDITOR_TYPE = "markdown";

const TAKEN_TYPES = [EDITOR_TYPE, "bases", RETIRED_SHEET_VIEW];

function filePathIn(viewState: ShownViewState): string | null {
  if (!TAKEN_TYPES.includes(viewState.type)) return null;
  const state = viewState.state;
  if (state === undefined) return null;
  const file = state.file;
  if (typeof file !== "string") return null;
  return file;
}

function staysInEditor(viewState: ShownViewState, path: string, leaf: object, takeover: Takeover): boolean {
  if (viewState.type !== EDITOR_TYPE) return false;
  return takeover.keptInEditor(leaf, path);
}

export function campaignStateFor(viewState: ShownViewState, leaf: object, takeover: Takeover): ShownViewState {
  const path = filePathIn(viewState);
  if (path === null || !takeover.holds(path)) return viewState;
  if (!takeover.campaignViewRegistered()) return viewState;
  if (staysInEditor(viewState, path, leaf, takeover)) return viewState;
  const page = pageOfFile(path, takeover.campaignFolders());
  if (page === null) return viewState;
  return { ...viewState, type: CAMPAIGN_VIEW, state: { page, path }, icon: CAMPAIGN_ICON, title: CAMPAIGN_TITLE };
}
