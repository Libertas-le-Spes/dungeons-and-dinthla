import type { Telling } from "../../host/showing/telling";
import type { AskAboutDifference } from "../../kind-notes/watching/differing-notes";

export const FIX = "Fix";
export const KEEP = "Keep";

class DifferenceAsking {
  constructor(private readonly telling: Pick<Telling, "ask">) {}

  ask(message: string, fix: () => void, keepAsItIs: () => void): void {
    this.telling.ask(message, [
      { words: FIX, chosen: fix },
      { words: KEEP, chosen: keepAsItIs },
    ]);
  }
}

export function askInNoticeOf(telling: Pick<Telling, "ask">): AskAboutDifference {
  const asking = new DifferenceAsking(telling);
  return asking.ask.bind(asking);
}
