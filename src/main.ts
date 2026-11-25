import { Plugin } from "obsidian";
import { Gatekeeper } from "./fence/gate/gatekeeper";
import { ObsidianFeatures } from "./obsidian/plugin/obsidian-features";

export default class DungeonsAndDinthla extends Plugin {
  private readonly gate = new Gatekeeper(this.app, () => this.features.campaignsFolderPath());
  private readonly features = new ObsidianFeatures(this, this.gate);

  override async onload(): Promise<void> {
    await this.features.load();
  }
}
