import type { TFile } from "obsidian";
import { AskAlways, AskWhenLeftPlay, type AskWhen } from "./ask-when";
import { MainModal } from "./main-modal";
import { plainWordsOf } from "../writes/write-words";
import type { OfferWiring } from "./offer-wiring";
import { questionFor } from "./question-for";
import { diedQuestionFor } from "./died-question-for";
import type { MainQuestion } from "./main-question";
import { COULD_NOT_ASK, NOTE_MOVED } from "../switching/switch-words";

class FocusBack {
  constructor(private readonly returnFocus: () => void) {}

  closed(): void {
    this.returnFocus();
  }
}

type AskedQuestion = (wiring: OfferWiring, note: TFile) => Promise<MainQuestion | null>;

function stayPut(): void {
  return;
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

  async died(path: string, returnFocus: () => void): Promise<void> {
    const file = this.wiring.files.getFileByPath(path);
    if (file === null) {
      this.wiring.tell(NOTE_MOVED);
      returnFocus();
      return;
    }
    await this.askWith(file, returnFocus, diedQuestionFor);
  }

  private async ask(file: TFile, returnFocus: () => void, when: AskWhen): Promise<void> {
    const questionAbout = async (wiring: OfferWiring, note: TFile): Promise<MainQuestion | null> => {
      if (await when.wants(wiring.files, note)) return questionFor(wiring, note);
      return null;
    };
    await this.askWith(file, returnFocus, questionAbout);
  }

  private async askWith(file: TFile, returnFocus: () => void, questionAbout: AskedQuestion): Promise<void> {
    let question: MainQuestion | null = null;
    try {
      question = await questionAbout(this.wiring, file);
    } catch (error) {
      this.wiring.tell(plainWordsOf(error, COULD_NOT_ASK));
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
