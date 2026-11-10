import type { PageId } from "../interface/campaign-pages";
import type { FollowUpKind } from "../notes/follow-up";
import type { SourceMarker } from "./source-marker";

export type SourceKindName = "question" | "quest" | "coin" | "item";

export interface FollowUpMarker {
  symbol: string;
  kind: FollowUpKind;
}

export interface SourceKind {
  name: SourceKindName;
  marker: SourceMarker;
  followUps: FollowUpMarker[];
  folder: string;
  page: PageId;
}
