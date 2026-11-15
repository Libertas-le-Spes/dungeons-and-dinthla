import type { ReferenceKindName } from "../../kinds/reference-kind";

export interface ReferenceReader {
  kind: ReferenceKindName;
  linksIn(text: string): string[];
}
