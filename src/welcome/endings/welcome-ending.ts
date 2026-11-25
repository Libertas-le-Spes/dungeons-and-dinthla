import type { Telling } from "../../host/showing/telling";
import type { ViewElement } from "../../views/elements/view-element";

export interface WelcomeState {
  campaignsFolder: string | null;
  campaignFolder: string | null;
  sessionCount: number;
  agreementWanted: boolean;
}

export interface WelcomeActions {
  startSession(): void;
  showCampaign(): void;
  makeCampaign(name: string): Promise<void>;
  pickCampaignsFolder(): void;
  makeCampaignsFolder(name: string): Promise<void>;
}

export interface WelcomeAgreement {
  wanted(): boolean;
  trees(answered: () => void): ViewElement[];
}

export interface EndingNeeds {
  readonly actions: WelcomeActions;
  readonly agreement: WelcomeAgreement;
  readonly telling: Pick<Telling, "say">;
  answered(): void;
}

export interface EndingPart {
  trees(): ViewElement[];
}

export interface WelcomeEnding {
  fits(state: WelcomeState): boolean;
  new (needs: EndingNeeds): EndingPart;
}
