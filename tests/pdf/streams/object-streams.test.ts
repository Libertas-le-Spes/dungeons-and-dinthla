import { describe, expect, it } from "vitest";
import { VALUE_PARSER } from "../../../src/pdf/parsing/object-readers";
import { ObjectStreams, type ContainerSource } from "../../../src/pdf/streams/object-streams";
import { StreamDecoder } from "../../../src/pdf/streams/stream-decoder";
import { PdfStream } from "../../../src/pdf/values/pdf-stream";
import type { PdfValue } from "../../../src/pdf/values/pdf-value";
import { bytesOfText, budgetFor } from "../support/cursors";
import { parsed, refusalFrom, refusalFromAsync } from "../support/parsed";
import { present } from "../support/present";

class StubContainers implements ContainerSource {
  asked: number[] = [];

  constructor(private readonly found: Map<number, PdfValue>) {}

  loadContainer(number: number): PdfValue {
    this.asked.push(number);
    return present(this.found.get(number));
  }
}

function containerStream(dictionary: string, data: string): PdfStream {
  return new PdfStream(present(parsed(`<< ${dictionary} >>`).asDictionary()), 0, data.length);
}

function streamsOver(data: string, found: Map<number, PdfValue>): { streams: ObjectStreams; containers: StubContainers } {
  const bytes = bytesOfText(data);
  const work = budgetFor(bytes.byteLength);
  return { streams: new ObjectStreams(new StreamDecoder(bytes, 0, []), work), containers: new StubContainers(found) };
}

const DATA = "7 0 9 11 << /A 1 >> [2]";
const GOOD = "/Type /ObjStm /N 2 /First 9";

describe("ObjectStreams", () => {
  it("reads each object of a container it was prepared with", async () => {
    const { streams, containers } = streamsOver(DATA, new Map([[30, containerStream(GOOD, DATA)]]));
    await streams.prepare(containers, [30]);
    expect(streams.objectAt(30, 0, 7, VALUE_PARSER).asDictionary()?.get("A").asInteger()).toBe(1);
    expect(streams.objectAt(30, 1, 9, VALUE_PARSER).asArray()).not.toBeNull();
  });

  it("asks for each container it is given, once", async () => {
    const { streams, containers } = streamsOver(DATA, new Map([[30, containerStream(GOOD, DATA)]]));
    await streams.prepare(containers, [30]);
    expect(containers.asked).toEqual([30]);
  });

  it("prepares nothing for no containers", async () => {
    const { streams, containers } = streamsOver(DATA, new Map());
    await streams.prepare(containers, []);
    expect(containers.asked).toEqual([]);
  });

  it("refuses an object of a container it was not prepared with", async () => {
    const { streams, containers } = streamsOver(DATA, new Map([[30, containerStream(GOOD, DATA)]]));
    await streams.prepare(containers, [30]);
    expect(refusalFrom(() => streams.objectAt(31, 0, 7, VALUE_PARSER))).toContain("something that is not a group of objects");
  });

  it("refuses a container that is not a stream", async () => {
    const { streams, containers } = streamsOver(DATA, new Map([[30, parsed("<< /Type /ObjStm /N 2 /First 9 >>")]]));
    expect(await refusalFromAsync(() => streams.prepare(containers, [30]))).toContain("something that is not a group of objects");
  });

  it.each(["/Type /Other /N 2 /First 9", "/N 2 /First 9", "/Type /ObjStm /First 9", "/Type /ObjStm /N 2", "/Type /ObjStm /N -1 /First 9", "/Type /ObjStm /N 2 /First -1", "/Type /ObjStm /N 2.5 /First 9", "/Type /ObjStm /N 2 /First /A"])("refuses a container with %s", async (entries) => {
    const { streams, containers } = streamsOver(DATA, new Map([[30, containerStream(entries, DATA)]]));
    expect(await refusalFromAsync(() => streams.prepare(containers, [30]))).toContain("something that is not a group of objects");
  });
});
