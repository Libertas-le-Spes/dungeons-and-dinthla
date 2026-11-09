import { refusalForCampaignsFolder } from "../fence/campaigns-folder-path";
import { Fence } from "../fence/fence";

export interface PluginSettings {
  campaignsFolder: string | null;
  campaignFolder: string | null;
  welcomeSeen: boolean;
  lastVersionSeen: string | null;
}

export type SaveSettings = (settings: PluginSettings) => Promise<void>;

function isCampaignsFolder(saved: unknown): saved is string {
  return typeof saved === "string" && refusalForCampaignsFolder(saved) === null;
}

function isInside(campaignsFolder: string | null, saved: unknown): saved is string {
  return new Fence(() => campaignsFolder).holds(saved);
}

export function settingsOf(saved: unknown): PluginSettings {
  const settings: PluginSettings = { campaignsFolder: null, campaignFolder: null, welcomeSeen: false, lastVersionSeen: null };
  if (typeof saved !== "object" || saved === null) return settings;
  if ("campaignsFolder" in saved && isCampaignsFolder(saved.campaignsFolder)) settings.campaignsFolder = saved.campaignsFolder;
  if ("campaignFolder" in saved && isInside(settings.campaignsFolder, saved.campaignFolder)) settings.campaignFolder = saved.campaignFolder;
  if ("welcomeSeen" in saved && saved.welcomeSeen === true) settings.welcomeSeen = true;
  if ("lastVersionSeen" in saved && typeof saved.lastVersionSeen === "string") settings.lastVersionSeen = saved.lastVersionSeen;
  return settings;
}
