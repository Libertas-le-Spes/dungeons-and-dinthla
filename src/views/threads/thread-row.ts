import type { SourcedText } from "../../campaign/campaign";
import { sessionLabelOf } from "../../campaign/session-file";
import type { ThreadRecord } from "../../campaign/thread-kind";
import type { FollowUpName } from "../../kinds/follow-up-name";
import { addLinkedText, addRowButton, type LinkActions } from "../lists/linked-text";
import type { ShownThreadKind } from "./shown-thread-kind";
import type { ThreadFact } from "./thread-fact";
import type { ThreadLook, ThreadStatus } from "./thread-look";

function lookOf<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  shown: ShownThreadKind<Thread, Ending, EndingName>,
  thread: Thread,
): ThreadLook {
  const ending = shown.threadKind.endingOf(thread);
  if (ending === null) return shown.openLook;
  return shown.endedLookOf(ending).look;
}

function addMark(row: HTMLElement, look: ThreadLook): void {
  const cls = `dd-mark ${look.markClass}`;
  if (look.label === null) {
    row.createSpan({ cls, text: look.sign });
    return;
  }
  row.createSpan({ cls, text: look.sign, attr: { "aria-label": look.label } });
}

function addFacts(body: HTMLElement, facts: ThreadFact[], keywords: string[], sourcePath: string, actions: LinkActions): void {
  if (facts.length === 0) return;
  const factsEl = body.createSpan({ cls: "dd-facts" });
  for (const fact of facts) {
    const factEl = factsEl.createSpan({ text: `${fact.name} ` });
    addLinkedText(factEl.createEl("b"), fact.value, keywords, sourcePath, actions);
  }
}

function addMeta(body: HTMLElement, status: ThreadStatus | null, sourcePath: string): void {
  const meta = body.createSpan({ cls: "dd-meta" });
  if (status !== null) {
    meta.createSpan({ cls: status.className, text: status.label });
    meta.appendText(" · ");
  }
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
  const look = lookOf(shown, thread);
  const row = addRowButton(list, thread.source, actions);
  addMark(row, look);
  const body = row.createSpan({ cls: "dd-body" });
  addLinkedText(body.createSpan({ cls: look.textClass }), shown.threadKind.textOf(thread), keywords, sourcePath, actions);
  addFacts(body, shown.factsOf(thread), keywords, sourcePath, actions);
  const ending = shown.threadKind.endingOf(thread);
  if (ending !== null) addLinkedText(body.createSpan({ cls: "dd-answer" }), ending.text, keywords, ending.source.path, actions);
  addMeta(body, look.status, sourcePath);
}
