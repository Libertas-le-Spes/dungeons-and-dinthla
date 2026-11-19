import { vi } from "vitest";
import { AGREEMENT_KEY, type DeviceStorage, type KeptPlaces } from "../../../src/imports/agreement/kept-agreement";

export class MadeUpDevice {
  readonly loadLocalStorage = vi.fn(this.load.bind(this));
  readonly keepAgreed = vi.fn(this.keepInVault.bind(this));
  readonly notKept = vi.fn();
  private readonly kept = new Map<string, unknown>();
  private agreedInVault = false;
  private vaultRefusal: Error | null = null;

  get storage(): DeviceStorage {
    return { load: this.loadLocalStorage };
  }

  get places(): KeptPlaces {
    return { settings: { agreed: this.vaultAgreed.bind(this), keepAgreed: this.keepAgreed }, device: this.storage, notKept: this.notKept };
  }

  static agreed(): MadeUpDevice {
    const device = new MadeUpDevice();
    device.agreedInVault = true;
    return device;
  }

  static agreedOnThisDeviceBefore(): MadeUpDevice {
    return MadeUpDevice.holding(true);
  }

  static holding(value: unknown): MadeUpDevice {
    const device = new MadeUpDevice();
    device.kept.set(AGREEMENT_KEY, value);
    return device;
  }

  static refusingToKeep(error: Error): MadeUpDevice {
    const device = new MadeUpDevice();
    device.vaultRefusal = error;
    return device;
  }

  private load(key: string): unknown {
    return this.kept.get(key);
  }

  private vaultAgreed(): boolean {
    return this.agreedInVault;
  }

  private keepInVault(): Promise<void> {
    if (this.vaultRefusal !== null) return Promise.reject(this.vaultRefusal);
    this.agreedInVault = true;
    return Promise.resolve();
  }
}
