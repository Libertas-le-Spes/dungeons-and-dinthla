import type { Source } from "../../../campaign/record/campaign";
import { KeyBinding, PressBinding } from "../../elements/bindings/bindings";
import type { PageAction } from "../../elements/bindings/page-action";
import type { ElementBinding } from "../../elements/bindings/element-binding";
import { Div } from "../../elements/kinds/containers";
import type { ViewElement } from "../../elements/view-element";

const OPENING_KEYS = ["Enter", " "];

export interface RowExtras {
  readonly cls: readonly string[];
  readonly dataItem?: string;
  readonly current?: string;
  readonly bindings: readonly ElementBinding[];
}

export const NO_EXTRAS: RowExtras = { cls: [], bindings: [] };

export class SourceRow {
  constructor(
    private readonly source: Source,
    private readonly open: PageAction,
  ) {}

  build(children: readonly ViewElement[], extra: RowExtras = NO_EXTRAS): Div {
    const bindings = [new PressBinding(this.open), new KeyBinding(OPENING_KEYS, this.open), ...extra.bindings];
    return new Div({ cls: ["dd-row", ...extra.cls], role: "button", tabIndex: 0, dataPath: this.source.path, dataLine: this.source.line, dataItem: extra.dataItem, current: extra.current, bindings }, children);
  }
}
