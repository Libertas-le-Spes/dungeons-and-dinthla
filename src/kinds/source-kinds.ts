import { coinSourceKind } from "./coin-source-kind";
import { itemSourceKind } from "./item-source-kind";
import type { LookedUpKind } from "./looked-up-kind";
import { questSourceKind } from "./quest-source-kind";
import { questionSourceKind } from "./question-source-kind";
import type { SourceKind } from "./source-kind";

export const LOOKED_UP_KINDS: LookedUpKind[] = [questionSourceKind, questSourceKind, itemSourceKind];

export const SOURCE_KINDS: SourceKind[] = [questionSourceKind, questSourceKind, coinSourceKind, itemSourceKind];
