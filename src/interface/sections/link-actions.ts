import type { Source } from "../../campaign/record/campaign";
import type { LinkOpener } from "../../views/components/rows/link-name";

export interface LinkActions extends LinkOpener {
  openRow(source: Source): void;
}
