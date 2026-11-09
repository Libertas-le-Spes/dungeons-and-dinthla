const FORMAT_CHARACTER = /^\p{Cf}$/u;
const SPACE = /^\s$/u;
const JOINERS = new Set(["‌", "‍"]);
const BLACK_FLAG = "\u{1f3f4}";
const CANCEL_TAG = "\u{e007f}";
const FIRST_TAG = 0xe0020;
const LAST_TAG = 0xe007e;

function isFormatCharacter(char: string): boolean {
  return FORMAT_CHARACTER.test(char);
}

function isVisible(char: string | undefined): boolean {
  if (char === undefined) return false;
  return !isFormatCharacter(char) && !SPACE.test(char);
}

function isTag(char: string | undefined): boolean {
  if (char === undefined) return false;
  const code = char.codePointAt(0)!;
  return code >= FIRST_TAG && code <= LAST_TAG;
}

function flagSequenceEnd(chars: string[], start: number): number | null {
  if (chars[start] !== BLACK_FLAG) return null;
  const firstTag = start + 1;
  let index = firstTag;
  while (isTag(chars[index])) index += 1;
  if (index === firstTag || chars[index] !== CANCEL_TAG) return null;
  return index + 1;
}

function joinsTwoVisible(chars: string[], index: number): boolean {
  if (!JOINERS.has(chars[index]!)) return false;
  return isVisible(chars[index - 1]) && isVisible(chars[index + 1]);
}

function isStray(chars: string[], index: number): boolean {
  if (!isFormatCharacter(chars[index]!)) return false;
  return !joinsTwoVisible(chars, index);
}

export function hasStrayFormatCharacter(name: string): boolean {
  const chars = Array.from(name);
  let index = 0;
  while (index < chars.length) {
    const flagEnd = flagSequenceEnd(chars, index);
    if (flagEnd !== null) {
      index = flagEnd;
    } else {
      if (isStray(chars, index)) return true;
      index += 1;
    }
  }
  return false;
}
