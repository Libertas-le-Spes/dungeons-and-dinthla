import type { QuestionRecord, Source } from "../campaign/campaign";
import { sessionLabelOf } from "../campaign/session-file";
import { textRunsOf, type MarkedPiece } from "./text-parts";

export interface QuestionActions {
  openSource(source: Source): void;
  openLink(linktext: string, sourcePath: string): void;
}

function addPieces(parent: HTMLElement, pieces: MarkedPiece[]): void {
  for (const piece of pieces) {
    if (piece.marked) parent.createEl("mark", { text: piece.text });
    else parent.appendText(piece.text);
  }
}

function addLink(parent: HTMLElement, linktext: string, sourcePath: string, actions: QuestionActions): HTMLElement {
  const link = parent.createSpan({ cls: "dd-link" });
  link.createSpan({ cls: "dd-link-bracket", text: "[[" });
  const name = link.createEl("a", { cls: "internal-link", href: linktext, attr: { "data-href": linktext } });
  link.createSpan({ cls: "dd-link-bracket", text: "]]" });
  name.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    actions.openLink(linktext, sourcePath);
  });
  return name;
}

function addText(parent: HTMLElement, text: string, keywords: string[], sourcePath: string, actions: QuestionActions): void {
  for (const run of textRunsOf(text, keywords)) {
    if (run.linktext === null) addPieces(parent, run.pieces);
    else addPieces(addLink(parent, run.linktext, sourcePath, actions), run.pieces);
  }
}

function addMark(row: HTMLElement, question: QuestionRecord): void {
  if (question.answer === null) {
    row.createSpan({ cls: "dd-mark", text: "?" });
    return;
  }
  row.createSpan({ cls: "dd-mark", text: "✓", attr: { "aria-label": "Answered" } });
}

export function addQuestionRow(
  list: HTMLElement,
  question: QuestionRecord,
  keywords: string[],
  actions: QuestionActions,
): void {
  const row = list.createEl("li").createDiv({ cls: "dd-row", attr: { role: "button", tabindex: "0" } });
  addMark(row, question);
  const body = row.createSpan({ cls: "dd-body" });
  addText(body.createSpan({ cls: "dd-text" }), question.text, keywords, question.source.path, actions);
  if (question.answer !== null) {
    const answer = body.createSpan({ cls: "dd-answer" });
    addText(answer, question.answer.text, keywords, question.answer.source.path, actions);
  }
  body.createSpan({ cls: "dd-meta", text: sessionLabelOf(question.source.path) });
  row.addEventListener("click", () => actions.openSource(question.source));
  row.addEventListener("keydown", (event) => {
    if (event.target !== row) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    actions.openSource(question.source);
  });
}
