import { ButtonComponent, Setting, type App } from "obsidian";
import { REFERENCE_KIND_LIST } from "../../kinds/reference-kinds";
import type { ReferenceKind } from "../../kinds/reference-kind";
import { DrawnModal, type Closable, type DrawnContent } from "../../views/dialogs/drawn-modal";
import type { UndecidedName } from "../making/reference-note-plan";
import type { NewNames } from "./new-names";
import type { AskNewNames, NewNamesChoice } from "./new-names-choice";
import { NEW_NAMES_EXPLAINED, chosenWords, newNamesTitle } from "./new-names-words";

class NameRow {
  private readonly buttons: ButtonComponent[] = [];
  private readonly row: Setting;

  constructor(
    readonly undecided: UndecidedName,
    parentEl: HTMLElement,
  ) {
    this.row = new Setting(parentEl).setName(undecided.name);
  }

  addButton(kind: ReferenceKind, pressed: () => void): void {
    this.row.addButton((button) => {
      button.setButtonText(kind.label).onClick(pressed);
      this.buttons.push(button);
    });
  }

  settle(kind: ReferenceKind): void {
    this.row.setDesc(chosenWords(kind.label));
    for (const button of this.buttons) button.setDisabled(true);
  }
}

class Asking implements DrawnContent {
  readonly title: string;
  private unanswered: number;

  constructor(
    private readonly asked: NewNames,
    private readonly to: NewNamesChoice,
  ) {
    this.title = newNamesTitle(asked.sessionName);
    this.unanswered = asked.names.length;
  }

  draw(contentEl: HTMLElement, dialog: Closable): void {
    contentEl.addClass("dd-new-names");
    contentEl.createEl("p", { cls: "dd-new-names-words", text: NEW_NAMES_EXPLAINED });
    for (const undecided of this.asked.names) this.drawRow({ undecided, contentEl, dialog });
  }

  closed(): void {
    this.to.closed();
  }

  private drawRow({ undecided, contentEl, dialog }: { undecided: UndecidedName; contentEl: HTMLElement; dialog: Closable }): void {
    const row = new NameRow(undecided, contentEl);
    for (const kind of REFERENCE_KIND_LIST) row.addButton(kind, () => this.choose({ row, kind, dialog }));
  }

  private choose({ row, kind, dialog }: { row: NameRow; kind: ReferenceKind; dialog: Closable }): void {
    row.settle(kind);
    this.to.chosen({ undecided: row.undecided, kind: kind.name });
    this.unanswered -= 1;
    if (this.unanswered === 0) dialog.close();
  }
}

export function newNamesDialogIn(app: App): AskNewNames {
  return (names, to) => new DrawnModal(app, new Asking(names, to)).open();
}
