import type { ImportClosed } from "../import-modal";

export interface MainOffering {
  afterImport(path: string): Promise<void>;
  afterUpdate(path: string): Promise<void>;
}

export class AfterNewImport implements ImportClosed {
  constructor(
    private readonly returnFocus: () => void,
    private readonly showSheet: (path: string) => void,
    private readonly offers: MainOffering,
  ) {}

  importClosed(writtenPath: string | null): void {
    if (writtenPath === null) {
      this.returnFocus();
      return;
    }
    this.showSheet(writtenPath);
    void this.offers.afterImport(writtenPath);
  }
}

export class AfterUpdate implements ImportClosed {
  constructor(
    private readonly returnFocus: () => void,
    private readonly offers: MainOffering,
  ) {}

  importClosed(writtenPath: string | null): void {
    this.returnFocus();
    if (writtenPath === null) return;
    void this.offers.afterUpdate(writtenPath);
  }
}
