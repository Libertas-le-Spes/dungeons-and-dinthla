export const AGREEMENT_KEY = "dungeons-and-dinthla-beyond-agreement";

export interface DeviceStorage {
  load(key: string): unknown;
}

export interface SettingsAnswer {
  agreed(): boolean;
  keepAgreed(): Promise<void>;
}

export interface KeptPlaces {
  readonly settings: SettingsAnswer;
  readonly device: DeviceStorage;
  notKept(error: unknown): void;
}

export class KeptAgreement {
  private givenHere = false;

  constructor(private readonly places: KeptPlaces) {}

  given(): boolean {
    if (this.givenHere) return true;
    if (this.places.settings.agreed()) return true;
    return this.places.device.load(AGREEMENT_KEY) === true;
  }

  give(): Promise<void> {
    this.givenHere = true;
    return this.places.settings.keepAgreed().catch(this.places.notKept.bind(this.places));
  }
}
