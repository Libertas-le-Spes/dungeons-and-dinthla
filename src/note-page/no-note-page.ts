import { Paragraph } from "../views/elements/kinds/containers";
import type { PageView, ShownPage } from "../views/pages/page-view";

export const NO_NOTE = "No note open.";

const PAGE_CLASSES = ["dd-root", "dd-list-view", "dd-note-page"];

export class NoNotePage implements ShownPage {
  readonly cls = PAGE_CLASSES;

  opened(view: PageView): void {
    view.show([new Paragraph({ cls: ["dd-empty"], text: NO_NOTE })]);
  }

  closed(): void {}
}
