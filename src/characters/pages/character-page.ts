import { PressBinding } from "../../views/elements/bindings/bindings";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button } from "../../views/elements/kinds/containers";
import type { PagePart } from "../../views/pages/page-part";
import type { PageView, ShownPage } from "../../views/pages/page-view";

export const ALL_CHARACTERS = "← All characters";

const PAGE_CLASSES = ["dd-root", "dd-character-page"];

export class CharacterPage implements ShownPage {
  readonly cls = PAGE_CLASSES;

  constructor(
    readonly sheet: PagePart,
    private readonly showGallery: () => void,
  ) {}

  opened(view: PageView): void {
    const back = new Button({ cls: ["dd-back"], text: ALL_CHARACTERS, bindings: [new PressBinding(new RunAction(this.back.bind(this)))] });
    view.show([back, this.sheet.tree()]);
    this.sheet.started();
  }

  closed(): void {
    this.sheet.stopped();
  }

  private back(): void {
    this.showGallery();
  }
}
