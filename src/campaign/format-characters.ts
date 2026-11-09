const FORMAT_CHARACTER = /^\p{Cf}$/u;
const IGNORABLE = /^\p{Default_Ignorable_Code_Point}$/u;
const LONE_SURROGATE = /\p{Cs}/u;
const PICTOGRAPH = /^\p{Extended_Pictographic}$/u;
const EMOJI_MODIFIER = /^\p{Emoji_Modifier}$/u;
const EMOJI_PRESENTATION = "️";
const ZERO_WIDTH_JOINER = "‍";
const FLAGS_WITH_TAGS = [
  Array.from("\u{1f3f4}\u{e0067}\u{e0062}\u{e0065}\u{e006e}\u{e0067}\u{e007f}"),
  Array.from("\u{1f3f4}\u{e0067}\u{e0062}\u{e0073}\u{e0063}\u{e0074}\u{e007f}"),
  Array.from("\u{1f3f4}\u{e0067}\u{e0062}\u{e0077}\u{e006c}\u{e0073}\u{e007f}"),
];

function isFormatCharacter(char: string): boolean {
  return FORMAT_CHARACTER.test(char);
}

function isIgnorable(char: string): boolean {
  return IGNORABLE.test(char);
}

function isHidden(char: string | undefined): boolean {
  if (char === undefined) return false;
  if (isFormatCharacter(char)) return true;
  return isIgnorable(char);
}

function isPictograph(char: string | undefined): boolean {
  if (char === undefined) return false;
  return PICTOGRAPH.test(char);
}

function decoratesEmoji(char: string | undefined): boolean {
  if (char === undefined) return false;
  if (char === EMOJI_PRESENTATION) return true;
  return EMOJI_MODIFIER.test(char);
}

function emojiEndsBefore(chars: string[], index: number): boolean {
  const before = chars[index - 1];
  if (decoratesEmoji(before)) return isPictograph(chars[index - 2]);
  return isPictograph(before);
}

function joinsTwoEmoji(chars: string[], index: number): boolean {
  if (chars[index] !== ZERO_WIDTH_JOINER) return false;
  if (!emojiEndsBefore(chars, index)) return false;
  return isPictograph(chars[index + 1]);
}

function presentsEmoji(chars: string[], index: number): boolean {
  if (chars[index] !== EMOJI_PRESENTATION) return false;
  return isPictograph(chars[index - 1]);
}

function isAllowedHidden(chars: string[], index: number): boolean {
  if (joinsTwoEmoji(chars, index)) return true;
  return presentsEmoji(chars, index);
}

function isStray(chars: string[], index: number): boolean {
  if (!isHidden(chars[index])) return false;
  return !isAllowedHidden(chars, index);
}

function flagStartsAt(chars: string[], start: number, flag: string[]): boolean {
  return flag.every((char, offset) => chars[start + offset] === char);
}

function flagEndAt(chars: string[], start: number): number | null {
  const flag = FLAGS_WITH_TAGS.find((candidate) => flagStartsAt(chars, start, candidate));
  if (flag === undefined) return null;
  return start + flag.length;
}

function hasStrayCharacterIn(chars: string[]): boolean {
  let index = 0;
  while (index < chars.length) {
    const flagEnd = flagEndAt(chars, index);
    if (flagEnd !== null) {
      index = flagEnd;
    } else {
      if (isStray(chars, index)) return true;
      index += 1;
    }
  }
  return false;
}

export function hasStrayFormatCharacter(name: string): boolean {
  if (LONE_SURROGATE.test(name)) return true;
  return hasStrayCharacterIn(Array.from(name));
}
