export interface PluginSettings {
  campaignFolder: string | null;
  drafts: Record<string, string>;
}

function draftsIn(saved: object): Record<string, string> {
  const drafts: Record<string, string> = {};
  if (!("drafts" in saved) || typeof saved.drafts !== "object" || saved.drafts === null) return drafts;
  for (const [path, text] of Object.entries(saved.drafts)) {
    if (typeof text === "string" && text !== "") drafts[path] = text;
  }
  return drafts;
}

export function settingsOf(saved: unknown): PluginSettings {
  const settings: PluginSettings = { campaignFolder: null, drafts: {} };
  if (typeof saved !== "object" || saved === null) return settings;
  if ("campaignFolder" in saved && typeof saved.campaignFolder === "string") settings.campaignFolder = saved.campaignFolder;
  settings.drafts = draftsIn(saved);
  return settings;
}
