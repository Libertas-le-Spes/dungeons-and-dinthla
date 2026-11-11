import { CAMPAIGN_VIEW } from "../view/campaign-view";
import { mostRecentTab, type SeenTab } from "./most-recent-tab";
import type { SetStep } from "../takeover/view-state-patch";

export interface Opening {
  layoutReady: boolean;
  step: SetStep;
  typeNow: string;
}

export interface OtherCampaignTab<T> extends SeenTab<T> {
  pinned: boolean;
  sameWindow: boolean;
}

function isGoingBackOrForward(opening: Opening): boolean {
  const incoming: object = opening.step.incoming;
  return "popstate" in incoming && incoming.popstate === true;
}

function openedCampaignFile(opening: Opening): boolean {
  return opening.step.incoming.type !== CAMPAIGN_VIEW && opening.step.sent.type === CAMPAIGN_VIEW;
}

function becameCampaignTab(opening: Opening): boolean {
  return opening.step.typeBefore !== CAMPAIGN_VIEW && opening.typeNow === CAMPAIGN_VIEW;
}

function isNewSecondTab(opening: Opening): boolean {
  if (!opening.layoutReady || isGoingBackOrForward(opening)) return false;
  return openedCampaignFile(opening) && becameCampaignTab(opening);
}

function canTakeOver<T>(other: OtherCampaignTab<T>): boolean {
  return !other.pinned && other.sameWindow;
}

export function campaignTabToMoveInto<T>(opening: Opening, others: OtherCampaignTab<T>[]): T | null {
  if (!isNewSecondTab(opening)) return null;
  return mostRecentTab(others.filter(canTakeOver));
}
