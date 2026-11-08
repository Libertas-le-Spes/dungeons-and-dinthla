export interface PluginSettings {
  campaignFolder: string | null;
}

export function settingsOf(saved: unknown): PluginSettings {
  const settings: PluginSettings = { campaignFolder: null };
  if (typeof saved !== "object" || saved === null) return settings;
  if ("campaignFolder" in saved && typeof saved.campaignFolder === "string") settings.campaignFolder = saved.campaignFolder;
  return settings;
}
