import { ByteCursor } from "../bytes/byte-cursor";
import { MAX_OBJECTS_PARSED } from "../limits/pdf-limits";
import type { ValueParser } from "../parsing/value-parser";
import { PdfRefusal } from "../refusals/pdf-refusal";
import type { PdfDictionary } from "../values/pdf-dictionary";
import type { PdfValue } from "../values/pdf-value";
import type { WorkBudget } from "../work/work-budget";
import type { CrossReference } from "../xref/cross-reference";
import type { ObjectLoading, XrefEntry } from "../xref/xref-entry";
import type { ContainerSource, ObjectStreams } from "../streams/object-streams";
import { readIndirectObject } from "./indirect-object";
import type { LengthSource } from "./length-source";
import { ExactId } from "./object-id";

const MISSING = "The file points at an object that is not there, so it was not read.";
const CYCLE = "The file's objects point at each other in a circle, so it was not read.";

export interface IndirectDictionary {
  number: number;
  dictionary: PdfDictionary;
}

export class ObjectStore implements ObjectLoading, LengthSource, ContainerSource {
  private readonly cache = new Map<number, PdfValue>();
  private readonly loading = new Set<number>();
  private parsed = 0;
  private streams: ObjectStreams | null = null;

  constructor(
    private readonly bytes: Uint8Array,
    private readonly origin: number,
    private readonly work: WorkBudget,
    private readonly parser: ValueParser,
    private readonly crossReference: CrossReference,
  ) {}

  useObjectStreams(streams: ObjectStreams): void {
    this.streams = streams;
  }

  chargeStep(): void {
    this.work.spend();
  }

  resolve(value: PdfValue): PdfValue {
    const reference = value.asReference();
    if (reference === null) return value;
    return this.load(reference.number, reference.generation);
  }

  dictionaryOf(value: PdfValue): PdfDictionary | null {
    return this.resolve(value).asDictionary();
  }

  indirectDictionary(value: PdfValue, refusal: string): IndirectDictionary {
    const reference = value.asReference();
    if (reference === null) throw new PdfRefusal(refusal);
    const dictionary = this.load(reference.number, reference.generation).asDictionary();
    if (dictionary === null) throw new PdfRefusal(refusal);
    return { number: reference.number, dictionary };
  }

  load(number: number, generation: number): PdfValue {
    this.work.spend();
    const entry = this.crossReference.get(number);
    if (entry === undefined || !entry.acceptsGeneration(generation)) throw new PdfRefusal(MISSING);
    const cached = this.cache.get(number);
    if (cached !== undefined) return cached;
    const value = this.loadFresh(number, entry);
    this.cache.set(number, value);
    return value;
  }

  loadContainer(number: number): PdfValue {
    return this.load(number, 0);
  }

  lengthOf(value: PdfValue): number {
    const length = this.resolve(value).asInteger();
    if (length === null || length < 0) throw new PdfRefusal("A stream in the file does not say its length plainly, so the file was not read.");
    return length;
  }

  readInFile(number: number, generation: number, offset: number): PdfValue {
    const cursor = new ByteCursor(this.bytes, this.work, this.origin);
    cursor.moveTo(offset);
    return readIndirectObject(cursor, this.parser, new ExactId(number, generation), this).value;
  }

  readCompressed(number: number, containerNumber: number, index: number): PdfValue {
    if (this.streams === null) throw new PdfRefusal("The file packs an object inside a group of objects that is itself packed, so it was not read.");
    return this.streams.objectAt(containerNumber, index, number, this.parser);
  }

  private loadFresh(number: number, entry: XrefEntry): PdfValue {
    if (this.loading.has(number)) throw new PdfRefusal(CYCLE);
    this.parsed += 1;
    if (this.parsed > MAX_OBJECTS_PARSED) throw new PdfRefusal("The file holds too many objects to read, so it was not read.");
    this.loading.add(number);
    try {
      return this.checkedValue(entry.load(this, number));
    } finally {
      this.loading.delete(number);
    }
  }

  private checkedValue(value: PdfValue): PdfValue {
    if (value.asReference() !== null) throw new PdfRefusal(CYCLE);
    return value;
  }
}
