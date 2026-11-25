export interface CampaignsFolderPlace {
  folderPaths(): string[];
  make(typed: string): Promise<string>;
}
