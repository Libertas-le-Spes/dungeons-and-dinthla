export interface PluginData {
  load(): Promise<unknown>;
  save(data: unknown): Promise<void>;
}
