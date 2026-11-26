import type { QuestionRecord } from "../../campaign/record/campaign";
import type { LinkOpener } from "../../views/components/rows/link-name";
import type { ElementBinding } from "../../views/elements/bindings/element-binding";
import type { PageAction } from "../../views/elements/bindings/page-action";
import type { ViewElement } from "../../views/elements/view-element";
import { ThreadRow } from "../../views/threads/rows/thread-row";
import { questionShownKind } from "./question-shown-kind";

export function questionRowOf(question: QuestionRecord, keywords: string[], opener: LinkOpener, open: PageAction, bindings: readonly ElementBinding[]): ViewElement {
  return new ThreadRow(questionShownKind, keywords, opener).build(question, open, bindings);
}
