import type { Telling } from "../../host/showing/telling";
import type { ItemRecord, Source } from "../../campaign/record/campaign";
import { ButtonRow } from "../../views/components/dialogs/button-row";
import { ChoiceField } from "../../views/components/dialogs/choice-field";
import { MainButton, PlainButton } from "../../views/components/dialogs/dialog-buttons";
import { TextField } from "../../views/components/dialogs/text-field";
import { choiceOf } from "../../views/dialogs/choice-of";
import type { DialogView, ShownDialog } from "../../views/dialogs/dialog-view";
import { messageOf } from "../../views/dialogs/message-of";
import { RecordChanging, type FailureHeard } from "../../views/dialogs/record-changing";
import { ChangeBinding, HandleRequest, PressBinding } from "../../views/elements/bindings/bindings";
import type { TextChange } from "../../views/elements/bindings/binding-wiring";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button, FieldRow, Paragraph } from "../../views/elements/kinds/containers";
import { TextInput } from "../../views/elements/kinds/fields";
import type { ViewElement } from "../../views/elements/view-element";
import { holderNameOf } from "./item-groups";
import { asksHowMany, GONE_LINE_SAYS_MORE, type HolderOption, type ItemEdit } from "./item-plan";
import { ITEM_STATUSES, STATUS_CHOICES } from "./status-words";

const FAILURE = "Couldn't change the item";
const DIALOG_CLASSES = ["dd-dialog"];

const PRICE = { name: "Sold for (adds it to the purse)", label: "Sold for", placeholder: "150 gp" };

function holderChoices(holders: readonly HolderOption[]): { value: string; text: string }[] {
  const choices: { value: string; text: string }[] = [];
  for (const holder of holders) choices.push({ value: holder.text, text: holder.label });
  return choices;
}

function sameHolder(first: string, second: string): boolean {
  return holderNameOf(first).toLowerCase() === holderNameOf(second).toLowerCase();
}

class HolderChange implements TextChange {
  constructor(private readonly dialog: ItemDialog) {}

  changed(value: string): void {
    this.dialog.holderChanged(value);
  }
}

class StatusChange implements TextChange {
  constructor(private readonly dialog: ItemDialog) {}

  changed(value: string): void {
    this.dialog.statusChanged(value);
  }
}

class PriceChange implements TextChange {
  constructor(private readonly dialog: ItemDialog) {}

  changed(value: string): void {
    this.dialog.priceChanged(value);
  }
}

class HowManyChange implements TextChange {
  constructor(private readonly edit: ItemEdit) {}

  changed(value: string): void {
    this.edit.howMany = value;
  }
}

class OpenNoteOnGoneLine implements FailureHeard {
  constructor(private readonly button: KeptHandle) {}

  failedWith(error: unknown): void {
    if (messageOf(error) === GONE_LINE_SAYS_MORE && this.button.handle !== null) this.button.handle.setHidden(false);
  }
}

export class ItemDialog implements ShownDialog {
  readonly title = "Item";
  readonly cls = DIALOG_CLASSES;
  private readonly edit: ItemEdit;
  private readonly changing: RecordChanging;
  private readonly holderHandle = new KeptHandle();
  private readonly priceRow = new KeptHandle();
  private readonly howManyRow = new KeptHandle();
  private readonly openNoteButton = new KeptHandle();

  constructor(
    telling: Pick<Telling, "say">,
    private readonly item: ItemRecord,
    opened: ItemEdit,
    private readonly holders: HolderOption[],
    private readonly writesTo: string,
    private readonly save: (edit: ItemEdit) => Promise<boolean>,
    private readonly openNoteAt: (source: Source) => void,
    onClosed: (changed: boolean) => void,
  ) {
    this.changing = new RecordChanging(telling, onClosed);
    this.changing.hearFailures(new OpenNoteOnGoneLine(this.openNoteButton));
    this.edit = { ...opened };
    const current = holders.find((option) => sameHolder(option.text, item.holder));
    if (current !== undefined) this.edit.holder = current.text;
  }

  opened(view: DialogView): void {
    this.changing.opened(view);
    view.show(this.trees());
    this.showPrice();
    this.showHowMany();
    this.holderHandle.focus();
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

  holderChanged(value: string): void {
    this.edit.holder = value;
    this.showHowMany();
  }

  statusChanged(value: string): void {
    const status = choiceOf(ITEM_STATUSES, value);
    if (status === undefined) return;
    this.edit.status = status;
    this.showPrice();
    this.showHowMany();
    this.hideOpenNote();
  }

  priceChanged(value: string): void {
    this.edit.price = value;
    this.hideOpenNote();
  }

  private trees(): ViewElement[] {
    const save = new RunAction(this.saveEdit.bind(this));
    const trees: ViewElement[] = [
      new Paragraph({ cls: ["dd-subject"], text: this.item.name }),
      new ChoiceField("Held by", holderChoices(this.holders), new HolderChange(this)).build(this.edit.holder, this.holderHandle),
      new ChoiceField("Status", STATUS_CHOICES, new StatusChange(this)).build(this.edit.status, null),
    ];
    if (asksHowMany(this.item)) trees.push(this.howManyField());
    trees.push(
      new TextField(PRICE, new PriceChange(this), save).build(this.edit.price, null, this.priceRow),
      new Paragraph({ cls: ["dd-where"], text: `New lines go into ${this.writesTo}.` }),
      new ButtonRow().build(this.buttons(save)),
    );
    return trees;
  }

  private howManyField(): FieldRow {
    const input = new TextInput({ value: this.edit.howMany, label: "How many", bindings: [new ChangeBinding(new HowManyChange(this.edit))] });
    return new FieldRow(`How many? (${this.item.held} held)`, null, [input], { bindings: [new HandleRequest(this.howManyRow)] });
  }

  private buttons(save: RunAction): ViewElement[] {
    const openNote = new Button({ text: "Open note", hidden: true, bindings: [new PressBinding(new RunAction(this.openNote.bind(this))), new HandleRequest(this.openNoteButton)] });
    return [new MainButton("Save", save).build(), new PlainButton("Cancel", new RunAction(this.changing.close.bind(this.changing))).build(), openNote];
  }

  private showHowMany(): void {
    if (this.howManyRow.handle === null) return;
    this.howManyRow.handle.setHidden(this.edit.status === "held" && sameHolder(this.edit.holder, this.item.holder));
  }

  private showPrice(): void {
    if (this.priceRow.handle !== null) this.priceRow.handle.setHidden(this.edit.status !== "sold");
  }

  private hideOpenNote(): void {
    if (this.openNoteButton.handle !== null) this.openNoteButton.handle.setHidden(true);
  }

  private openNote(): void {
    const gone = this.item.gone;
    this.changing.close();
    if (gone !== null) this.openNoteAt(gone.source);
  }

  private saveEdit(): void {
    this.changing.run(this.save.bind(this, this.edit), FAILURE);
  }
}
