import { ChangeBinding, HandleRequest, PressBinding } from "../../views/elements/bindings/bindings";
import type { TextChange } from "../../views/elements/bindings/binding-wiring";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button, Div, Heading2, Select } from "../../views/elements/kinds/containers";
import { Option } from "../../views/elements/kinds/fields";
import type { ViewElement } from "../../views/elements/view-element";
import type { SessionChoice } from "./session-choices";

export interface PickerMoves {
  showSession(path: string): void;
  startSession(): void;
}

function choicesKeyOf(choices: SessionChoice[]): string {
  return JSON.stringify(choices.map((choice) => [choice.path, choice.label]));
}

export class SessionPicker implements TextChange {
  private readonly title = new KeptHandle();
  private readonly select = new KeptHandle();
  private shownKey: string | null = null;

  constructor(private readonly moves: PickerMoves) {}

  tree(): ViewElement {
    return new Div({ cls: ["dd-head", "dd-notes-head"] }, [
      new Heading2({ cls: ["dd-title", "dd-notes-title"], bindings: [new HandleRequest(this.title)] }),
      new Select({ cls: ["dropdown", "dd-notes-select"], label: "Session", bindings: [new ChangeBinding(this), new HandleRequest(this.select)] }),
      new Button({ cls: ["dd-create"], text: "New session", bindings: [new PressBinding(new RunAction(this.startSession.bind(this)))] }),
    ]);
  }

  changed(value: string): void {
    this.moves.showSession(value);
  }

  show(heading: string, choices: SessionChoice[], shownPath: string | null): void {
    this.title.setText(heading);
    this.showChoices(choices);
    if (shownPath !== null) this.select.setValue(shownPath);
  }

  private startSession(): void {
    this.moves.startSession();
  }

  private showChoices(choices: SessionChoice[]): void {
    const key = choicesKeyOf(choices);
    if (key === this.shownKey) return;
    this.shownKey = key;
    const options: ViewElement[] = [];
    for (const choice of choices) options.push(new Option({ text: choice.label }, choice.path));
    this.select.showInside(options);
    this.select.setHidden(choices.length === 0);
  }
}
