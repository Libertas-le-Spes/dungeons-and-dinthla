import type { Telling } from "../../host/showing/telling";
import { ButtonRow } from "../../views/components/dialogs/button-row";
import { MainButton, PlainButton } from "../../views/components/dialogs/dialog-buttons";
import { TextAreaField } from "../../views/components/dialogs/text-area-field";
import { TextField } from "../../views/components/dialogs/text-field";
import { ChangeWork, type ChangeEnds } from "../../views/dialogs/change-work";
import type { DialogView, ShownDialog } from "../../views/dialogs/dialog-view";
import type { TextChange } from "../../views/elements/bindings/binding-wiring";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Paragraph } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import type { NewQuestion } from "../writing/new-question";

const FAILURE = "Couldn't add the question";
const DIALOG_CLASSES = ["dd-dialog"];

const QUESTION = { name: "Question", label: "Question", placeholder: "Who sent the letter [[Brother Aldric]] carried" };
const ANSWER = { name: "Answer (optional)", label: "Answer", placeholder: "Lady Vess sent it, through [[Mira]]" };

class QuestionChange implements TextChange {
  constructor(private readonly entry: NewQuestion) {}

  changed(value: string): void {
    this.entry.question = value;
  }
}

class AnswerChange implements TextChange {
  constructor(private readonly entry: NewQuestion) {}

  changed(value: string): void {
    this.entry.answer = value;
  }
}

export class NewQuestionDialog implements ShownDialog, ChangeEnds {
  readonly title = "New question";
  readonly cls = DIALOG_CLASSES;
  private readonly entry: NewQuestion = { question: "", answer: "" };
  private readonly work: ChangeWork;
  private readonly questionHandle = new KeptHandle();
  private view: DialogView | null = null;

  constructor(
    telling: Pick<Telling, "say">,
    private readonly writesTo: string,
    private readonly add: (entry: NewQuestion) => Promise<boolean>,
    private readonly onClosed: () => void,
  ) {
    this.work = new ChangeWork(telling, this);
  }

  opened(view: DialogView): void {
    this.view = view;
    view.show(this.trees());
    this.questionHandle.focus();
  }

  mayClose(): boolean {
    return !this.work.isBusy();
  }

  closed(): void {
    this.onClosed();
  }

  settled(): Promise<void> {
    return this.work.settled();
  }

  finished(wrote: boolean): void {
    if (wrote) this.close();
    else this.questionHandle.focus();
  }

  failed(): void {}

  private trees(): ViewElement[] {
    const save = new RunAction(this.save.bind(this));
    const buttons = [new MainButton("Save", save).build(), new PlainButton("Cancel", new RunAction(this.close.bind(this))).build()];
    return [
      new TextField(QUESTION, new QuestionChange(this.entry), save).build("", this.questionHandle),
      new TextAreaField(ANSWER, new AnswerChange(this.entry), save).build("", null),
      new Paragraph({ cls: ["dd-where"], text: `New lines go into ${this.writesTo}.` }),
      new ButtonRow().build(buttons),
    ];
  }

  private close(): void {
    if (this.view !== null) this.view.close();
  }

  private save(): void {
    this.work.run(this.add.bind(this, this.entry), FAILURE);
  }
}
