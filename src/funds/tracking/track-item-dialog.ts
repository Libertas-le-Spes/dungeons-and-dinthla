import type { Telling } from "../../host/showing/telling";
import { ButtonRow } from "../../views/components/dialogs/button-row";
import { MainButton, PlainButton } from "../../views/components/dialogs/dialog-buttons";
import type { DialogView, ShownDialog } from "../../views/dialogs/dialog-view";
import { RecordChanging } from "../../views/dialogs/record-changing";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Paragraph } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";

export const TRACK_TITLE = "Track on the funds page";
export const COULD_NOT_TRACK = "Couldn't track the item";

const DIALOG_CLASSES = ["dd-dialog"];

export interface TrackShown {
  readonly name: string;
  readonly holder: string;
  readonly writesTo: string;
  readonly line: string;
}

export interface TrackSaving {
  save(): Promise<boolean>;
}

export class TrackItemDialog implements ShownDialog {
  readonly title = TRACK_TITLE;
  readonly cls = DIALOG_CLASSES;
  private readonly changing: RecordChanging;

  constructor(
    telling: Pick<Telling, "say">,
    private readonly shown: TrackShown,
    private readonly saving: TrackSaving,
    onClosed: (changed: boolean) => void,
  ) {
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

  private trees(): ViewElement[] {
    const save = new MainButton("Save", new RunAction(this.saveTracking.bind(this))).build();
    const cancel = new PlainButton("Cancel", new RunAction(this.changing.close.bind(this.changing))).build();
    return [
      new Paragraph({ cls: ["dd-subject"], text: this.shown.name }),
      new Paragraph({ cls: ["dd-reading"], text: `Held by ${this.shown.holder}` }),
      new Paragraph({ cls: ["dd-where"], text: `Adds this line to ${this.shown.writesTo}:` }),
      new Paragraph({ cls: ["dd-subject"], text: this.shown.line }),
      new ButtonRow().build([save, cancel]),
    ];
  }

  private saveTracking(): void {
    this.changing.run(this.saving.save.bind(this.saving), COULD_NOT_TRACK);
  }
}
