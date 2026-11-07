function topFolderOf(path: string): string | null {
  const slash = path.indexOf("/");
  if (slash === -1) return null;
  return path.slice(0, slash);
}

export function findCampaignFolders(paths: string[]): string[] {
  const folders = new Set<string>();
  for (const path of paths) {
    const folder = topFolderOf(path);
    if (folder !== null && path === `${folder}/${folder}.md`) folders.add(folder);
  }
  return [...folders].sort();
}

export function campaignFolderOf(path: string, campaignFolders: string[]): string | null {
  const folder = topFolderOf(path);
  if (folder === null || !campaignFolders.includes(folder)) return null;
  return folder;
}
