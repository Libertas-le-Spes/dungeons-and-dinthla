import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { ReadCampaignsFolder } from "../../fence/paths/fence";
import type { Telling } from "../../host/showing/telling";
import type { EndingNeeds, WelcomeActions, WelcomeAgreement, WelcomeEnding, WelcomeState } from "../endings/welcome-ending";
import { endingFor } from "../endings/welcome-endings";
import { WELCOME_STEPS, WELCOME_TITLE } from "./welcome-steps";
import { HandleRequest } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { Div, Heading2, ListItem, OrderedList } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import type { PageView, ShownPage } from "../../views/pages/page-view";

export type WelcomeStore = Pick<CampaignStore, "campaignFolder" | "sessionNotes" | "subscribe">;

const PAGE_CLASSES = ["dd-root", "dd-list-view", "dd-welcome"];

export class WelcomePage implements ShownPage, EndingNeeds {
  readonly cls = PAGE_CLASSES;
  private readonly ending = new KeptHandle();
  private shownEnding: WelcomeEnding | null = null;
  private stop: (() => void) | null = null;

  constructor(
    private readonly store: WelcomeStore,
    private readonly readCampaignsFolder: ReadCampaignsFolder,
    readonly actions: WelcomeActions,
    readonly agreement: WelcomeAgreement,
    readonly telling: Pick<Telling, "say">,
  ) {}

  opened(view: PageView): void {
    const steps: ViewElement[] = [];
    for (const step of WELCOME_STEPS) steps.push(new ListItem({ text: step }));
    view.show([
      new Heading2({ cls: ["dd-welcome-title"], text: WELCOME_TITLE }),
      new OrderedList({ cls: ["dd-welcome-steps"] }, steps),
      new Div({ cls: ["dd-welcome-ending"], bindings: [new HandleRequest(this.ending)] }),
    ]);
    this.stop = this.store.subscribe(this.showEnding.bind(this));
    this.showEnding();
  }

  closed(): void {
    if (this.stop !== null) this.stop();
    this.stop = null;
  }

  answered(): void {
    this.showEnding();
  }

  private showEnding(): void {
    const ending = endingFor(this.state());
    if (ending === this.shownEnding) return;
    this.shownEnding = ending;
    this.ending.showInside(new ending(this).trees());
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
