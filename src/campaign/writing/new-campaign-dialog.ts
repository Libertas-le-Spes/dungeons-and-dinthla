import type { Telling } from "../../host/showing/telling";
import { ButtonRow } from "../../views/components/dialogs/button-row";
import { MainButton, PlainButton } from "../../views/components/dialogs/dialog-buttons";
import { TextField } from "../../views/components/dialogs/text-field";
import type { DialogView, ShownDialog } from "../../views/dialogs/dialog-view";
import { messageOf } from "../../views/dialogs/message-of";
import type { TextChange } from "../../views/elements/bindings/binding-wiring";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import type { ViewElement } from "../../views/elements/view-element";

export const NEW_CAMPAIGN_TITLE = "New campaign";
export const NEW_CAMPAIGN_NAME = "Campaign name";
export const MAKE_THE_CAMPAIGN = "Make campaign";

const DIALOG_CLASSES = ["dd-new-campaign"];

export interface NewCampaignAnswers {
  make(name: string): Promise<boolean>;
  made(): void;
}

export class NewCampaignDialog implements ShownDialog, TextChange {
  readonly title = NEW_CAMPAIGN_TITLE;
  readonly cls = DIALOG_CLASSES;
  private name = "";
  private making = false;
  private madeOrNot: Promise<void> = Promise.resolve();
  private readonly nameHandle = new KeptHandle();
  private readonly makeButton = new KeptHandle();
  private view: DialogView | null = null;

  constructor(
    private readonly telling: Pick<Telling, "say">,
    private readonly answers: NewCampaignAnswers,
  ) {}

  opened(view: DialogView): void {
    this.view = view;
    view.show(this.trees());
    this.nameHandle.focus();
  }

  mayClose(): boolean {
    return true;
  }

  closed(): void {}

  changed(value: string): void {
    this.name = value;
  }

  settled(): Promise<void> {
    return this.madeOrNot;
  }

  private trees(): ViewElement[] {
    const make = new RunAction(this.makeTyped.bind(this));
    const words = { name: NEW_CAMPAIGN_NAME, label: NEW_CAMPAIGN_NAME, placeholder: "" };
    const buttons = [new MainButton(MAKE_THE_CAMPAIGN, make).build(this.makeButton), new PlainButton("Cancel", new RunAction(this.close.bind(this))).build()];
    return [new TextField(words, this, make).build("", this.nameHandle), new ButtonRow().build(buttons)];
  }

  private close(): void {
    if (this.view !== null) this.view.close();
  }

  private makeTyped(): void {
    if (this.making) return;
    this.madeOrNot = this.makeAndOpen(this.name).catch(this.sayFailure.bind(this));
  }

  private sayFailure(error: unknown): void {
    this.telling.say(`Couldn't make the campaign: ${messageOf(error)}`);
  }

  private async makeAndOpen(name: string): Promise<void> {
    this.making = true;
    this.makeButton.setDisabled(true);
    try {
      if (!(await this.answers.make(name))) return;
    } finally {
      this.making = false;
      this.makeButton.setDisabled(false);
    }
    this.close();
    this.answers.made();
  }
}
