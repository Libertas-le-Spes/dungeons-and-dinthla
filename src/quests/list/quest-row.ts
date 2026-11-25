import type { QuestRecord } from "../../campaign/record/campaign";
import type { LinkOpener } from "../../views/components/rows/link-name";
import type { ElementBinding } from "../../views/elements/bindings/element-binding";
import type { PageAction } from "../../views/elements/bindings/page-action";
import type { ViewElement } from "../../views/elements/view-element";
import { ThreadRow } from "../../views/threads/rows/thread-row";
import { questShownKind } from "./quest-shown-kind";

export function questRowOf(quest: QuestRecord, keywords: string[], opener: LinkOpener, open: PageAction, bindings: readonly ElementBinding[]): ViewElement {
  return new ThreadRow(questShownKind, keywords, opener).build(quest, open, bindings);
}
