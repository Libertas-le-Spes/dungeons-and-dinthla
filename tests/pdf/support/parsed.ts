import { VALUE_PARSER } from "../../../src/pdf/parsing/object-readers";
import type { PdfValue } from "../../../src/pdf/values/pdf-value";
import { cursorOver } from "./cursors";

export function parsed(text: string): PdfValue {
  return VALUE_PARSER.read(cursorOver(text), 0);
}

export function refusalFrom(action: () => unknown): string {
  try {
    action();
  } catch (error) {
    if (error instanceof Error) return error.message;
    return "not an error";
  }
  return "";
}

export async function refusalFromAsync(action: () => Promise<unknown>): Promise<string> {
  try {
    await action();
  } catch (error) {
    if (error instanceof Error) return error.message;
    return "not an error";
  }
  return "";
}
