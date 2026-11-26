import { ButtonComponent, Notice } from "obsidian";
import type { Telling, TellingChoice } from "../../../host/showing/telling";
import { NOTICE_STAYS_UNTIL_DISMISSED } from "../../../views/dialogs/notice-stays";

class NoticeChoice {
  constructor(
    private readonly notice: Notice,
    private readonly choice: TellingChoice,
  ) {}

  press(): void {
    this.choice.chosen();
    this.notice.hide();
  }
}

class ObsidianTelling implements Telling {
  say(words: string): void {
    new Notice(words);
  }

  sayUntilDismissed(words: string): void {
    new Notice(words, NOTICE_STAYS_UNTIL_DISMISSED);
  }

  ask(words: string, choices: readonly TellingChoice[]): void {
    const notice = new Notice("", NOTICE_STAYS_UNTIL_DISMISSED);
    notice.messageEl.createSpan({ text: `${words} ` });
    for (const choice of choices) {
      const press = new NoticeChoice(notice, choice);
      new ButtonComponent(notice.messageEl).setButtonText(choice.words).onClick(press.press.bind(press));
    }
  }
}

export const OBSIDIAN_TELLING: Telling = new ObsidianTelling();
