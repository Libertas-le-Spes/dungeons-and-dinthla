import { readFollowUp, type FollowUp } from "../../notes/reading/follow-up";
import { readItemChange } from "../../notes/reading/item-change";
import { readLedgerEntry } from "../../notes/reading/ledger";
import { findLinks } from "../../notes/parts/link";
import { readMarker } from "../../notes/reading/marker";
import type { Campaign, CoinRecord, SessionNote, Source, SourcedText } from "../record/campaign";
import { ItemBook } from "../record/item-book";
import { questThreadKind } from "../threads/quest-thread-kind";
import { questionThreadKind } from "../threads/question-thread-kind";
import { forEachSessionLine } from "../record/session-lines";
import { ThreadBook } from "../threads/thread-book";

class CampaignBuilder {
  private readonly questionBook = new ThreadBook(questionThreadKind);
  private readonly questBook = new ThreadBook(questThreadKind);
  private readonly coins: CoinRecord[] = [];
  private readonly itemBook = new ItemBook();
  private readonly unmatched: SourcedText[] = [];

  addLine(line: string, source: Source): void {
    const followUp = readFollowUp(line);
    if (followUp !== null) {
      this.addFollowUp(followUp, line, source);
      return;
    }
    const change = readItemChange(line);
    if (change !== null) {
      this.itemBook.change(change, source);
      if (change.sale !== undefined) this.coins.push({ entry: change.sale, text: change.text, source, isSale: true, links: findLinks(change.text) });
      return;
    }
    this.addMarked(line, source);
  }

  build(): Campaign {
    const purseCopper = this.coins.reduce((sum, coin) => sum + coin.entry.copper, 0);
    return {
      questions: this.questionBook.records,
      quests: this.questBook.records,
      coins: this.coins,
      items: this.itemBook.items,
      purseCopper,
      unmatched: this.unmatched,
    };
  }

  private addMarked(line: string, source: Source): void {
    const { marker, body } = readMarker(line);
    this.questionBook.addOpening(marker, body, source);
    this.questBook.addOpening(marker, body, source);
    if (marker === "ledger") this.addLedgerEntry(body, source);
  }

  private addFollowUp(followUp: FollowUp, line: string, source: Source): void {
    const taken = [this.questionBook.addFollowUp(followUp, source), this.questBook.addFollowUp(followUp, source)];
    if (!taken.includes(true)) this.unmatched.push({ text: line.trim(), source });
  }

  private addLedgerEntry(body: string, source: Source): void {
    const entry = readLedgerEntry(body);
    if (entry?.type === "coin") this.coins.push({ entry, text: body, source, isSale: false, links: findLinks(body) });
    if (entry?.type === "item") this.itemBook.mention({ item: entry.item, holder: entry.holder, links: entry.links, source });
  }
}

export function buildCampaign(sessions: SessionNote[]): Campaign {
  const builder = new CampaignBuilder();
  forEachSessionLine(sessions, (line, source) => builder.addLine(line, source));
  return builder.build();
}
