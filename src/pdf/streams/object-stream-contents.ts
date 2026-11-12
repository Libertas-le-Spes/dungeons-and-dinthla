import { ByteCursor } from "../bytes/byte-cursor";
import { readDigits } from "../bytes/read-integer";
import { skipSpace } from "../bytes/skip-space";
import { MAX_OBJECTS_IN_STREAM } from "../limits/pdf-limits";
import type { ValueParser } from "../parsing/value-parser";
import { PdfRefusal } from "../refusals/pdf-refusal";
import type { PdfValue } from "../values/pdf-value";
import type { WorkBudget } from "../work/work-budget";

const BAD_STREAM = "A group of objects packed inside the file is not packed the way PDF packs them, so the file was not read.";

interface Placed {
  number: number;
  offset: number;
  end: number;
}

export class ObjectStreamContents {
  private constructor(
    private readonly decoded: Uint8Array,
    private readonly first: number,
    private readonly placed: ReadonlyMap<number, Placed>,
  ) {}

  static read(decoded: Uint8Array, count: number, first: number, work: WorkBudget): ObjectStreamContents {
    if (count > MAX_OBJECTS_IN_STREAM) throw new PdfRefusal("A group of objects packed inside the file holds too many objects, so the file was not read.");
    const header = new ByteCursor(decoded, work, 0);
    const placed = new Map<number, Placed>();
    const numbers = new Set<number>();
    let previous: Placed | null = null;
    for (let index = 0; index < count; index += 1) {
      const number = readDigits(header, "An object number inside a packed group");
      skipSpace(header);
      const offset = readDigits(header, "An object's place inside a packed group");
      skipSpace(header);
      if (numbers.has(number)) throw new PdfRefusal(BAD_STREAM);
      numbers.add(number);
      const entry: Placed = { number, offset, end: decoded.byteLength };
      if (previous !== null) previous.end = first + offset;
      if (previous !== null && offset <= previous.offset) throw new PdfRefusal(BAD_STREAM);
      placed.set(index, entry);
      previous = entry;
    }
    return new ObjectStreamContents(decoded, first, placed);
  }

  objectAt(index: number, number: number, parser: ValueParser, work: WorkBudget): PdfValue {
    const entry = this.placed.get(index);
    if (entry === undefined || entry.number !== number) throw new PdfRefusal(BAD_STREAM);
    const cursor = new ByteCursor(this.decoded, work, 0);
    cursor.moveTo(this.first + entry.offset);
    const value = parser.read(cursor, 0);
    if (cursor.position() > entry.end) throw new PdfRefusal(BAD_STREAM);
    return value;
  }
}
