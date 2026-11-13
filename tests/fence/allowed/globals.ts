export const PLAIN_GLOBALS = ["undefined", "Array", "Date", "Error", "JSON", "Map", "Math", "Number", "Object", "Promise", "RegExp", "Set", "String", "TextEncoder", "WeakMap"];

export const PAGE_GLOBALS: Record<string, string[]> = {
  "imports/dialog/picking/pdf-picker.ts": ["Uint8Array"],
  "main.ts": ["document", "window"],
  "pdf/bytes/byte-sink.ts": ["Uint8Array"],
  "pdf/bytes/byte-view.ts": ["Uint8Array"],
  "pdf/bytes/data-view-of.ts": ["DataView"],
  "pdf/streams/inflate/bounded-inflater.ts": ["Uint8Array"],
  "pdf/streams/inflate/platform-inflating.ts": ["Blob", "DecompressionStream", "Uint8Array"],
  "pdf/streams/png-up-predictor.ts": ["Uint8Array"],
  "pdf/work/clock.ts": ["performance"],
  "quests/dialogs/character-suggest.ts": ["Event"],
  "views/dialogs/second-press.ts": ["clearTimeout", "setTimeout"],
};
