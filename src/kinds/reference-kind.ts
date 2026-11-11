import type { ReferencePageId } from "./reference-page-id";

export type ReferenceKindName = "character" | "place";

export interface ReferenceKind {
  name: ReferenceKindName;
  folder: string;
  page: ReferencePageId;
}
