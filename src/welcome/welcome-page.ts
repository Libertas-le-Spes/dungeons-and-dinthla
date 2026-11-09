import { Component } from "obsidian";
import type { CampaignStore } from "../campaign/campaign-store";
import type { WelcomeActions, WelcomeEnding, WelcomeState } from "./welcome-ending";
import { endingFor } from "./welcome-endings";
import { WELCOME_STEPS, WELCOME_TITLE } from "./welcome-steps";

export type WelcomeStore = Pick<CampaignStore, "campaignFolder" | "sessionNotes" | "subscribe">;

export class WelcomePage extends Component {
  private endingEl!: HTMLElement;
  private shownEnding: WelcomeEnding | null = null;

  constructor(
    private readonly contentEl: HTMLElement,
    private readonly store: WelcomeStore,
    private readonly actions: WelcomeActions,
  ) {
    super();
  }

  override onload(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass("dd-tokens", "dd-root", "dd-list-view", "dd-welcome");
    root.createEl("h2", { cls: "dd-welcome-title", text: WELCOME_TITLE });
    const steps = root.createEl("ol", { cls: "dd-welcome-steps" });
    for (const step of WELCOME_STEPS) steps.createEl("li", { text: step });
    this.endingEl = root.createDiv({ cls: "dd-welcome-ending" });
    this.register(this.store.subscribe(() => this.showEnding()));
    this.showEnding();
  }

  private showEnding(): void {
    const ending = endingFor(this.state());
    if (ending === this.shownEnding) return;
    this.shownEnding = ending;
    this.endingEl.empty();
    ending.addTo(this.endingEl, this.actions, this);
  }

  private state(): WelcomeState {
    return { campaignFolder: this.store.campaignFolder, sessionCount: this.store.sessionNotes.length };
  }
}
