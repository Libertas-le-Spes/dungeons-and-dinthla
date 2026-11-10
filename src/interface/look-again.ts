export interface LookAgainNeeds {
  startingCampaignFolder(): string | null;
  closeCampaign(): void;
  chooseCampaign(folder: string): Promise<void>;
  showBackgrounds(): void;
  showCampaignTabsAgain(): void;
}

async function openStartingCampaign(needs: LookAgainNeeds): Promise<void> {
  const folder = needs.startingCampaignFolder();
  if (folder === null) needs.closeCampaign();
  else await needs.chooseCampaign(folder);
}

export async function lookAgain(needs: LookAgainNeeds): Promise<void> {
  try {
    await openStartingCampaign(needs);
  } finally {
    needs.showBackgrounds();
    needs.showCampaignTabsAgain();
  }
}
