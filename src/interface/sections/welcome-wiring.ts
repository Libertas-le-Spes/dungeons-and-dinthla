import type { PluginManifest } from "obsidian";
import { CampaignMaker, type ChooseCampaign } from "../../campaign/writing/campaign-maker";
import type { FencedFiles } from "../../fence/fenced-files";
import type { FolderChoices } from "../../fence/folder-choices";
import type { CampaignsFolderSetting } from "../../settings/saved/campaigns-folder-setting";
import { CampaignsFolderSetup, type PickFolder } from "../../settings/choosing/campaigns-folder-setup";
import type { SettingsSaver } from "../../settings/saved/settings-saver";
import type { ShowWelcome } from "../../welcome/opening/first-run";
import { Help } from "../../welcome/opening/help";
import type { WelcomeStore } from "../../welcome/page/welcome-page";
import { NEWS_BY_VERSION } from "../../whats-new/news-by-version";
import type { MakePage } from "../view/campaign-pages";
import { welcomeSection } from "./welcome-section";

export interface WelcomeGate {
  files: Pick<FencedFiles, "getFiles" | "getFolderByPath" | "namesIn" | "createFolder" | "create" | "removeEmptyFolder">;
  folders: Pick<FolderChoices, "folderPaths" | "make">;
}

export interface WelcomeWiringNeeds {
  gate: WelcomeGate;
  store: WelcomeStore;
  saver: SettingsSaver;
  manifest: Pick<PluginManifest, "version">;
  setting: Pick<CampaignsFolderSetting, "path" | "choose">;
  campaignFolders(): string[];
  chooseCampaign: ChooseCampaign;
  openWelcome: ShowWelcome;
  pickFolder: PickFolder;
  startSession(): void;
}

export interface WelcomeWiring {
  help: Help;
  campaignsFolderSetup: CampaignsFolderSetup;
  welcome: MakePage;
}

export function welcomeWiring(needs: WelcomeWiringNeeds): WelcomeWiring {
  const files = needs.gate.files;
  const helpFiles = {
    campaignFolders: () => needs.campaignFolders(),
    filePaths: () => files.getFiles().map((file) => file.path),
  };
  const help = new Help(needs.saver, needs.manifest, NEWS_BY_VERSION, helpFiles, needs.openWelcome);
  const campaignsFolderSetup = new CampaignsFolderSetup(needs.setting, needs.gate.folders, needs.pickFolder);
  const welcome = welcomeSection({
    store: needs.store,
    campaignsFolderSetup,
    maker: new CampaignMaker(files, () => needs.setting.path, needs.chooseCampaign),
    files,
    startSession: () => needs.startSession(),
  });
  return { help, campaignsFolderSetup, welcome };
}
