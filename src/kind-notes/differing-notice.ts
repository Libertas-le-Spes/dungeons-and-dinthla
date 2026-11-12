import { ButtonComponent, Notice } from "obsidian";
import type { AskAboutDifference } from "./differing-notes";

const STAYS_UNTIL_DISMISSED = 0;
export const FIX = "Fix";
export const KEEP = "Keep";

function addChoice(notice: Notice, text: string, choose: () => void): void {
  new ButtonComponent(notice.messageEl).setButtonText(text).onClick(() => {
    choose();
    notice.hide();
  });
}

export const askInNotice: AskAboutDifference = (message, fix, keepAsItIs) => {
  const notice = new Notice("", STAYS_UNTIL_DISMISSED);
  notice.messageEl.createSpan({ text: `${message} ` });
  addChoice(notice, FIX, fix);
  addChoice(notice, KEEP, keepAsItIs);
};
