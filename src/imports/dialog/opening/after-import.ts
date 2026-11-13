import type { ImportClosed } from "../import-modal";

export class AfterNewImport implements ImportClosed {
  constructor(
    private readonly returnFocus: () => void,
    private readonly showSheet: (path: string) => void,
  ) {}

  importClosed(writtenPath: string | null): void {
    if (writtenPath === null) {
      this.returnFocus();
      return;
    }
    this.showSheet(writtenPath);
  }
}

export class AfterUpdate implements ImportClosed {
  constructor(private readonly returnFocus: () => void) {}

  importClosed(): void {
    this.returnFocus();
  }
}
