import type { Component } from "obsidian";

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
  showIn(parentEl: HTMLElement, answered: () => void): void;
}

export interface AgreementShower {
  showAgreement(parentEl: HTMLElement): void;
}

export interface WelcomeEnding {
  fits(state: WelcomeState): boolean;
  new (endingEl: HTMLElement, actions: WelcomeActions, agreement: AgreementShower): Component;
}
