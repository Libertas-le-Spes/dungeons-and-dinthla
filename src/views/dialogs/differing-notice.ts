import { ButtonComponent, Notice } from "obsidian";
import { NOTICE_STAYS_UNTIL_DISMISSED } from "./notice-stays";
import type { AskAboutDifference } from "../../kind-notes/watching/differing-notes";

export const FIX = "Fix";
export const KEEP = "Keep";

function addChoice(notice: Notice, text: string, choose: () => void): void {
  new ButtonComponent(notice.messageEl).setButtonText(text).onClick(() => {
    choose();
    notice.hide();
  });
}

export const askInNotice: AskAboutDifference = (message, fix, keepAsItIs) => {
  const notice = new Notice("", NOTICE_STAYS_UNTIL_DISMISSED);
  notice.messageEl.createSpan({ text: `${message} ` });
  addChoice(notice, FIX, fix);
  addChoice(notice, KEEP, keepAsItIs);
  return notice.hide.bind(notice);
};
