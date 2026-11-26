import { isInConfigFolder, refusalForCampaignsFolder } from "./campaigns-folder-path";
import type { PathSpelling } from "../../host/rules/path-spelling";
import { isSafeNewPath, isSafePath } from "./safe-path";

export const OUTSIDE_FENCE = "it is outside the Campaigns folder, and Dungeons & Dinthla only works inside that folder.";

export const NOT_WRITTEN_AS_OBSIDIAN_WRITES = "Rename the folder in Obsidian: its name isn't written the way Obsidian writes names.";

export type ReadCampaignsFolder = () => string | null;

function safeFolderOf(campaignsFolder: string | null, configDir: string): string | null {
  if (campaignsFolder === null || refusalForCampaignsFolder(campaignsFolder) !== null) return null;
  if (isInConfigFolder(campaignsFolder, configDir)) return null;
  return campaignsFolder;
}

export function isInsideCampaignsFolder(campaignsFolder: string | null, configDir: string, path: unknown): path is string {
  const folder = safeFolderOf(campaignsFolder, configDir);
  if (folder === null || !isSafePath(path)) return false;
  return path.startsWith(`${folder}/`);
}

export class Fence {
  constructor(
    private readonly readCampaignsFolder: ReadCampaignsFolder,
    private readonly configDir: string,
    private readonly spelling: PathSpelling,
  ) {}

  holds(path: unknown): path is string {
    return isInsideCampaignsFolder(this.readCampaignsFolder(), this.configDir, path);
  }

  holdsNew(path: unknown): path is string {
    return this.holds(path) && isSafeNewPath(path, this.spelling);
  }

  isTheFolder(path: unknown): path is string {
    const folder = this.safeFolder();
    if (folder === null || !isSafePath(path)) return false;
    return path === folder;
  }

  private safeFolder(): string | null {
    return safeFolderOf(this.readCampaignsFolder(), this.configDir);
  }
}
