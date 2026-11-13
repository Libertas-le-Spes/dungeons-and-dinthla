import type { IndirectDictionary } from "../../file/object-store";

export interface WidgetSink {
  widget(annotation: IndirectDictionary): void;
}

export interface AnnotationKind {
  handles(subtype: string | null): boolean;
  handle(annotation: IndirectDictionary, subtype: string | null, widgets: WidgetSink): void;
}
