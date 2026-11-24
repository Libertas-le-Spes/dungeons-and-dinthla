import type { LinkLookup } from "../../host/notes/link-lookup";
import type { NoteRef } from "../../host/notes/note-ref";
import { HeldCoinReader, PARTY_COIN, type CoinReader } from "./coin-readers";

export type CoinLinks = Pick<LinkLookup, "linkTextTo">;

export interface CoinSide {
  readerIn(sessionPath: string, links: CoinLinks): CoinReader | null;
}

export class PartySide implements CoinSide {
  readerIn(): CoinReader {
    return PARTY_COIN;
  }
}

export class MineSide implements CoinSide {
  constructor(private readonly inPlay: () => NoteRef | null) {}

  readerIn(sessionPath: string, links: CoinLinks): CoinReader | null {
    const character = this.inPlay();
    if (character === null) return null;
    return new HeldCoinReader({ linktext: links.linkTextTo(character, sessionPath, true), name: character.basename });
  }
}

export const PARTY_SIDE = new PartySide();
