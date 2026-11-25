import type { Source } from "../../../campaign/record/campaign";
import { KeyBinding, PressBinding } from "../../elements/bindings/bindings";
import type { PageAction } from "../../elements/bindings/page-action";
import { Div } from "../../elements/kinds/containers";
import type { ViewElement } from "../../elements/view-element";

const OPENING_KEYS = ["Enter", " "];

export class SourceRow {
  constructor(
    private readonly source: Source,
    private readonly open: PageAction,
  ) {}

  build(children: readonly ViewElement[], extraClasses: readonly string[] = []): Div {
    const bindings = [new PressBinding(this.open), new KeyBinding(OPENING_KEYS, this.open)];
    return new Div({ cls: ["dd-row", ...extraClasses], role: "button", tabIndex: 0, dataPath: this.source.path, dataLine: this.source.line, bindings }, children);
  }
}
