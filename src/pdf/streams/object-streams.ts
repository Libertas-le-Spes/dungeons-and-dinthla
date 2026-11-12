import type { ValueParser } from "../parsing/value-parser";
import { PdfRefusal } from "../refusals/pdf-refusal";
import type { PdfValue } from "../values/pdf-value";
import type { WorkBudget } from "../work/work-budget";
import { ObjectStreamContents } from "./object-stream-contents";
import type { StreamDecoder } from "./stream-decoder";

const NOT_A_GROUP = "The file packs objects inside something that is not a group of objects, so it was not read.";

export interface ContainerSource {
  loadContainer(number: number): PdfValue;
}

export class ObjectStreams {
  private readonly contents = new Map<number, ObjectStreamContents>();

  constructor(
    private readonly decoder: StreamDecoder,
    private readonly work: WorkBudget,
  ) {}

  async prepare(source: ContainerSource, containerNumbers: readonly number[]): Promise<void> {
    for (const number of containerNumbers) this.contents.set(number, await this.readContainer(source, number));
  }

  objectAt(containerNumber: number, index: number, number: number, parser: ValueParser): PdfValue {
    const contents = this.contents.get(containerNumber);
    if (contents === undefined) throw new PdfRefusal(NOT_A_GROUP);
    return contents.objectAt(index, number, parser, this.work);
  }

  private async readContainer(source: ContainerSource, number: number): Promise<ObjectStreamContents> {
    const stream = source.loadContainer(number).asStream();
    if (stream === null || stream.dictionary.get("Type").asName() !== "ObjStm") throw new PdfRefusal(NOT_A_GROUP);
    const count = stream.dictionary.get("N").asInteger();
    const first = stream.dictionary.get("First").asInteger();
    if (count === null || count < 0 || first === null || first < 0) throw new PdfRefusal(NOT_A_GROUP);
    const decoded = await this.decoder.decode(stream, false);
    return ObjectStreamContents.read(decoded, count, first, this.work);
  }
}
