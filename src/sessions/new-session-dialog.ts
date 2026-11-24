import { ButtonRow } from "../views/components/dialogs/button-row";
import { DateField } from "../views/components/dialogs/date-field";
import { MainButton, PlainButton } from "../views/components/dialogs/dialog-buttons";
import { TextField } from "../views/components/dialogs/text-field";
import type { DialogView, ShownDialog } from "../views/dialogs/dialog-view";
import type { TextChange } from "../views/elements/bindings/binding-wiring";
import { KeptHandle } from "../views/elements/bindings/kept-handle";
import { RunAction } from "../views/elements/bindings/run-action";
import type { ViewElement } from "../views/elements/view-element";
import type { NewSession } from "./create-session";
import { playedDateOf, withPlayedDate } from "./played-date";

const DIALOG_CLASSES = ["dd-new-session"];

const TITLE = { name: "Title (optional)", label: "Title", placeholder: "The Old Mill" };

class TitleChange implements TextChange {
  constructor(private readonly session: NewSession) {}

  changed(value: string): void {
    this.session.title = value;
  }
}

class PlayedChange implements TextChange {
  constructor(private readonly session: NewSession) {}

  changed(value: string): void {
    this.session.played = value;
  }
}

export class NewSessionDialog implements ShownDialog {
  readonly title: string;
  readonly cls = DIALOG_CLASSES;
  private readonly session: NewSession = { title: "", played: playedDateOf(new Date()) };
  private readonly titleHandle = new KeptHandle();
  private view: DialogView | null = null;
  private started: Promise<void> = Promise.resolve();

  constructor(
    number: number,
    private readonly start: (session: NewSession) => Promise<void>,
  ) {
    this.title = `Start session ${number}`;
  }

  opened(view: DialogView): void {
    this.view = view;
    view.show(this.trees());
    this.titleHandle.focus();
  }

  mayClose(): boolean {
    return true;
  }

  closed(): void {}

  startSettled(): Promise<void> {
    return this.started;
  }

  private trees(): ViewElement[] {
    const begin = new RunAction(this.begin.bind(this));
    const buttons = [new MainButton("Start session", begin).build(), new PlainButton("Cancel", new RunAction(this.close.bind(this))).build()];
    return [
      new TextField(TITLE, new TitleChange(this.session), begin).build("", this.titleHandle),
      new DateField("Played on", new PlayedChange(this.session)).build(this.session.played),
      new ButtonRow().build(buttons),
    ];
  }

  private close(): void {
    if (this.view !== null) this.view.close();
  }

  private begin(): void {
    this.close();
    this.started = this.start(withPlayedDate(this.session, new Date()));
  }
}
