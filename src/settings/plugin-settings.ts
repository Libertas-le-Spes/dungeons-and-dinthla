import { isInConfigFolder, refusalForCampaignsFolder } from "../fence/campaigns-folder-path";
import { Fence } from "../fence/fence";

export interface PluginSettings {
  campaignsFolder: string | null;
  campaignFolder: string | null;
  welcomeSeen: boolean;
  lastVersionSeen: string | null;
}

function isCampaignsFolder(saved: unknown, configDir: string): saved is string {
  return typeof saved === "string" && refusalForCampaignsFolder(saved) === null && !isInConfigFolder(saved, configDir);
}

function isInside(campaignsFolder: string | null, configDir: string, saved: unknown): saved is string {
  return new Fence(() => campaignsFolder, configDir).holds(saved);
}

export function settingsOf(saved: unknown, configDir: string): PluginSettings {
  const settings: PluginSettings = { campaignsFolder: null, campaignFolder: null, welcomeSeen: false, lastVersionSeen: null };
  if (typeof saved !== "object" || saved === null) return settings;
  if ("campaignsFolder" in saved && isCampaignsFolder(saved.campaignsFolder, configDir)) settings.campaignsFolder = saved.campaignsFolder;
  if ("campaignFolder" in saved && isInside(settings.campaignsFolder, configDir, saved.campaignFolder)) settings.campaignFolder = saved.campaignFolder;
  if ("welcomeSeen" in saved && saved.welcomeSeen === true) settings.welcomeSeen = true;
  if ("lastVersionSeen" in saved && typeof saved.lastVersionSeen === "string") settings.lastVersionSeen = saved.lastVersionSeen;
  return settings;
}
