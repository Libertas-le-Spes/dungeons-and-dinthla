import { REFERENCE_KIND_LIST } from "../../kinds/reference-kinds";
import type { ReferenceKind } from "../../kinds/reference-kind";
import type { Dialogs, DialogView, ShownDialog } from "../../views/dialogs/dialog-view";
import { HandleRequest, PressBinding } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button, FieldRow, Paragraph } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import type { UndecidedName } from "../making/reference-note-plan";
import type { NewNames } from "./new-names";
import type { AskNewNames, NewNamesChoice } from "./new-names-choice";
import { NEW_NAMES_EXPLAINED, NO_NOTE_MADE, chosenWords, newNamesTitle } from "./new-names-words";

const DIALOG_CLASSES = ["dd-new-names"];

class Choosing {
  constructor(
    private readonly row: NameRow,
    private readonly kind: ReferenceKind,
  ) {}

  chosen(): void {
    void this.row.choose(this.kind);
  }
}

class NameRow {
  private readonly buttons: KeptHandle[] = [];
  private readonly words = new KeptHandle();

  constructor(
    private readonly asking: NewNamesAsking,
    readonly undecided: UndecidedName,
  ) {}

  build(): FieldRow {
    const buttons: Button[] = [];
    for (const kind of REFERENCE_KIND_LIST) buttons.push(this.button(kind));
    return new FieldRow(this.undecided.name, null, buttons, {}, { bindings: [new HandleRequest(this.words)] });
  }

  async choose(kind: ReferenceKind): Promise<void> {
    for (const button of this.buttons) button.setDisabled(true);
    const made = await this.asking.chosen(this.undecided, kind);
    if (!made) {
      this.words.setText(NO_NOTE_MADE);
      return;
    }
    this.words.setText(chosenWords(kind.label));
    this.asking.answered();
  }

  private button(kind: ReferenceKind): Button {
    const kept = new KeptHandle();
    this.buttons.push(kept);
    const choosing = new Choosing(this, kind);
    return new Button({ text: kind.label, bindings: [new PressBinding(new RunAction(choosing.chosen.bind(choosing))), new HandleRequest(kept)] });
  }
}

export class NewNamesAsking implements ShownDialog {
  readonly title: string;
  readonly cls = DIALOG_CLASSES;
  private unanswered: number;
  private view: DialogView | null = null;

  constructor(
    private readonly asked: NewNames,
    private readonly to: NewNamesChoice,
  ) {
    this.title = newNamesTitle(asked.sessionName);
    this.unanswered = asked.names.length;
  }

  opened(view: DialogView): void {
    this.view = view;
    const trees: ViewElement[] = [new Paragraph({ cls: ["dd-new-names-words"], text: NEW_NAMES_EXPLAINED })];
    for (const undecided of this.asked.names) trees.push(new NameRow(this, undecided).build());
    view.show(trees);
  }

  mayClose(): boolean {
    return true;
  }

  closed(): void {
    this.to.closed();
  }

  async chosen(undecided: UndecidedName, kind: ReferenceKind): Promise<boolean> {
    const result = await this.to.chosen({ undecided, kind: kind.name });
    return result === "made";
  }

  answered(): void {
    this.unanswered -= 1;
    if (this.unanswered === 0 && this.view !== null) this.view.close();
  }
}

class NewNamesDialogs {
  constructor(private readonly dialogs: Dialogs) {}

  ask(names: NewNames, to: NewNamesChoice): void {
    this.dialogs.open(new NewNamesAsking(names, to));
  }
}

export function newNamesDialogIn(dialogs: Dialogs): AskNewNames {
  const asking = new NewNamesDialogs(dialogs);
  return asking.ask.bind(asking);
}
