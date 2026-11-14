export const AGREEMENT_KEY = "dungeons-and-dinthla-beyond-agreement";

export interface DeviceStorage {
  load(key: string): unknown;
  save(key: string, value: unknown): void;
}

export class DeviceAgreement {
  constructor(private readonly storage: DeviceStorage) {}

  given(): boolean {
    return this.storage.load(AGREEMENT_KEY) === true;
  }

  give(): void {
    this.storage.save(AGREEMENT_KEY, true);
  }
}
