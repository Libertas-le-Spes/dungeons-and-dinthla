export interface DeviceStorage {
  load(key: string): unknown;
  save(key: string, value: unknown): void;
}
