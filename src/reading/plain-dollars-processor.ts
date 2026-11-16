import type { MarkdownPostProcessorContext } from "obsidian";
import { NoteLines } from "./note-lines";
import { showDollarsPlain } from "./plain-dollars";

export const BEFORE_OBSIDIANS_MATHS = -100;

export type IsCampaignNote = (path: string) => boolean;

export type PlainDollarsProcessor = (element: HTMLElement, context: MarkdownPostProcessorContext) => void;

class PlainDollars {
  private readonly noteLines = new NoteLines();

  constructor(private readonly isCampaignNote: IsCampaignNote) {}

  show(element: HTMLElement, context: MarkdownPostProcessorContext): void {
    if (!this.isCampaignNote(context.sourcePath)) return;
    showDollarsPlain(element, context, this.noteLines);
  }
}

export function plainDollarsProcessor(isCampaignNote: IsCampaignNote): PlainDollarsProcessor {
  const plain = new PlainDollars(isCampaignNote);
  return plain.show.bind(plain);
}
