import type { Telling } from "../../host/showing/telling";
import { ChangeWork, type ChangeEnds } from "../../views/dialogs/change-work";
import type { DialogView, ShownDialog } from "../../views/dialogs/dialog-view";
import type { ImportFlow } from "./flows/import-flow";
import { ImportSteps } from "./import-steps";
import type { OnlineSource } from "./online/online-source";

export interface ImportClosed {
  importClosed(writtenPath: string | null): void;
}

export interface DialogParts {
  readonly flow: ImportFlow;
  readonly today: string;
  readonly online: OnlineSource;
  readonly onClosed: ImportClosed;
}

const DIALOG_CLASSES = ["dd-dialog", "dd-import"];

export class ImportDialog implements ShownDialog, ChangeEnds {
  readonly title: string;
  readonly cls = DIALOG_CLASSES;
  private readonly steps: ImportSteps;
  private readonly work: ChangeWork;
  private view: DialogView | null = null;

  constructor(
    telling: Pick<Telling, "say">,
    private readonly parts: DialogParts,
  ) {
    this.title = parts.flow.title;
    this.work = new ChangeWork(telling, this);
    this.steps = new ImportSteps({ flow: parts.flow, today: parts.today, online: parts.online, host: { runWrite: this.work.run.bind(this.work), closeDialog: this.close.bind(this) } });
  }

  async allSettled(): Promise<void> {
    await this.steps.settled();
    await this.work.settled();
    await this.steps.settled();
  }

  opened(view: DialogView): void {
    this.view = view;
    this.steps.start(view);
  }

  mayClose(): boolean {
    return !this.work.isBusy();
  }

  closed(): void {
    this.steps.stop();
    this.parts.onClosed.importClosed(this.steps.written());
  }

  finished(): void {
    this.close();
  }

  failed(error: unknown): void {
    this.steps.writeFailed(error);
  }

  private close(): void {
    if (this.view !== null) this.view.close();
  }
}
