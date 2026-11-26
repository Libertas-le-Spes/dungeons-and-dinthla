import type { Telling } from "../../host/showing/telling";
import { messageOf } from "../../views/dialogs/message-of";
import type { TextChange } from "../../views/elements/bindings/binding-wiring";
import { ChangeBinding, EnterBinding, HandleRequest, PressBinding } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button, Div } from "../../views/elements/kinds/containers";
import { TextInput } from "../../views/elements/kinds/fields";
import type { ViewElement } from "../../views/elements/view-element";

export interface NameFormWords {
  label: string;
  buttonText: string;
  buttonCls: string[];
  failed: string;
  make(name: string): Promise<void>;
}

export class NameForm implements TextChange {
  private readonly button = new KeptHandle();
  private name = "";
  private making = false;

  constructor(
    private readonly words: NameFormWords,
    private readonly telling: Pick<Telling, "say">,
  ) {}

  tree(): ViewElement {
    const make = new RunAction(this.startMaking.bind(this));
    return new Div({ cls: ["dd-welcome-make"] }, [
      new TextInput({ placeholder: this.words.label, label: this.words.label, bindings: [new ChangeBinding(this), new EnterBinding(false, make)] }),
      new Button({ cls: this.words.buttonCls, text: this.words.buttonText, bindings: [new PressBinding(make), new HandleRequest(this.button)] }),
    ]);
  }

  changed(value: string): void {
    this.name = value;
  }

  private startMaking(): void {
    if (this.making) return;
    this.makeWhileDisabled().catch(this.failed.bind(this));
  }

  private async makeWhileDisabled(): Promise<void> {
    this.making = true;
    this.button.setDisabled(true);
    try {
      await this.words.make(this.name);
    } finally {
      this.making = false;
      this.button.setDisabled(false);
    }
  }

  private failed(error: unknown): void {
    this.telling.say(`${this.words.failed}: ${messageOf(error)}`);
  }
}
