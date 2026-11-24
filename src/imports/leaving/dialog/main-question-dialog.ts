import type { Telling } from "../../../host/showing/telling";
import { ButtonRow } from "../../../views/components/dialogs/button-row";
import { PlainButton } from "../../../views/components/dialogs/dialog-buttons";
import { TextField } from "../../../views/components/dialogs/text-field";
import type { DialogView, ShownDialog } from "../../../views/dialogs/dialog-view";
import { RecordChanging } from "../../../views/dialogs/record-changing";
import type { TextChange } from "../../../views/elements/bindings/binding-wiring";
import { RunAction } from "../../../views/elements/bindings/run-action";
import { Paragraph } from "../../../views/elements/kinds/containers";
import type { ViewElement } from "../../../views/elements/view-element";
import type { SwitchChoice } from "../choices/switch-choice";
import { LAST_DOING_HINT, LAST_DOING_LABEL, NOT_NOW, OWN_WORDS_HINT, OWN_WORDS_LABEL, SWITCH_FAILED, type MainQuestion } from "../questions/main-question";
import type { OwnWords } from "../reasons/own-words";

const DIALOG_CLASSES = ["dd-dialog"];
const OWN_WORDS = { name: OWN_WORDS_LABEL, label: OWN_WORDS_LABEL, placeholder: "" };
const LAST_DOING = { name: LAST_DOING_LABEL, label: LAST_DOING_LABEL, placeholder: "" };

function stayOpen(): void {
  return;
}

class OwnWordsChange implements TextChange {
  constructor(private readonly ownWords: OwnWords) {}

  changed(value: string): void {
    this.ownWords.keep(value);
  }
}

class LastDoingChange implements TextChange {
  constructor(private readonly dialog: MainQuestionDialog) {}

  changed(value: string): void {
    this.dialog.keepLastDoing(value);
  }
}

class ChoicePress {
  constructor(
    private readonly dialog: MainQuestionDialog,
    private readonly choice: SwitchChoice,
  ) {}

  press(): void {
    this.dialog.choose(this.choice);
  }
}

export class MainQuestionDialog implements ShownDialog {
  readonly title: string;
  readonly cls = DIALOG_CLASSES;
  private readonly changing: RecordChanging;
  private lastDoing = "";

  constructor(
    telling: Pick<Telling, "say">,
    private readonly question: MainQuestion,
    onClosed: (changed: boolean) => void,
  ) {
    this.title = question.title;
    this.changing = new RecordChanging(telling, onClosed);
  }

  opened(view: DialogView): void {
    this.changing.opened(view);
    view.show(this.trees());
  }

  mayClose(): boolean {
    return this.changing.mayClose();
  }

  closed(): void {
    this.changing.closed();
  }

  settled(): Promise<void> {
    return this.changing.settled();
  }

  choose(choice: SwitchChoice): void {
    this.changing.run(choice.run.bind(choice, this.lastDoing), SWITCH_FAILED);
  }

  keepLastDoing(value: string): void {
    this.lastDoing = value;
  }

  private trees(): ViewElement[] {
    const trees: ViewElement[] = [new Paragraph({ cls: ["dd-subject"], text: this.question.question })];
    const stay = new RunAction(stayOpen);
    const ownWords = this.question.ownWords;
    if (ownWords !== null) trees.push(new TextField(OWN_WORDS, new OwnWordsChange(ownWords), stay).described("", OWN_WORDS_HINT, null));
    if (this.question.asksLastDoing) trees.push(new TextField(LAST_DOING, new LastDoingChange(this), stay).described("", LAST_DOING_HINT, null));
    trees.push(new ButtonRow().build(this.buttons()));
    return trees;
  }

  private buttons(): ViewElement[] {
    const buttons: ViewElement[] = [];
    for (const choice of this.question.choices) {
      const press = new ChoicePress(this, choice);
      buttons.push(new PlainButton(choice.words, new RunAction(press.press.bind(press))).build());
    }
    buttons.push(new PlainButton(NOT_NOW, new RunAction(this.changing.close.bind(this.changing))).build());
    return buttons;
  }
}
