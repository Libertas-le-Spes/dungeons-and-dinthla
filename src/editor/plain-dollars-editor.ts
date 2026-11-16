import type { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { editorInfoField } from "obsidian";

const PLAIN_DOLLARS = "dd-plain-dollars";

export type IsCampaignNote = (path: string) => boolean;

export type EditorClass = Record<string, string>;

export function plainDollarsClassOf(state: EditorState, isCampaignNote: IsCampaignNote): EditorClass | null {
  const info = state.field(editorInfoField, false);
  if (info === undefined || info.file === null) return null;
  if (!isCampaignNote(info.file.path)) return null;
  return { class: PLAIN_DOLLARS };
}

class PlainDollars {
  constructor(private readonly isCampaignNote: IsCampaignNote) {}

  classOf(view: EditorView): EditorClass | null {
    return plainDollarsClassOf(view.state, this.isCampaignNote);
  }
}

export function plainDollarsIn(isCampaignNote: IsCampaignNote) {
  const plain = new PlainDollars(isCampaignNote);
  return EditorView.editorAttributes.of(plain.classOf.bind(plain));
}
