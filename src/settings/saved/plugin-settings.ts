import { isInConfigFolder, refusalForCampaignsFolder } from "../../fence/paths/campaigns-folder-path";
import { Fence } from "../../fence/paths/fence";

export interface PluginSettings {
  campaignsFolder: string | null;
  campaignFolder: string | null;
  welcomeSeen: boolean;
  lastVersionSeen: string | null;
  notesMadeFor: string[];
  beyondAgreed: boolean;
  charactersBasesSwept: boolean;
}

function isCampaignsFolder(saved: unknown, configDir: string): saved is string {
  return typeof saved === "string" && refusalForCampaignsFolder(saved) === null && !isInConfigFolder(saved, configDir);
}

function isInside(campaignsFolder: string | null, configDir: string, saved: unknown): saved is string {
  return new Fence(() => campaignsFolder, configDir).holds(saved);
}

function foldersInside(campaignsFolder: string | null, configDir: string, saved: unknown): string[] {
  if (!Array.isArray(saved)) return [];
  const folders: string[] = [];
  for (const folder of saved) {
    if (isInside(campaignsFolder, configDir, folder)) folders.push(folder);
  }
  return folders;
}

export function settingsOf(saved: unknown, configDir: string): PluginSettings {
  const settings: PluginSettings = { campaignsFolder: null, campaignFolder: null, welcomeSeen: false, lastVersionSeen: null, notesMadeFor: [], beyondAgreed: false, charactersBasesSwept: false };
  if (typeof saved !== "object" || saved === null) return settings;
  if ("campaignsFolder" in saved && isCampaignsFolder(saved.campaignsFolder, configDir)) settings.campaignsFolder = saved.campaignsFolder;
  if ("campaignFolder" in saved && isInside(settings.campaignsFolder, configDir, saved.campaignFolder)) settings.campaignFolder = saved.campaignFolder;
  if ("welcomeSeen" in saved && saved.welcomeSeen === true) settings.welcomeSeen = true;
  if ("lastVersionSeen" in saved && typeof saved.lastVersionSeen === "string") settings.lastVersionSeen = saved.lastVersionSeen;
  if ("beyondAgreed" in saved && saved.beyondAgreed === true) settings.beyondAgreed = true;
  if ("charactersBasesSwept" in saved && saved.charactersBasesSwept === true) settings.charactersBasesSwept = true;
  if ("notesMadeFor" in saved) settings.notesMadeFor = foldersInside(settings.campaignsFolder, configDir, saved.notesMadeFor);
  return settings;
}
