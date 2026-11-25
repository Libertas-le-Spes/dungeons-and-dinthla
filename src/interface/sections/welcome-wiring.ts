import type { PathSpelling } from "../../host/rules/path-spelling";
import type { PluginManifest } from "obsidian";
import { CampaignMaker, type ChooseCampaign } from "../../campaign/writing/campaign-maker";
import type { FolderChoices } from "../../fence/gate/folder-choices";
import type { NoteStore } from "../../host/notes/note-store";
import type { CampaignsFolderSetting } from "../../settings/saved/campaigns-folder-setting";
import { CampaignsFolderSetup, type PickFolder } from "../../settings/choosing/campaigns-folder-setup";
import type { SettingsSaver } from "../../settings/saved/settings-saver";
import type { WelcomeAgreement } from "../../welcome/endings/welcome-ending";
import type { ShowWelcome } from "../../welcome/opening/first-run";
import { Help } from "../../welcome/opening/help";
import type { WelcomeStore } from "../../welcome/page/welcome-page";
import { NEWS_BY_VERSION } from "../../whats-new/news-by-version";
import type { MakePage } from "../view/campaign-pages";
import { welcomeSection } from "./welcome-section";
import type { Telling } from "../../host/showing/telling";

export interface WelcomeGate {
  notes: { readonly store: Pick<NoteStore, "files" | "hasFolder" | "namesIn" | "makeFolder" | "make" | "removeEmptyFolder"> };
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
  agreement: WelcomeAgreement;
  spelling: PathSpelling;
  telling: Pick<Telling, "say">;
  startSession(): void;
}

export interface WelcomeWiring {
  maker: CampaignMaker;
  help: Help;
  campaignsFolderSetup: CampaignsFolderSetup;
  welcome: MakePage;
}

export function welcomeWiring(needs: WelcomeWiringNeeds): WelcomeWiring {
  const files = needs.gate.notes.store;
  const helpFiles = {
    campaignFolders: () => needs.campaignFolders(),
    filePaths: () => files.files().map((file) => file.path),
  };
  const help = new Help(needs.saver, needs.manifest, NEWS_BY_VERSION, helpFiles, needs.openWelcome);
  const campaignsFolderSetup = new CampaignsFolderSetup(needs.setting, needs.gate.folders, needs.pickFolder, needs.telling);
  const maker = new CampaignMaker(files, () => needs.setting.path, needs.chooseCampaign, needs.spelling, needs.telling);
  const welcome = welcomeSection({
    store: needs.store,
    campaignsFolderSetup,
    maker,
    files,
    agreement: needs.agreement,
    telling: needs.telling,
    startSession: () => needs.startSession(),
  });
  return { maker, help, campaignsFolderSetup, welcome };
}
