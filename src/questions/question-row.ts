import type { QuestionRecord, Source } from "../campaign/campaign";
import { sessionLabelOf } from "../campaign/session-file";
import { textPartsOf, type TextPart } from "./text-parts";

export interface QuestionActions {
  openSource(source: Source): void;
  openLink(target: string, sourcePath: string): void;
}

function addLink(parent: HTMLElement, target: string, sourcePath: string, actions: QuestionActions): HTMLElement {
  const link = parent.createSpan({ cls: "dd-link" });
  link.createSpan({ cls: "dd-link-bracket", text: "[[" });
  const name = link.createEl("a", { cls: "internal-link", href: target, attr: { "data-href": target } });
  link.createSpan({ cls: "dd-link-bracket", text: "]]" });
  name.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    actions.openLink(target, sourcePath);
  });
  return name;
}

function addText(parent: HTMLElement, part: TextPart): void {
  if (part.marked) {
    parent.createEl("mark", { text: part.text });
    return;
  }
  parent.appendText(part.text);
}

function addParts(parent: HTMLElement, text: string, keywords: string[], sourcePath: string, actions: QuestionActions): void {
  let linkName: HTMLElement | null = null;
  let linkTarget: string | null = null;
  for (const part of textPartsOf(text, keywords)) {
    if (part.link === null) {
      linkName = null;
      linkTarget = null;
      addText(parent, part);
      continue;
    }
    if (linkName === null || part.link !== linkTarget) {
      linkName = addLink(parent, part.link, sourcePath, actions);
      linkTarget = part.link;
    }
    addText(linkName, part);
  }
}

function addMark(row: HTMLElement, question: QuestionRecord): void {
  const mark = row.createSpan({ cls: "dd-mark", text: "?" });
  if (question.answer === null) return;
  mark.setText("✓");
  mark.addClass("dd-mark-answered");
  mark.setAttr("aria-label", "Answered");
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
  addParts(body.createSpan({ cls: "dd-text" }), question.text, keywords, question.source.path, actions);
  if (question.answer !== null) {
    const answer = body.createSpan({ cls: "dd-answer" });
    addParts(answer, question.answer.text, keywords, question.answer.source.path, actions);
  }
  body.createSpan({ cls: "dd-meta", text: sessionLabelOf(question.source.path) });
  row.addEventListener("click", () => actions.openSource(question.source));
  row.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    actions.openSource(question.source);
  });
}
