import type { IndirectDictionary } from "../../file/object-store";
import type { FieldCollector } from "../field-collector";
import type { FieldNodes } from "../field-nodes";
import type { WidgetSink } from "./annotation-kind";

export class CollectingWidgets implements WidgetSink {
  private readonly recordedFields = new Set<number>();

  constructor(
    private readonly nodes: FieldNodes,
    private readonly collector: FieldCollector,
  ) {}

  widget(annotation: IndirectDictionary): void {
    const field = this.nodes.climbed(annotation, 1).nearestNamed();
    if (field === null || this.recordedFields.has(field.number)) return;
    this.recordedFields.add(field.number);
    this.collector.record(field);
  }
}
