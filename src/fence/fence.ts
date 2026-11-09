import { isSafePath } from "./safe-path";

export const OUTSIDE_FENCE = "it is outside the Campaigns folder, and Dungeons & Dinthla only works inside that folder.";

export type CampaignsFolderPath = () => string | null;

export class Fence {
  constructor(private readonly campaignsFolder: CampaignsFolderPath) {}

  holds(path: unknown): path is string {
    const folder = this.safeFolder();
    if (folder === null || !isSafePath(path)) return false;
    return path.startsWith(`${folder}/`);
  }

  isTheFolder(path: unknown): path is string {
    const folder = this.safeFolder();
    if (folder === null || !isSafePath(path)) return false;
    return path === folder;
  }

  private safeFolder(): string | null {
    const folder = this.campaignsFolder();
    if (!isSafePath(folder)) return null;
    return folder;
  }
}
