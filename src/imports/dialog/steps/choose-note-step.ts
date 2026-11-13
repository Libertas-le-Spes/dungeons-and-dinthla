import { ButtonComponent } from "obsidian";
import { CHOOSE_THE_NOTE } from "../import-words";
import type { ImportTarget } from "../targets/import-target";

export interface TargetChooser {
  targetChosen(target: ImportTarget): void;
}

class TargetPress {
  constructor(
    private readonly target: ImportTarget,
    private readonly chooser: TargetChooser,
  ) {}

  press(): void {
    this.chooser.targetChosen(this.target);
  }
}

export function drawChooseNote(parent: HTMLElement, targets: readonly ImportTarget[], chooser: TargetChooser): void {
  parent.createEl("p", { cls: "dd-import-question", text: CHOOSE_THE_NOTE });
  const choices = parent.createDiv({ cls: "dd-import-targets" });
  for (const target of targets) {
    const press = new TargetPress(target, chooser);
    const button = new ButtonComponent(choices).setButtonText(target.choiceWords).onClick(press.press.bind(press));
    button.buttonEl.addClass("dd-import-target");
  }
}
