import { Notice } from "obsidian";
import type { Telling } from "../../../host/showing/telling";
import { NOTICE_STAYS_UNTIL_DISMISSED } from "../../../views/dialogs/notice-stays";

class ObsidianTelling implements Telling {
  say(words: string): void {
    new Notice(words);
  }

  sayUntilDismissed(words: string): void {
    new Notice(words, NOTICE_STAYS_UNTIL_DISMISSED);
  }
}

export const OBSIDIAN_TELLING: Telling = new ObsidianTelling();
