export interface PluginSettings {
  campaignFolder: string | null;
  welcomeSeen: boolean;
  lastVersionSeen: string | null;
}

export type SaveSettings = (settings: PluginSettings) => Promise<void>;

export function settingsOf(saved: unknown): PluginSettings {
  const settings: PluginSettings = { campaignFolder: null, welcomeSeen: false, lastVersionSeen: null };
  if (typeof saved !== "object" || saved === null) return settings;
  if ("campaignFolder" in saved && typeof saved.campaignFolder === "string") settings.campaignFolder = saved.campaignFolder;
  if ("welcomeSeen" in saved && saved.welcomeSeen === true) settings.welcomeSeen = true;
  if ("lastVersionSeen" in saved && typeof saved.lastVersionSeen === "string") settings.lastVersionSeen = saved.lastVersionSeen;
  return settings;
}
