import { isInConfigFolder, refusalForCampaignsFolder } from "./campaigns-folder-path";
import { isSafeNewPath, isSafePath } from "./safe-path";

export const OUTSIDE_FENCE = "it is outside the Campaigns folder, and Dungeons & Dinthla only works inside that folder.";

export type ReadCampaignsFolder = () => string | null;

export class Fence {
  constructor(
    private readonly readCampaignsFolder: ReadCampaignsFolder,
    private readonly configDir: string,
  ) {}

  holds(path: unknown): path is string {
    const folder = this.safeFolder();
    if (folder === null || !isSafePath(path)) return false;
    return path.startsWith(`${folder}/`);
  }

  holdsNew(path: unknown): path is string {
    return this.holds(path) && isSafeNewPath(path);
  }

  isTheFolder(path: unknown): path is string {
    const folder = this.safeFolder();
    if (folder === null || !isSafePath(path)) return false;
    return path === folder;
  }

  private safeFolder(): string | null {
    const folder = this.readCampaignsFolder();
    if (folder === null || refusalForCampaignsFolder(folder) !== null) return null;
    if (isInConfigFolder(folder, this.configDir)) return null;
    return folder;
  }
}
