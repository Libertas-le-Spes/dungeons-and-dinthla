import { vi } from "vitest";
import { AGREEMENT_KEY, type DeviceStorage } from "../../../src/imports/agreement/device-agreement";

export class MadeUpDevice {
  readonly loadLocalStorage = vi.fn(this.load.bind(this));
  readonly saveLocalStorage = vi.fn(this.save.bind(this));
  private readonly kept = new Map<string, unknown>();

  get storage(): DeviceStorage {
    return { load: this.loadLocalStorage, save: this.saveLocalStorage };
  }

  static agreed(): MadeUpDevice {
    const device = new MadeUpDevice();
    device.kept.set(AGREEMENT_KEY, true);
    return device;
  }

  static holding(value: unknown): MadeUpDevice {
    const device = new MadeUpDevice();
    device.kept.set(AGREEMENT_KEY, value);
    return device;
  }

  private load(key: string): unknown {
    return this.kept.get(key);
  }

  private save(key: string, value: unknown): void {
    this.kept.set(key, value);
  }
}
