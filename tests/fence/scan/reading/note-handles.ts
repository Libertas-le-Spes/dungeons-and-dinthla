import { TypeFlags, type Type } from "typescript/unstable/sync";
import { flattened } from "./type-shapes";

const NOTE_HANDLE = "NoteRef";
const NOTE_HANDLE_SOURCE = "/src/host/notes/note-ref.ts";
const NO_VALUE = TypeFlags.Null | TypeFlags.Undefined;

function isNoValue(type: Type): boolean {
  return (type.flags & NO_VALUE) !== 0;
}

function isDeclaredAsHandle(declaration: { readonly path: string }): boolean {
  return declaration.path.endsWith(NOTE_HANDLE_SOURCE);
}

function isHandleOrNoValue(type: Type): boolean {
  if (isNoValue(type)) return true;
  const symbol = type.getSymbol();
  if (symbol === undefined || symbol.name !== NOTE_HANDLE) return false;
  return symbol.declarations.length > 0 && symbol.declarations.every(isDeclaredAsHandle);
}

export function isNoteHandle(type: Type): boolean {
  return flattened(type).every(isHandleOrNoValue);
}
