import type { SourcedText } from "../../../campaign/record/campaign";
import { sessionLabelOf } from "../../../campaign/paths/session-file";
import type { ThreadRecord } from "../../../campaign/threads/thread-kind";
import type { FollowUpName } from "../../../kinds/follow-up-name";
import type { LinkOpener } from "../../components/rows/link-name";
import { LinkedText } from "../../components/rows/linked-text";
import { SourceRow } from "../../components/rows/source-row";
import type { PageAction } from "../../elements/bindings/page-action";
import { Bold, ListItem, PlainText, Span } from "../../elements/kinds/containers";
import type { ViewElement } from "../../elements/view-element";
import type { ShownThreadKind } from "../shown-thread-kind";
import type { ThreadFact } from "../thread-fact";
import type { ThreadLook, ThreadStatus } from "../thread-look";

function classesOf(spaced: string): string[] {
  return spaced.split(" ");
}

function markOf(look: ThreadLook): ViewElement {
  const cls = ["dd-mark", look.markClass];
  if (look.label === null) return new Span({ cls, text: look.sign });
  return new Span({ cls, text: look.sign, label: look.label });
}

function metaOf(status: ThreadStatus | null, sourcePath: string): ViewElement {
  const inside: ViewElement[] = [];
  if (status !== null) inside.push(new Span({ cls: classesOf(status.className), text: status.label }), new PlainText(" · "));
  inside.push(new PlainText(sessionLabelOf(sourcePath)));
  return new Span({ cls: ["dd-meta"] }, inside);
}

export class ThreadRow<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName> {
  constructor(
    private readonly shown: ShownThreadKind<Thread, Ending, EndingName>,
    private readonly keywords: string[],
    private readonly opener: LinkOpener,
  ) {}

  build(thread: Thread, open: PageAction): ListItem {
    const look = this.lookOf(thread);
    const sourcePath = thread.source.path;
    const linked = new LinkedText(this.keywords, sourcePath, this.opener);
    const body: ViewElement[] = [new Span({ cls: classesOf(look.textClass) }, linked.build(this.shown.threadKind.textOf(thread)))];
    body.push(...this.factsOf(this.shown.factsOf(thread), linked));
    const ending = this.shown.threadKind.endingOf(thread);
    if (ending !== null) body.push(new Span({ cls: ["dd-answer"] }, new LinkedText(this.keywords, ending.source.path, this.opener).build(ending.text)));
    body.push(metaOf(look.status, sourcePath));
    return new ListItem({}, [new SourceRow(thread.source, open).build([markOf(look), new Span({ cls: ["dd-body"] }, body)])]);
  }

  private lookOf(thread: Thread): ThreadLook {
    const ending = this.shown.threadKind.endingOf(thread);
    if (ending === null) return this.shown.openLook;
    return this.shown.endedLookOf(ending).look;
  }

  private factsOf(facts: ThreadFact[], linked: LinkedText): ViewElement[] {
    if (facts.length === 0) return [];
    const shown = facts.map((fact) => new Span({ text: `${fact.name} ` }, [new Bold({}, linked.build(fact.value))]));
    return [new Span({ cls: ["dd-facts"] }, shown)];
  }
}
