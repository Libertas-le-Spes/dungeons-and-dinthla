import type { QuestRecord, QuestStatus } from "../campaign/campaign";
import { sessionLabelOf } from "../campaign/session-file";
import { addLinkedText, addRowButton, type LinkActions } from "../views/linked-text";

const STATUS_WORDS: Record<QuestStatus, string> = { completed: "Completed", failed: "Abandoned" };

function addMark(row: HTMLElement, record: QuestRecord): void {
  if (record.outcome === null) {
    row.createSpan({ cls: "dd-mark dd-mark-quest", text: "!" });
    return;
  }
  const label = STATUS_WORDS[record.outcome.status];
  if (record.outcome.status === "completed") {
    row.createSpan({ cls: "dd-mark dd-mark-quest", text: "✓", attr: { "aria-label": label } });
    return;
  }
  row.createSpan({ cls: "dd-mark dd-mark-gone", text: "✕", attr: { "aria-label": label } });
}

function addFact(facts: HTMLElement, name: string, value: string | undefined, sourcePath: string, actions: LinkActions, keywords: string[]): void {
  if (value === undefined) return;
  const fact = facts.createSpan({ text: `${name} ` });
  addLinkedText(fact.createEl("b"), value, keywords, sourcePath, actions);
}

function addMeta(body: HTMLElement, record: QuestRecord): void {
  const meta = body.createSpan({ cls: "dd-meta" });
  if (record.outcome !== null) {
    const status = meta.createSpan({ cls: "dd-status", text: STATUS_WORDS[record.outcome.status] });
    if (record.outcome.status === "completed") status.addClass("dd-status-done");
    meta.appendText(" · ");
  }
  meta.appendText(sessionLabelOf(record.source.path));
}

export function addQuestRow(list: HTMLElement, record: QuestRecord, keywords: string[], actions: LinkActions): void {
  const sourcePath = record.source.path;
  const row = addRowButton(list, record.source, actions);
  addMark(row, record);
  const body = row.createSpan({ cls: "dd-body" });
  const title = body.createSpan({ cls: "dd-text dd-title-line" });
  if (record.outcome !== null && record.outcome.status === "failed") title.addClass("dd-gone");
  addLinkedText(title, record.quest.title, keywords, sourcePath, actions);
  const facts = body.createSpan({ cls: "dd-facts" });
  addFact(facts, "From", record.quest.givenBy, sourcePath, actions, keywords);
  addFact(facts, "Reward", record.quest.reward, sourcePath, actions, keywords);
  if (record.outcome !== null) {
    addLinkedText(body.createSpan({ cls: "dd-answer" }), record.outcome.text, keywords, record.outcome.source.path, actions);
  }
  addMeta(body, record);
}
