export interface CampaignChoice {
  folders(): string[];
  chosen(): string | null;
  choose(folder: string): Promise<void>;
}
