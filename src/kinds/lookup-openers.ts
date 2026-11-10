import type { Source } from "./source";

export interface LookupOpeners {
  question(source: Source, onClosed: () => void): void;
  quest(source: Source, onClosed: () => void): void;
  item(name: string, source: Source, onClosed: () => void): void;
}
