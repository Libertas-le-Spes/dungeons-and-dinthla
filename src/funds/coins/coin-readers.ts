import { readCoinDraft, readHeldCoinDraft, type CoinDraft, type CoinHolder, type CoinReading } from "../../notes/writing/coin-lines";

export interface CoinReader {
  readingOf(draft: CoinDraft): CoinReading;
  addsWords(writesTo: string): string;
}

export class PartyCoinReader implements CoinReader {
  readingOf(draft: CoinDraft): CoinReading {
    return readCoinDraft(draft);
  }

  addsWords(writesTo: string): string {
    return `Adds a line to ${writesTo}.`;
  }
}

export class HeldCoinReader implements CoinReader {
  constructor(private readonly holder: CoinHolder) {}

  readingOf(draft: CoinDraft): CoinReading {
    return readHeldCoinDraft(draft, this.holder);
  }

  addsWords(writesTo: string): string {
    return `Adds a line for ${this.holder.name} to ${writesTo}.`;
  }
}

export const PARTY_COIN = new PartyCoinReader();
