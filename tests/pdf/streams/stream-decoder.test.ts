import { describe, expect, it } from "vitest";
import type { StreamFilter } from "../../../src/pdf/streams/stream-filter";
import { StreamDecoder } from "../../../src/pdf/streams/stream-decoder";
import { PdfStream } from "../../../src/pdf/values/pdf-stream";
import type { PdfValue } from "../../../src/pdf/values/pdf-value";
import { bytesOfText } from "../support/cursors";
import { parsed, refusalFromAsync } from "../support/parsed";
import { present } from "../support/present";

class RecordingFilter implements StreamFilter {
  decoded: number[][] = [];
  parameters: PdfValue[] = [];
  allowed: boolean[] = [];

  constructor(private readonly filterName: string) {}

  named(name: string): boolean {
    return name === this.filterName;
  }

  async decode(raw: Uint8Array, parameters: PdfValue, predictorAllowed: boolean): Promise<Uint8Array> {
    this.decoded.push([...raw]);
    this.parameters.push(parameters);
    this.allowed.push(predictorAllowed);
    return Uint8Array.from([42]);
  }
}

function streamOf(dictionary: string, start = 0, length = 4): PdfStream {
  return new PdfStream(present(parsed(`<< ${dictionary} >>`).asDictionary()), start, length);
}

describe("StreamDecoder", () => {
  it("gives the raw bytes of a stream with no filter", async () => {
    const decoder = new StreamDecoder(bytesOfText("abcdef"), 0, []);
    expect([...(await decoder.decode(streamOf("", 1, 3), true))]).toEqual([98, 99, 100]);
  });

  it("counts the start of a stream from where the file starts", async () => {
    const decoder = new StreamDecoder(bytesOfText("xxabcdef"), 2, []);
    expect([...(await decoder.decode(streamOf("", 1, 3), true))]).toEqual([98, 99, 100]);
  });

  it("gives the raw bytes when the filter is null", async () => {
    const decoder = new StreamDecoder(bytesOfText("abcd"), 0, []);
    expect((await decoder.decode(streamOf("/Filter null"), true)).byteLength).toBe(4);
  });

  it("hands the raw bytes, the parameters and the predictor permission to the filter that has the name", async () => {
    const first = new RecordingFilter("Other");
    const second = new RecordingFilter("FlateDecode");
    const decoder = new StreamDecoder(bytesOfText("abcd"), 0, [first, second]);
    const result = await decoder.decode(streamOf("/Filter /FlateDecode /DecodeParms << /Columns 5 >>"), false);
    expect([...result]).toEqual([42]);
    expect(first.decoded).toEqual([]);
    expect(second.decoded).toEqual([[97, 98, 99, 100]]);
    expect(second.allowed).toEqual([false]);
    const [passed] = second.parameters;
    expect(present(passed).asDictionary()?.get("Columns").asInteger()).toBe(5);
  });

  it("reads a filter named in a list of one", async () => {
    const filter = new RecordingFilter("FlateDecode");
    await new StreamDecoder(bytesOfText("abcd"), 0, [filter]).decode(streamOf("/Filter [/FlateDecode]"), true);
    expect(filter.decoded.length).toBe(1);
  });

  it.each(["/Filter /LZWDecode", "/Filter [/FlateDecode /LZWDecode]", "/Filter []", "/Filter 5", "/Filter [5]", "/Filter (FlateDecode)", "/Filter /Fl", "/Filter /flatedecode"])("refuses %s", async (entry) => {
    const decoder = new StreamDecoder(bytesOfText("abcd"), 0, [new RecordingFilter("FlateDecode")]);
    expect(await refusalFromAsync(() => decoder.decode(streamOf(entry), true))).toContain("compressed in a way the reader does not understand");
  });
});
