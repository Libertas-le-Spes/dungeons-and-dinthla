import { MAX_ENTRY_FIELD_WIDTH } from "../limits/pdf-limits";
import { Sequence } from "../parsing/sequence";
import { PdfRefusal } from "../refusals/pdf-refusal";
import type { PdfDictionary } from "../values/pdf-dictionary";

const BAD_LAYOUT = "The file's index is laid out in a way the reader does not understand, so it was not read.";
const WIDTH_COUNT = 3;

export interface Subrange {
  first: number;
  count: number;
}

export interface StreamRowLayout {
  kindWidth: number;
  secondWidth: number;
  thirdWidth: number;
  rowBytes: number;
  subranges: Subrange[];
}

function wholeNumbersOf(dictionary: PdfDictionary, key: string): number[] {
  const array = dictionary.get(key).asArray();
  if (array === null) throw new PdfRefusal(BAD_LAYOUT);
  const numbers: number[] = [];
  for (const item of array.items) {
    const whole = item.asInteger();
    if (whole === null || whole < 0) throw new PdfRefusal(BAD_LAYOUT);
    numbers.push(whole);
  }
  return numbers;
}

function isTooWide(width: number): boolean {
  return width > MAX_ENTRY_FIELD_WIDTH;
}

function subrangesOf(dictionary: PdfDictionary): Subrange[] {
  const size = dictionary.get("Size").asInteger();
  if (size === null) throw new PdfRefusal(BAD_LAYOUT);
  if (!dictionary.get("Index").isPresent()) return [{ first: 0, count: size }];
  const numbers = new Sequence(wholeNumbersOf(dictionary, "Index"));
  if (numbers.remaining() % 2 !== 0) throw new PdfRefusal(BAD_LAYOUT);
  const subranges: Subrange[] = [];
  while (numbers.remaining() > 0) subranges.push({ first: numbers.next(), count: numbers.next() });
  return subranges;
}

export function layoutOf(dictionary: PdfDictionary): StreamRowLayout {
  const widths = wholeNumbersOf(dictionary, "W");
  if (widths.length !== WIDTH_COUNT || widths.some(isTooWide)) throw new PdfRefusal(BAD_LAYOUT);
  const sequence = new Sequence(widths);
  const kindWidth = sequence.next();
  const secondWidth = sequence.next();
  const thirdWidth = sequence.next();
  const rowBytes = kindWidth + secondWidth + thirdWidth;
  if (rowBytes < 1) throw new PdfRefusal(BAD_LAYOUT);
  return { kindWidth, secondWidth, thirdWidth, rowBytes, subranges: subrangesOf(dictionary) };
}
