import type { ReferencePageId } from "./reference-page-id";

export type ReferenceKindName = "character" | "place";

export interface ReferenceKind {
  name: ReferenceKindName;
  label: string;
  folder: string;
  page: ReferencePageId;
}
