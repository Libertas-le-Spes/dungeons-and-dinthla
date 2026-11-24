import type { Telling } from "../../host/showing/telling";
import type { CoinDraft, CoinLine, Direction } from "../../notes/writing/coin-lines";
import { ButtonRow } from "../../views/components/dialogs/button-row";
import { ChoiceField } from "../../views/components/dialogs/choice-field";
import { DeleteButton } from "../../views/components/dialogs/delete-button";
import { MainButton, PlainButton } from "../../views/components/dialogs/dialog-buttons";
import { TextField } from "../../views/components/dialogs/text-field";
import { ChangeWork, type ChangeEnds } from "../../views/dialogs/change-work";
import { choiceOf } from "../../views/dialogs/choice-of";
import type { DialogView, ShownDialog } from "../../views/dialogs/dialog-view";
import { HandleRequest } from "../../views/elements/bindings/bindings";
import type { TextChange } from "../../views/elements/bindings/binding-wiring";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Paragraph } from "../../views/elements/kinds/containers";
import type { Stoppable } from "../../views/dialogs/record-changing";
import type { ViewElement } from "../../views/elements/view-element";
import type { CoinEntryChoices } from "./coin-entry";
import type { CoinReader } from "./coin-readers";

export type CoinOutcome = "unchanged" | "written" | "deleted";

const DIRECTIONS: Direction[] = ["in", "out"];
const DIRECTION_CHOICES = [
  { value: "in", text: "In" },
  { value: "out", text: "Out" },
];

const DIALOG_CLASSES = ["dd-dialog"];
const ERROR_CLASS = "dd-error";

const AMOUNT = { name: "Amount", label: "Amount", placeholder: "35 gp 4 sp" };
const WHAT_FOR = { name: "What for", label: "What for", placeholder: "from the bandits at the ford" };

interface Reading {
  readonly text: string;
  readonly isError: boolean;
}

class DraftChange implements TextChange {
  constructor(
    private readonly dialog: CoinDialog,
    private readonly takes: (value: string) => void,
  ) {}

  changed(value: string): void {
    this.takes(value);
    this.dialog.showReading();
  }
}

export class CoinDialog implements ShownDialog, ChangeEnds {
  readonly title: string;
  readonly cls = DIALOG_CLASSES;
  private readonly draft: CoinDraft;
  private outcome: CoinOutcome = "unchanged";
  private readonly work: ChangeWork;
  private readonly directionHandle = new KeptHandle();
  private readonly amountHandle = new KeptHandle();
  private readonly reading = new KeptHandle();
  private readonly stoppables: Stoppable[] = [];
  private view: DialogView | null = null;

  constructor(
    telling: Pick<Telling, "say">,
    private readonly writesTo: string,
    private readonly save: (written: CoinLine) => Promise<boolean>,
    private readonly entry: CoinEntryChoices | null,
    private readonly openNote: (() => void) | null,
    private readonly onClosed: (outcome: CoinOutcome) => void,
    private readonly reader: CoinReader,
  ) {
    this.work = new ChangeWork(telling, this);
    this.draft = { direction: "in", amount: "", what: "" };
    this.title = "Add coin";
    if (entry !== null) {
      this.draft = { ...entry.draft };
      this.title = "Ledger entry";
    }
  }

  opened(view: DialogView): void {
    this.view = view;
    view.show(this.trees());
    this.showReading();
    this.directionHandle.focus();
  }

  mayClose(): boolean {
    return !this.work.isBusy();
  }

  closed(): void {
    for (const stoppable of this.stoppables) stoppable.stop();
    this.onClosed(this.outcome);
  }

  settled(): Promise<void> {
    return this.work.settled();
  }

  finished(): void {
    this.close();
  }

  failed(): void {}

  showReading(): void {
    const reading = this.readingNow();
    this.reading.setClassOn(ERROR_CLASS, reading.isError);
    this.reading.setText(reading.text);
  }

  private readingNow(): Reading {
    const cannotSave = this.cannotSave();
    if (cannotSave !== null) return { text: cannotSave, isError: true };
    if (this.draft.amount.trim() === "") return { text: "", isError: false };
    const reading = this.reader.readingOf(this.draft);
    if ("error" in reading) return { text: reading.error, isError: true };
    return { text: reading.reads, isError: false };
  }

  private takeDirection(value: string): void {
    const direction = choiceOf(DIRECTIONS, value);
    if (direction !== undefined) this.draft.direction = direction;
  }

  private takeAmount(value: string): void {
    this.draft.amount = value;
  }

  private takeWhat(value: string): void {
    this.draft.what = value;
  }

  private trees(): ViewElement[] {
    const save = new RunAction(this.saveDraft.bind(this));
    return [
      new ChoiceField("Money", DIRECTION_CHOICES, new DraftChange(this, this.takeDirection.bind(this))).build(this.draft.direction, this.directionHandle),
      new TextField(AMOUNT, new DraftChange(this, this.takeAmount.bind(this)), save).build(this.draft.amount, this.amountHandle),
      new TextField(WHAT_FOR, new DraftChange(this, this.takeWhat.bind(this)), save).build(this.draft.what, null),
      new Paragraph({ cls: ["dd-reading"], live: "polite", bindings: [new HandleRequest(this.reading)] }),
      new Paragraph({ cls: ["dd-where"], text: this.whereWords() }),
      new ButtonRow().build(this.buttons(save)),
    ];
  }

  private buttons(save: RunAction): ViewElement[] {
    const buttons: ViewElement[] = [new MainButton("Save", save).build(), new PlainButton("Cancel", new RunAction(this.close.bind(this))).build()];
    if (this.openNote !== null && this.cannotSave() !== null) buttons.push(new PlainButton("Open note", new RunAction(this.showNote.bind(this))).build());
    if (this.entry !== null) {
      const deleting = new DeleteButton("Delete entry", new RunAction(this.deleteEntry.bind(this)));
      this.stoppables.push(deleting);
      buttons.push(deleting.build());
    }
    return buttons;
  }

  private whereWords(): string {
    if (this.entry === null) return this.reader.addsWords(this.writesTo);
    return `Saving replaces the entry's line in ${this.writesTo}.`;
  }

  private close(): void {
    if (this.view !== null) this.view.close();
  }

  private showNote(): void {
    this.close();
    if (this.openNote !== null) this.openNote();
  }

  private cannotSave(): string | null {
    if (this.entry === null) return null;
    return this.entry.cannotSave;
  }

  private saveDraft(): void {
    const reading = this.reader.readingOf(this.draft);
    if (this.cannotSave() !== null || "error" in reading) {
      this.showReading();
      this.amountHandle.focus();
      return;
    }
    this.saveAs("written", this.save.bind(this, reading));
  }

  private deleteEntry(): void {
    if (this.entry !== null) this.saveAs("deleted", this.entry.delete.bind(this.entry));
  }

  private failureText(): string {
    if (this.entry === null) return "Couldn't add the coin";
    return "Couldn't change the entry";
  }

  private saveAs(done: CoinOutcome, change: () => Promise<boolean>): void {
    this.work.run(this.noting.bind(this, done, change), this.failureText());
  }

  private async noting(done: CoinOutcome, change: () => Promise<boolean>): Promise<boolean> {
    const wrote = await change();
    if (wrote) this.outcome = done;
    return wrote;
  }
}
