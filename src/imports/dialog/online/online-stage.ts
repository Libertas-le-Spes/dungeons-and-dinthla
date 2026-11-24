import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { ONLINE_WENT_WRONG, wordsOf } from "../failure-words";
import { ASKING, BRING_IN_BUTTON, LINK_LABEL } from "../import-words";
import type { DialogShown } from "../stages/dialog-shown";
import type { PendingWork } from "../../../views/pending/pending-work";
import type { OnlineBlock } from "./online-block";
import type { OnlineSource } from "./online-source";
import type { StageScreen } from "../stages/stage-screen";
import { MainButton } from "../../../views/components/dialogs/dialog-buttons";
import type { TextChange } from "../../../views/elements/bindings/binding-wiring";
import { ChangeBinding, HandleRequest } from "../../../views/elements/bindings/bindings";
import { KeptHandle } from "../../../views/elements/bindings/kept-handle";
import { RunAction } from "../../../views/elements/bindings/run-action";
import { FieldRow, Paragraph } from "../../../views/elements/kinds/containers";
import { TextInput } from "../../../views/elements/kinds/fields";
import type { ViewElement } from "../../../views/elements/view-element";

export interface OnlineArrival {
  sheetRead(sheet: PrintedSheet): void;
  onlineRefused(words: string): void;
}

export interface OnlineParts {
  readonly shown: DialogShown;
  readonly arrival: OnlineArrival;
  readonly source: OnlineSource;
  readonly work: PendingWork;
}

export class OnlineStage implements OnlineBlock, TextChange {
  private typed = "";
  private readonly link = new KeptHandle();

  constructor(
    private readonly screen: StageScreen,
    private readonly parts: OnlineParts,
  ) {}

  tree(): ViewElement {
    const input = new TextInput({ value: this.typed, label: LINK_LABEL, bindings: [new ChangeBinding(this), new HandleRequest(this.link)] });
    const bringIn = new MainButton(BRING_IN_BUTTON, new RunAction(this.pressed.bind(this))).build();
    return new FieldRow(LINK_LABEL, null, [input, bringIn]);
  }

  focus(): void {
    this.link.focus();
  }

  changed(value: string): void {
    this.typed = value;
  }

  bringInFrom(link: string): void {
    this.typed = link;
    this.pressed();
  }

  pressed(): void {
    this.screen.show([new Paragraph({ cls: ["dd-import-reading"], text: ASKING, live: "polite" })]);
    this.parts.work.add(this.bringIn());
  }

  private async bringIn(): Promise<void> {
    let sheet: PrintedSheet;
    try {
      sheet = await this.parts.source.sheetFor(this.typed);
    } catch (error) {
      if (this.parts.shown.isShown) this.parts.arrival.onlineRefused(wordsOf(error, ONLINE_WENT_WRONG));
      return;
    }
    if (this.parts.shown.isShown) this.parts.arrival.sheetRead(sheet);
  }
}
