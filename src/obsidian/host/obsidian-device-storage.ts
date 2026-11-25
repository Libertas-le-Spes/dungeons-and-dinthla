import type { DeviceStorage } from "../../host/keeping/device-storage";

export type LoadKept = (key: string) => unknown;
export type SaveKept = (key: string, value: unknown) => void;

export class ObsidianDeviceStorage implements DeviceStorage {
  constructor(
    private readonly loadKept: LoadKept,
    private readonly saveKept: SaveKept,
  ) {}

  load(key: string): unknown {
    return this.loadKept(key);
  }

  save(key: string, value: unknown): void {
    this.saveKept(key, value);
  }
}
