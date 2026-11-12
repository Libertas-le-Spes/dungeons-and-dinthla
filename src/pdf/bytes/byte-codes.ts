export function byteOf(character: string): number {
  return character.charCodeAt(0);
}

export const NO_BYTE = -1;
export const NUL = 0;
export const TAB = 9;
export const LINE_FEED = 10;
export const FORM_FEED = 12;
export const CARRIAGE_RETURN = 13;
export const SPACE = 32;
export const PERCENT = byteOf("%");
export const SLASH = byteOf("/");
export const LEFT_PAREN = byteOf("(");
export const RIGHT_PAREN = byteOf(")");
export const LESS_THAN = byteOf("<");
export const GREATER_THAN = byteOf(">");
export const LEFT_BRACKET = byteOf("[");
export const RIGHT_BRACKET = byteOf("]");
export const LEFT_BRACE = byteOf("{");
export const RIGHT_BRACE = byteOf("}");
export const BACKSLASH = byteOf("\\");
export const HASH = byteOf("#");
export const PLUS = byteOf("+");
export const MINUS = byteOf("-");
export const DOT = byteOf(".");
export const ZERO = byteOf("0");
export const NINE = byteOf("9");
export const SEVEN = byteOf("7");
