import { Component, Menu, Notice, setIcon } from "obsidian";
import { campaignNameOf } from "../../campaign/paths/campaign-folders";
import type { CampaignChoice } from "../../settings/choosing/campaign-setting-tab";
import { messageOf } from "../../views/dialogs/message-of";

export const SWITCH_LABEL = "Switch campaign";
export const NEW_CAMPAIGN_ENTRY = "New campaign";

const SWITCH_ICON = "chevrons-up-down";
const NEW_CAMPAIGN_ICON = "plus";

export interface SwitchableCampaigns extends CampaignChoice {
  startNewCampaign(): void;
}

export interface CampaignSwitcherNeeds {
  parentEl: HTMLElement;
  campaigns: SwitchableCampaigns;
}

export class CampaignSwitcher extends Component {
  constructor(private readonly needs: CampaignSwitcherNeeds) {
    super();
  }

  override onload(): void {
    const button = this.needs.parentEl.createEl("button", {
      cls: ["clickable-icon", "dd-nav-switch"],
      attr: { "aria-label": SWITCH_LABEL, "aria-haspopup": "menu" },
    });
    setIcon(button, SWITCH_ICON);
    this.registerDomEvent(button, "click", () => this.openMenu(button));
  }

  private openMenu(button: HTMLElement): void {
    const campaigns = this.needs.campaigns;
    const folders = campaigns.folders();
    const chosen = campaigns.chosen();
    const menu = new Menu();
    for (const folder of folders) {
      menu.addItem((item) =>
        item
          .setTitle(campaignNameOf(folder))
          .setChecked(folder === chosen)
          .onClick(() => this.switchTo(folder)),
      );
    }
    if (folders.length > 0) menu.addSeparator();
    menu.addItem((item) => item.setTitle(NEW_CAMPAIGN_ENTRY).setIcon(NEW_CAMPAIGN_ICON).onClick(() => campaigns.startNewCampaign()));
    menu.onHide(() => button.focus());
    const box = button.getBoundingClientRect();
    menu.showAtPosition({ x: box.left, y: box.bottom });
  }

  private switchTo(folder: string): void {
    const campaigns = this.needs.campaigns;
    if (folder === campaigns.chosen()) return;
    if (!campaigns.folders().includes(folder)) {
      new Notice(`Couldn't switch campaign: ${campaignNameOf(folder)} is no longer there.`);
      return;
    }
    campaigns.choose(folder).catch((error: unknown) => new Notice(`Couldn't switch campaign: ${messageOf(error)}`));
  }
}
