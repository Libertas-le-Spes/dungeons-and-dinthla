import type { App } from "obsidian";
import { PartlyWritten } from "../../campaign/note-editor";
import { ChangeDialog } from "./change-dialog";

export abstract class RecordChangeDialog extends ChangeDialog {
  private changed = false;

  constructor(
    app: App,
    private readonly onClosed: (changed: boolean) => void,
  ) {
    super(app);
  }

  protected override closed(): void {
    this.onClosed(this.changed);
  }

  protected override finished(wrote: boolean): void {
    this.changed = wrote;
    this.close();
  }

  protected override failed(error: unknown): void {
    if (!(error instanceof PartlyWritten)) return;
    this.changed = true;
    this.close();
  }
}
