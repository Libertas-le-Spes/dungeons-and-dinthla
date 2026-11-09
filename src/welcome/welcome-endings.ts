import { CampaignEnding } from "./campaign-ending";
import { CampaignsFolderEnding } from "./campaigns-folder-ending";
import { FirstSessionEnding } from "./first-session-ending";
import { NewCampaignEnding } from "./new-campaign-ending";
import type { WelcomeEnding, WelcomeState } from "./welcome-ending";

const ENDINGS: WelcomeEnding[] = [CampaignsFolderEnding, NewCampaignEnding, FirstSessionEnding, CampaignEnding];

export function endingFor(state: WelcomeState): WelcomeEnding {
  const ending = ENDINGS.find((candidate) => candidate.fits(state));
  if (ending === undefined) throw new Error("The welcome page has no ending for this campaign.");
  return ending;
}
