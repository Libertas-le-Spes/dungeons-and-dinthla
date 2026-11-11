export const PLAIN_GLOBALS = ["undefined", "Array", "Date", "Error", "JSON", "Map", "Math", "Number", "Object", "Promise", "RegExp", "Set", "String", "TextEncoder", "WeakMap"];

export const PAGE_GLOBALS: Record<string, string[]> = {
  "main.ts": ["document", "window"],
  "quests/character-suggest.ts": ["Event"],
  "views/dialogs/second-press.ts": ["clearTimeout", "setTimeout"],
};
