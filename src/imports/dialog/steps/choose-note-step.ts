import { CHOOSE_THE_NOTE } from "../import-words";
import type { ImportTarget } from "../targets/import-target";
import { PressBinding } from "../../../views/elements/bindings/bindings";
import { RunAction } from "../../../views/elements/bindings/run-action";
import { Button, Div, Paragraph } from "../../../views/elements/kinds/containers";
import type { ViewElement } from "../../../views/elements/view-element";

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

function targetButton(target: ImportTarget, chooser: TargetChooser): ViewElement {
  const press = new TargetPress(target, chooser);
  return new Button({ cls: ["dd-import-target"], text: target.choiceWords, bindings: [new PressBinding(new RunAction(press.press.bind(press)))] });
}

export function chooseNoteTrees(targets: readonly ImportTarget[], chooser: TargetChooser): ViewElement[] {
  const buttons: ViewElement[] = [];
  for (const target of targets) buttons.push(targetButton(target, chooser));
  return [new Paragraph({ cls: ["dd-import-question"], text: CHOOSE_THE_NOTE }), new Div({ cls: ["dd-import-targets"] }, buttons)];
}
