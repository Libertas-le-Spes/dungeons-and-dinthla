import type { Component } from "obsidian";
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

export interface AgreementShower {
  showAgreement(parentEl: HTMLElement): void;
}

export interface WelcomeEnding {
  fits(state: WelcomeState): boolean;
  new (endingEl: HTMLElement, actions: WelcomeActions, agreement: AgreementShower): Component;
}
