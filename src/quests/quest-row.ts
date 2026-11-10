import type { QuestRecord, QuestStatus } from "../campaign/campaign";
import { sessionLabelOf } from "../campaign/session-file";
import { addLinkedText, addRowButton, type LinkActions } from "../views/linked-text";

const STATUS_WORDS: Record<QuestStatus, string> = { completed: "Completed", failed: "Abandoned" };

function addMark(row: HTMLElement, record: QuestRecord): void {
  if (record.closing === null) {
    row.createSpan({ cls: "dd-mark dd-mark-quest", text: "!" });
    return;
  }
  const label = STATUS_WORDS[record.closing.status];
  if (record.closing.status === "completed") {
    row.createSpan({ cls: "dd-mark dd-mark-quest", text: "✓", attr: { "aria-label": label } });
    return;
  }
  row.createSpan({ cls: "dd-mark dd-mark-abandoned", text: "✕", attr: { "aria-label": label } });
}

function addFact(facts: HTMLElement, name: string, value: string | undefined, keywords: string[], sourcePath: string, actions: LinkActions): void {
  if (value === undefined) return;
  const fact = facts.createSpan({ text: `${name} ` });
  addLinkedText(fact.createEl("b"), value, keywords, sourcePath, actions);
}

function addFacts(body: HTMLElement, record: QuestRecord, keywords: string[], actions: LinkActions): void {
  const { givenBy, reward } = record;
  if (givenBy === undefined && reward === undefined) return;
  const facts = body.createSpan({ cls: "dd-facts" });
  addFact(facts, "From", givenBy, keywords, record.source.path, actions);
  addFact(facts, "Reward", reward, keywords, record.source.path, actions);
}

function addMeta(body: HTMLElement, record: QuestRecord): void {
  const meta = body.createSpan({ cls: "dd-meta" });
  if (record.closing !== null) {
    const status = meta.createSpan({ cls: "dd-status", text: STATUS_WORDS[record.closing.status] });
    if (record.closing.status === "completed") status.addClass("dd-status-completed");
    meta.appendText(" · ");
  }
  meta.appendText(sessionLabelOf(record.source.path));
}

export function addQuestRow(list: HTMLElement, record: QuestRecord, keywords: string[], actions: LinkActions): void {
  const sourcePath = record.source.path;
  const row = addRowButton(list, record.source, actions);
  addMark(row, record);
  const body = row.createSpan({ cls: "dd-body" });
  const title = body.createSpan({ cls: "dd-text" });
  if (record.closing !== null && record.closing.status === "failed") title.addClass("dd-abandoned");
  addLinkedText(title, record.text, keywords, sourcePath, actions);
  addFacts(body, record, keywords, actions);
  if (record.closing !== null) {
    addLinkedText(body.createSpan({ cls: "dd-answer" }), record.closing.text, keywords, record.closing.source.path, actions);
  }
  addMeta(body, record);
}
