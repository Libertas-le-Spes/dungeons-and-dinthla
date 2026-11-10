import type { SourcedText } from "../campaign/campaign";
import { sessionLabelOf } from "../campaign/session-file";
import type { ThreadRecord } from "../campaign/thread-kind";
import type { FollowUpName } from "../kinds/follow-up-name";
import type { LineState } from "./line-state";
import { addLinkedText, addRowButton, type LinkActions } from "./linked-text";
import type { ShownThreadKind, ThreadFact } from "./shown-thread-kind";
import { threadStateOf } from "./thread-state";

const STRUCK_MARK_CLASS = "dd-mark-abandoned";

function endedMarkClassOf(markClass: string, state: LineState): string {
  if (state.struck) return STRUCK_MARK_CLASS;
  return markClass;
}

function addMark<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  row: HTMLElement,
  shown: ShownThreadKind<Thread, Ending, EndingName>,
  state: LineState | null,
): void {
  if (state === null) {
    row.createSpan({ cls: `dd-mark ${shown.markClass}`, text: shown.kind.tracked.marker.symbol });
    return;
  }
  row.createSpan({ cls: `dd-mark ${endedMarkClassOf(shown.markClass, state)}`, text: state.sign, attr: { "aria-label": state.label } });
}

function addFacts(body: HTMLElement, facts: ThreadFact[], keywords: string[], sourcePath: string, actions: LinkActions): void {
  if (facts.length === 0) return;
  const shownFacts = body.createSpan({ cls: "dd-facts" });
  for (const fact of facts) {
    const shownFact = shownFacts.createSpan({ text: `${fact.name} ` });
    addLinkedText(shownFact.createEl("b"), fact.value, keywords, sourcePath, actions);
  }
}

function addStatus(meta: HTMLElement, state: LineState): void {
  const status = meta.createSpan({ cls: "dd-status", text: state.label });
  if (!state.struck) status.addClass("dd-status-completed");
  meta.appendText(" · ");
}

function addMeta(body: HTMLElement, showsState: boolean, state: LineState | null, sourcePath: string): void {
  const meta = body.createSpan({ cls: "dd-meta" });
  if (showsState && state !== null) addStatus(meta, state);
  meta.appendText(sessionLabelOf(sourcePath));
}

export function addThreadRow<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  shown: ShownThreadKind<Thread, Ending, EndingName>,
  list: HTMLElement,
  thread: Thread,
  keywords: string[],
  actions: LinkActions,
): void {
  const sourcePath = thread.source.path;
  const state = threadStateOf(shown, thread);
  const row = addRowButton(list, thread.source, actions);
  addMark(row, shown, state);
  const body = row.createSpan({ cls: "dd-body" });
  const text = body.createSpan({ cls: "dd-text" });
  if (state !== null && state.struck) text.addClass("dd-abandoned");
  addLinkedText(text, shown.kind.textOf(thread), keywords, sourcePath, actions);
  addFacts(body, shown.factsOf(thread), keywords, sourcePath, actions);
  const ending = shown.kind.endingOf(thread);
  if (ending !== null) addLinkedText(body.createSpan({ cls: "dd-answer" }), ending.text, keywords, ending.source.path, actions);
  addMeta(body, shown.showsStateInMeta, state, sourcePath);
}
