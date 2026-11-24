import type { Telling } from "../../host/showing/telling";
import type { Source } from "../../campaign/record/campaign";
import { CHANGED_IN_NOTE, PartlyWritten } from "../../campaign/writing/note-editor";
import { sessionLabelOf } from "../../campaign/paths/session-file";
import { messageOf } from "../../views/dialogs/message-of";
import { DeleteButton } from "../../views/components/dialogs/delete-button";
import { TextField } from "../../views/components/dialogs/text-field";
import { ChangeWork, type ChangeEnds } from "../../views/dialogs/change-work";
import type { DialogView, ShownDialog } from "../../views/dialogs/dialog-view";
import { HandleRequest, PressBinding } from "../../views/elements/bindings/bindings";
import type { TextChange } from "../../views/elements/bindings/binding-wiring";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Anchor, Button, Div, List, ListItem, Paragraph } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import type { ElementHandle } from "../../views/elements/element-handle";
import type { SheetValue, ValueState } from "../reading/character-sheet";
import { shownTextOf, STATE_WORDS } from "../reading/sheet-value-words";
import type { ValueChoice } from "./sheet-value-writer";
import { isSheetName } from "../reading/sheet-values";

export interface SheetValueDialog {
  character: string;
  notePath: string;
  value: SheetValue;
  sessionLabel: string | null;
  save(choice: ValueChoice): Promise<boolean>;
  openSource(source: Source): void;
}

const STATES: ValueState[] = ["learned", "override", "carried", "unknown"];

const IMPORTED_CHOICES: ValueState[] = ["imported", "override"];

const CHOICES_BY_STATE: ReadonlyMap<ValueState, ValueState[]> = new Map([["imported", IMPORTED_CHOICES]]);

const STATE_ON_ENTER: ReadonlyMap<ValueState, ValueState> = new Map<ValueState, ValueState>([
  ["unknown", "learned"],
  ["imported", "override"],
]);

const CLEARING_STATES: ValueState[] = ["learned", "carried", "unknown"];

export function removesNoteLines(value: SheetValue, state: ValueState): boolean {
  return value.override !== null && !isSheetName(value.name) && CLEARING_STATES.includes(state);
}

export function notKnownOverCarriedText(label: string): string {
  return `Not known yet hides the carried ${label.toLowerCase()}.`;
}

export function secondPressText(character: string, label: string): string {
  return `Press twice to remove ${label} from ${character}'s note.`;
}

class Disabled {
  received(handle: ElementHandle): void {
    handle.setDisabled(true);
  }
}

export const CHANGE_ON_BEYOND = "The next update replaces this.";

function stateOnEnter(state: ValueState): ValueState {
  const entered = STATE_ON_ENTER.get(state);
  if (entered === undefined) return state;
  return entered;
}

function choicesFor(state: ValueState): ValueState[] {
  const choices = CHOICES_BY_STATE.get(state);
  if (choices === undefined) return STATES;
  return choices;
}

export function earlierSourceOf(source: Source, notePath: string): string {
  if (source.path === notePath) return STATE_WORDS.override;
  return sessionLabelOf(source.path);
}

export function whereText(character: string, sessionLabel: string | null): string {
  let learned = "Learned at the table needs a session.";
  if (sessionLabel !== null) learned = `Learned at the table adds a line to ${sessionLabel}.`;
  return `${learned} Override changes ${character}'s note.`;
}

const DIALOG_CLASSES = ["dd-dialog", "dd-sheet-dialog"];
const VALUE = { name: "Value", label: "Value", placeholder: "Value" };

class TypedValue implements TextChange {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  changed(value: string): void {
    this.value = value;
  }
}

class Choose {
  constructor(
    private readonly dialog: SheetValueEditDialog,
    private readonly state: ValueState,
  ) {}

  chosen(): void {
    this.dialog.choose(this.state);
  }
}

class OpenEarlier {
  constructor(
    private readonly dialog: SheetValueEditDialog,
    private readonly source: Source,
  ) {}

  opened(): void {
    this.dialog.openEarlier(this.source);
  }
}

export class SheetValueEditDialog implements ShownDialog, ChangeEnds {
  readonly title: string;
  readonly cls = DIALOG_CLASSES;
  private readonly typed: TypedValue;
  private readonly work: ChangeWork;
  private readonly valueHandle = new KeptHandle();
  private readonly deleting: DeleteButton[] = [];
  private view: DialogView | null = null;

  constructor(
    telling: Pick<Telling, "say">,
    private readonly dialog: SheetValueDialog,
    private readonly onClosed: () => void,
  ) {
    this.title = dialog.value.label;
    this.work = new ChangeWork(telling, this);
    this.typed = new TypedValue("");
    if (dialog.value.state !== "unknown") this.typed = new TypedValue(shownTextOf(dialog.value));
  }

  opened(view: DialogView): void {
    this.view = view;
    view.show(this.trees());
    this.valueHandle.focus();
  }

  mayClose(): boolean {
    return !this.work.isBusy();
  }

  closed(): void {
    for (const deleting of this.deleting) deleting.stop();
    this.onClosed();
  }

  settled(): Promise<void> {
    return this.work.settled();
  }

  finished(): void {
    this.close();
  }

  failed(error: unknown): void {
    if (error instanceof PartlyWritten || messageOf(error) === CHANGED_IN_NOTE) this.close();
    else this.valueHandle.focus();
  }

  choose(state: ValueState): void {
    const choice = { state, value: this.typed.value };
    this.work.run(this.dialog.save.bind(this.dialog, choice), `Couldn't change the ${this.dialog.value.label.toLowerCase()}`);
  }

  openEarlier(source: Source): void {
    this.close();
    this.dialog.openSource(source);
  }

  private trees(): ViewElement[] {
    const { value } = this.dialog;
    const onEnter = new Choose(this, stateOnEnter(value.state));
    const trees: ViewElement[] = [new TextField(VALUE, this.typed, new RunAction(onEnter.chosen.bind(onEnter))).build(this.typed.value, this.valueHandle)];
    trees.push(...this.earlier());
    const choices: ViewElement[] = [];
    for (const state of choicesFor(value.state)) choices.push(this.choice(state));
    trees.push(new Div({ cls: ["dd-state-choices"] }, choices));
    if (value.imported !== null) trees.push(new Paragraph({ cls: ["dd-where", "dd-beyond-hint"], text: CHANGE_ON_BEYOND }));
    trees.push(new Paragraph({ cls: ["dd-where"], text: whereText(this.dialog.character, this.dialog.sessionLabel) }));
    if (value.carried !== null && value.learned === null) trees.push(new Paragraph({ cls: ["dd-where"], text: notKnownOverCarriedText(value.label) }));
    if (removesNoteLines(value, "learned")) trees.push(new Paragraph({ cls: ["dd-where"], text: secondPressText(this.dialog.character, value.label) }));
    return trees;
  }

  private earlier(): ViewElement[] {
    const { earlier } = this.dialog.value;
    if (earlier.length === 0) return [];
    const items: ListItem[] = [];
    for (const line of [...earlier].reverse()) {
      const open = new OpenEarlier(this, line.source);
      const text = `${line.value} · ${earlierSourceOf(line.source, this.dialog.notePath)}`;
      items.push(new ListItem({}, [new Anchor({ cls: ["dd-source-link"], text, bindings: [new PressBinding(new RunAction(open.opened.bind(open)))] })]));
    }
    return [new Paragraph({ cls: ["dd-detail"], text: "Earlier values" }), new List({ cls: ["dd-earlier-list"] }, items)];
  }

  private choice(state: ValueState): Button {
    const parts = { cls: ["dd-state-choice"], pressed: state === this.dialog.value.state, dataState: state };
    const choose = new Choose(this, state);
    if (state === "imported") return new Button({ ...parts, text: STATE_WORDS[state], bindings: [new HandleRequest(new Disabled())] });
    if (!removesNoteLines(this.dialog.value, state)) return new Button({ ...parts, text: STATE_WORDS[state], bindings: [new PressBinding(new RunAction(choose.chosen.bind(choose)))] });
    const deleting = new DeleteButton(STATE_WORDS[state], new RunAction(choose.chosen.bind(choose)));
    this.deleting.push(deleting);
    return deleting.build(parts);
  }

  private close(): void {
    if (this.view !== null) this.view.close();
  }
}
