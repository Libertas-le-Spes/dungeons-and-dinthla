import type { Component } from "obsidian";

export interface WelcomeState {
  campaignFolder: string | null;
  sessionCount: number;
}

export interface WelcomeActions {
  startSession(): void;
  showCampaign(): void;
  makeCampaign(name: string): Promise<void>;
}

export interface WelcomeEnding {
  fits(state: WelcomeState): boolean;
  addTo(endingEl: HTMLElement, actions: WelcomeActions, owner: Component): void;
}
