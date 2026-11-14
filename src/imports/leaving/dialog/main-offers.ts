import type { TFile } from "obsidian";
import { Refusal } from "../../../beyond/shape/refusal";
import { AskAlways, AskWhenLeftPlay, type AskWhen } from "./ask-when";
import { MainModal } from "./main-modal";
import type { OfferWiring } from "./offer-wiring";
import { questionFor } from "./question-for";
import type { MainQuestion } from "./main-question";
import { COULD_NOT_ASK, NOTE_MOVED } from "../switching/switch-words";

class FocusBack {
  constructor(private readonly returnFocus: () => void) {}

  closed(): void {
    this.returnFocus();
  }
}

function stayPut(): void {
  return;
}

function plainWordsOf(error: unknown): string {
  if (error instanceof Refusal) return error.message;
  return COULD_NOT_ASK;
}

export class MainOffers {
  constructor(private readonly wiring: OfferWiring) {}

  async afterImport(path: string): Promise<void> {
    const file = this.wiring.files.getFileByPath(path);
    if (file === null) return;
    await this.ask(file, stayPut, new AskAlways());
  }

  async afterUpdate(path: string): Promise<void> {
    const file = this.wiring.files.getFileByPath(path);
    if (file === null) return;
    await this.ask(file, stayPut, new AskWhenLeftPlay());
  }

  async makeMain(path: string, returnFocus: () => void): Promise<void> {
    const file = this.wiring.files.getFileByPath(path);
    if (file === null) {
      this.wiring.tell(NOTE_MOVED);
      returnFocus();
      return;
    }
    await this.ask(file, returnFocus, new AskAlways());
  }

  private async ask(file: TFile, returnFocus: () => void, when: AskWhen): Promise<void> {
    let question: MainQuestion | null = null;
    try {
      if (await when.wants(this.wiring.files, file)) question = await questionFor(this.wiring, file);
    } catch (error) {
      this.wiring.tell(plainWordsOf(error));
      returnFocus();
      return;
    }
    if (question === null) {
      returnFocus();
      return;
    }
    const back = new FocusBack(returnFocus);
    new MainModal(this.wiring.app, question, back.closed.bind(back)).open();
  }
}
