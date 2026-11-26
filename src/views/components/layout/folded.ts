import { Details, Summary } from "../../elements/kinds/containers";
import type { ViewElement } from "../../elements/view-element";

export class Folded {
  constructor(
    private readonly cls: readonly string[],
    private readonly title: string,
  ) {}

  build(children: readonly ViewElement[]): Details {
    return new Details({ cls: this.cls }, [new Summary({ text: this.title }), ...children]);
  }
}
