import type { Campaign, CoinRecord, Source } from "../../campaign/record/campaign";
import { coinTrackedKind } from "../../kinds/coin-tracked-kind";
import type { KindNoteSource } from "./kind-note-source";

function sourceOfCoin(coin: CoinRecord): Source {
  return coin.source;
}

export const coinNoteSource: KindNoteSource = {
  kind: coinTrackedKind,
  sourcesOf(campaign: Campaign): Source[] {
    return campaign.coins.map(sourceOfCoin);
  },
};
