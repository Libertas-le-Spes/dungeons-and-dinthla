import type { PluginData } from "../../host/keeping/plugin-data";

export type LoadData = () => Promise<unknown>;
export type SaveData = (data: unknown) => Promise<void>;

export class ObsidianPluginData implements PluginData {
  constructor(
    private readonly loadData: LoadData,
    private readonly saveData: SaveData,
  ) {}

  load(): Promise<unknown> {
    return this.loadData();
  }

  save(data: unknown): Promise<void> {
    return this.saveData(data);
  }
}
