export const GLOBAL_SAMPLES = [
  "export const text = () => document.body.innerText;",
  'export const text = () => document.querySelector(".cm-content")?.textContent;',
  "export const later = (code: string) => window.setTimeout(code, 0);",
  "export const later = (run: () => void) => setTimeout(run, 0);",
  "export const page = () => globalThis.document;",
  "export const page = () => activeDocument.body;",
  "export const page = () => activeWindow;",
  "export const page = () => ({ document });",
  "export const page = () => self;",
  'export const load = () => require("fs");',
  'export const say = (text: string) => console.log(text);',
  "export const keep = (key: string, text: string) => localStorage.setItem(key, text);",
];

export const ALLOWED_GLOBAL_SAMPLES = ["export const names = (list: string[]) => new Set(list);", "export const empty = (text: string | undefined) => text === undefined;"];
