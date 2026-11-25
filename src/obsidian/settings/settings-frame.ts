import { PluginSettingTab, type App, type Plugin } from "obsidian";
import type { ShownPage } from "../../views/pages/page-view";
import { FramePage } from "../views/frames/page-frame";
import { PLAIN_KIT } from "../views/mount/mount-kit";

export class SettingsFrame extends PluginSettingTab {
  private shown = false;

  constructor(
    app: App,
    plugin: Plugin,
    readonly page: ShownPage,
  ) {
    super(app, plugin);
  }

  override display(): void {
    this.close();
    this.containerEl.empty();
    this.page.opened(new FramePage(this.containerEl, PLAIN_KIT));
    this.shown = true;
  }

  override hide(): void {
    this.close();
    super.hide();
  }

  private close(): void {
    if (!this.shown) return;
    this.shown = false;
    this.page.closed();
  }
}
