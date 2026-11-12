import type { IndirectDictionary } from "../../file/object-store";
import type { FieldNodes } from "../field-nodes";
import type { WidgetSink } from "./annotation-kind";

export class CheckingWidgets implements WidgetSink {
  constructor(private readonly nodes: FieldNodes) {}

  widget(annotation: IndirectDictionary): void {
    this.nodes.climbed(annotation, 1);
  }
}
