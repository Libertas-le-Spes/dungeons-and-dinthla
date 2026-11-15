import type { Campaign } from "../../campaign/record/campaign";
import { ownLinkOf } from "../items/own-link";
import { summariseFunds, type FundsSummary } from "./funds-summary";

export interface OwnFundsParts {
  campaign: Campaign;
  ownNames: readonly string[];
}

export interface WhoseFunds {
  mine: FundsSummary;
  party: FundsSummary;
}

export function whoseFunds({ campaign, ownNames }: OwnFundsParts): WhoseFunds {
  const isMine = (links: readonly string[]): boolean => ownLinkOf({ links, ownNames }) !== undefined;
  return {
    mine: summariseFunds({ ...campaign, coins: campaign.coins.filter((coin) => isMine(coin.links)) }),
    party: summariseFunds({ ...campaign, coins: campaign.coins.filter((coin) => !isMine(coin.links)) }),
  };
}
