import type { App } from "obsidian";
import { ChangeDialog } from "../../views/dialogs/change-dialog";
import type { ImportFlow } from "./flows/import-flow";
import { ImportSteps } from "./import-steps";
import type { OnlineSource } from "./online/online-source";

export interface ImportClosed {
  importClosed(writtenPath: string | null): void;
}

export class ImportModal extends ChangeDialog {
  private readonly steps: ImportSteps;

  constructor(
    app: App,
    private readonly flow: ImportFlow,
    today: string,
    online: OnlineSource,
    private readonly onClosed: ImportClosed,
  ) {
    super(app);
    this.steps = new ImportSteps(this.contentEl, flow, today, online, { runWrite: this.runChange.bind(this), closeDialog: this.close.bind(this) });
  }

  async allSettled(): Promise<void> {
    await this.steps.settled();
    await this.changeSettled();
    await this.steps.settled();
  }

  override onOpen(): void {
    this.setTitle(this.flow.title);
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
    this.onClosed.importClosed(this.steps.written());
  }
}
