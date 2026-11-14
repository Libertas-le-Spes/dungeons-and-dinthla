import type { App } from "obsidian";
import { ChangeDialog } from "../../views/dialogs/change-dialog";
import type { ImportFlow } from "./flows/import-flow";
import { ImportSteps } from "./import-steps";
import type { OnlineSource } from "./online/online-source";

export interface ImportClosed {
  importClosed(writtenPath: string | null): void;
}

export interface ModalParts {
  readonly flow: ImportFlow;
  readonly today: string;
  readonly online: OnlineSource;
  readonly onClosed: ImportClosed;
}

export class ImportModal extends ChangeDialog {
  private readonly steps: ImportSteps;

  constructor(
    app: App,
    private readonly parts: ModalParts,
  ) {
    super(app);
    this.steps = new ImportSteps(this.contentEl, { flow: parts.flow, today: parts.today, online: parts.online, host: { runWrite: this.runChange.bind(this), closeDialog: this.close.bind(this) } });
  }

  async allSettled(): Promise<void> {
    await this.steps.settled();
    await this.changeSettled();
    await this.steps.settled();
  }

  override onOpen(): void {
    this.setTitle(this.parts.flow.title);
    this.contentEl.addClass("dd-tokens", "dd-dialog", "dd-import");
    this.steps.start();
  }

  protected override finished(): void {
    this.close();
  }

  protected override failed(error: unknown): void {
    this.steps.writeFailed(error);
  }

  protected override closed(): void {
    this.steps.stop();
    this.parts.onClosed.importClosed(this.steps.written());
  }
}
