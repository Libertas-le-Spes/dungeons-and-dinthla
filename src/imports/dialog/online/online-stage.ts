import { Setting } from "obsidian";
import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { ONLINE_WENT_WRONG, wordsOf } from "../failure-words";
import { ASKING, BRING_IN_BUTTON, LINK_LABEL } from "../import-words";
import type { DialogShown } from "../stages/dialog-shown";
import type { PendingWork } from "../../../views/pending/pending-work";
import type { OnlineBlock } from "./online-block";
import type { OnlineSource } from "./online-source";

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

export class OnlineStage implements OnlineBlock {
  private typed = "";

  constructor(
    private readonly contentEl: HTMLElement,
    private readonly parts: OnlineParts,
  ) {}

  draw(parent: HTMLElement): void {
    new Setting(parent)
      .setName(LINK_LABEL)
      .addText((text) => {
        text.setValue(this.typed).onChange(this.typedChanged.bind(this));
        text.inputEl.focus();
      })
      .addButton((button) => button.setButtonText(BRING_IN_BUTTON).setCta().onClick(this.pressed.bind(this)));
  }

  typedChanged(value: string): void {
    this.typed = value;
  }

  bringInFrom(link: string): void {
    this.typed = link;
    this.pressed();
  }

  pressed(): void {
    this.contentEl.empty();
    this.contentEl.createEl("p", { cls: "dd-import-reading", text: ASKING, attr: { "aria-live": "polite" } });
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
