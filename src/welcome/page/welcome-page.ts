import { Component } from "obsidian";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { ReadCampaignsFolder } from "../../fence/paths/fence";
import type { AgreementAnswered, AgreementShower, WelcomeActions, WelcomeAgreement, WelcomeEnding, WelcomeState } from "../endings/welcome-ending";
import { endingFor } from "../endings/welcome-endings";
import { WELCOME_STEPS, WELCOME_TITLE } from "./welcome-steps";

export type WelcomeStore = Pick<CampaignStore, "campaignFolder" | "sessionNotes" | "subscribe">;

export class WelcomePage extends Component implements AgreementShower, AgreementAnswered {
  private endingEl!: HTMLElement;
  private shownEnding: WelcomeEnding | null = null;
  private endingPart: Component | null = null;

  constructor(
    private readonly contentEl: HTMLElement,
    private readonly store: WelcomeStore,
    private readonly readCampaignsFolder: ReadCampaignsFolder,
    private readonly actions: WelcomeActions,
    private readonly agreement: WelcomeAgreement,
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

  showAgreement(parentEl: HTMLElement): void {
    this.agreement.showIn(parentEl, this);
  }

  agreementAnswered(): void {
    this.showEnding();
  }

  private showEnding(): void {
    const ending = endingFor(this.state());
    if (ending === this.shownEnding) return;
    this.shownEnding = ending;
    this.closeEnding();
    this.endingEl.empty();
    this.endingPart = this.addChild(new ending(this.endingEl, this.actions, this));
  }

  private closeEnding(): void {
    if (this.endingPart === null) return;
    this.removeChild(this.endingPart);
    this.endingPart = null;
  }

  private state(): WelcomeState {
    return {
      campaignsFolder: this.readCampaignsFolder(),
      campaignFolder: this.store.campaignFolder,
      sessionCount: this.store.sessionNotes.length,
      agreementWanted: this.agreement.wanted(),
    };
  }
}
