import { deflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { MAX_ENTRY_FIELD_WIDTH, MAX_XREF_ENTRIES } from "../../../../src/pdf/limits/pdf-limits";
import { RecordingLoading } from "../../support/recording-loading";
import { refusalOf } from "../../support/read-buffer";
import { indexOf, rowOf, textFile, xrefStreamFile } from "../../support/xref-files";
import { withUpPredictor } from "../../writer/layouts/up-predictor";

const BAD_LAYOUT = "laid out in a way";
const BAD_STREAM = "The file's index is not written the way PDF writes it";

function rows(...kinds: Buffer[]): Buffer {
  return Buffer.concat(kinds);
}

describe("reading a cross-reference stream", () => {
  it("reads free, in-file and compressed rows", async () => {
    const data = rows(rowOf(0, 0, 65535), rowOf(1, 90, 4), rowOf(2, 30, 6));
    const index = await indexOf(xrefStreamFile("/Size 3 /W [1 4 2]", data, true));
    const loading = new RecordingLoading();
    index.crossReference.get(1)?.load(loading, 1);
    index.crossReference.get(2)?.load(loading, 2);
    expect(index.crossReference.get(0)?.acceptsGeneration(0)).toBe(false);
    expect(loading.offsets).toEqual([90]);
    expect(loading.generations).toEqual([4]);
    expect(loading.containers).toEqual([30]);
    expect(loading.indexes).toEqual([6]);
  });

  it("reads a stream that is not compressed", async () => {
    const index = await indexOf(xrefStreamFile("/Size 2 /W [1 4 2]", rows(rowOf(0, 0, 0), rowOf(1, 9, 0)), false));
    expect(index.crossReference.get(1)).toBeDefined();
  });

  it("reads rows with no type field as in-file entries", async () => {
    const data = Buffer.from([0, 0, 0, 90, 0, 4]);
    const index = await indexOf(xrefStreamFile("/Size 1 /W [0 4 2]", data, true));
    const loading = new RecordingLoading();
    index.crossReference.get(0)?.load(loading, 0);
    expect(loading.offsets).toEqual([90]);
  });

  it("numbers the rows from the pairs in /Index", async () => {
    const data = rows(rowOf(1, 9, 0), rowOf(1, 11, 0), rowOf(1, 13, 0));
    const index = await indexOf(xrefStreamFile("/Size 20 /Index [5 2 12 1] /W [1 4 2]", data, true));
    expect(index.crossReference.get(5)).toBeDefined();
    expect(index.crossReference.get(6)).toBeDefined();
    expect(index.crossReference.get(12)).toBeDefined();
    expect(index.crossReference.get(7)).toBeUndefined();
  });

  it("reads a width of exactly the widest allowed", async () => {
    const data = Buffer.alloc(MAX_ENTRY_FIELD_WIDTH * 3);
    data.writeUInt8(1, MAX_ENTRY_FIELD_WIDTH - 1);
    const index = await indexOf(xrefStreamFile(`/Size 1 /W [${MAX_ENTRY_FIELD_WIDTH} ${MAX_ENTRY_FIELD_WIDTH} ${MAX_ENTRY_FIELD_WIDTH}]`, data, true));
    expect(index.crossReference.get(0)).toBeDefined();
  });

  it("refuses a width one byte wider", async () => {
    const wide = MAX_ENTRY_FIELD_WIDTH + 1;
    expect(await refusalOf(xrefStreamFile(`/Size 1 /W [1 ${wide} 1]`, Buffer.alloc(wide + 2), true))).toContain(BAD_LAYOUT);
  });

  it.each(["/W [1 4]", "/W [1 4 2 1]", "/W 7", "/W [1 4 -2]", "/W [1 4 2.5]", "/W [1 /A 2]", "/W [0 0 0]", ""])("refuses the widths %j", async (widths) => {
    expect(await refusalOf(xrefStreamFile(`/Size 1 ${widths}`, Buffer.alloc(7), true))).toContain(BAD_LAYOUT);
  });

  it.each(["", "/Size -1", "/Size 1.5", "/Size /A"])("refuses the size %j", async (size) => {
    expect(await refusalOf(xrefStreamFile(`${size} /W [1 4 2]`, Buffer.alloc(7), true))).toContain(BAD_LAYOUT);
  });

  it.each(["/Index [1]", "/Index [1 2 3]", "/Index 5", "/Index [-1 2]", "/Index [1 -2]", "/Index [1 /A]"])("refuses %s", async (index) => {
    expect(await refusalOf(xrefStreamFile(`/Size 5 ${index} /W [1 4 2]`, Buffer.alloc(14), true))).toContain(BAD_LAYOUT);
  });

  it("refuses a row type it does not know", async () => {
    expect(await refusalOf(xrefStreamFile("/Size 1 /W [1 4 2]", rowOf(3, 0, 0), true))).toContain(BAD_STREAM);
  });

  it("refuses rows that are fewer than /Size says", async () => {
    expect(await refusalOf(xrefStreamFile("/Size 3 /W [1 4 2]", rows(rowOf(0, 0, 0), rowOf(1, 9, 0)), true))).toContain(BAD_STREAM);
  });

  it("refuses rows that are more than /Size says", async () => {
    expect(await refusalOf(xrefStreamFile("/Size 1 /W [1 4 2]", rows(rowOf(0, 0, 0), rowOf(1, 9, 0)), true))).toContain(BAD_STREAM);
  });

  it("refuses a stream that is not typed as a cross-reference stream", async () => {
    const text = xrefStreamFile("/Size 1 /W [1 4 2]", rowOf(0, 0, 0), true).toString("latin1").replace("/Type /XRef", "/Type /Other");
    expect(await refusalOf(textFile(text))).toContain(BAD_STREAM);
  });

  it("refuses an object at that place that is not a stream", async () => {
    expect(await refusalOf(textFile("%PDF-1.7\n7 0 obj\n<< /Type /XRef >>\nendobj\nstartxref\n9\n%%EOF\n"))).toContain(BAD_STREAM);
  });

  it("refuses a length written as a reference, because the index is not built yet to look it up", async () => {
    const text = xrefStreamFile("/Size 1 /W [1 4 2]", rowOf(0, 0, 0), false).toString("latin1").replace(/\/Length \d+/, "/Length 9 0 R");
    expect(await refusalOf(textFile(text))).toContain("does not say its length plainly");
  });

  it("reads exactly the most entries allowed", async () => {
    const data = Buffer.alloc(MAX_XREF_ENTRIES * 3);
    const index = await indexOf(xrefStreamFile(`/Size ${MAX_XREF_ENTRIES} /W [1 1 1]`, data, true));
    expect(index.crossReference.get(MAX_XREF_ENTRIES - 1)).toBeDefined();
  });

  it("refuses one entry more", async () => {
    const data = Buffer.alloc((MAX_XREF_ENTRIES + 1) * 3);
    expect(await refusalOf(xrefStreamFile(`/Size ${MAX_XREF_ENTRIES + 1} /W [1 1 1]`, data, true))).toContain("lists too many objects");
  });

  it("refuses a count that the data cannot hold, before reading any row", async () => {
    expect(await refusalOf(xrefStreamFile("/Size 1000 /W [1 4 2]", rowOf(0, 0, 0), true))).toContain(BAD_STREAM);
  });

  it("refuses rows without a type field that are fewer than /Size says, instead of reading past them", async () => {
    expect(await refusalOf(xrefStreamFile("/Size 3 /W [0 4 2]", Buffer.from([0, 0, 0, 90, 0, 4]), true))).toContain(BAD_STREAM);
  });

  it("undoes the up predictor", async () => {
    const data = withUpPredictor([rowOf(1, 90, 0), rowOf(1, 120, 0)]);
    const index = await indexOf(xrefStreamFile("/Size 2 /W [1 4 2] /DecodeParms << /Predictor 12 /Columns 7 >>", data, true));
    const loading = new RecordingLoading();
    index.crossReference.get(1)?.load(loading, 1);
    expect(loading.offsets).toEqual([120]);
  });

  it("refuses a stream of an unknown filter", async () => {
    const text = xrefStreamFile("/Size 1 /W [1 4 2]", rowOf(0, 0, 0), false).toString("latin1").replace("/Length", "/Filter /LZWDecode /Length");
    expect(await refusalOf(textFile(text))).toContain("compressed in a way the reader does not understand");
  });

  it("keeps the dictionary of the stream as the trailer", async () => {
    const index = await indexOf(xrefStreamFile("/Size 1 /Marker 5 /W [1 4 2]", rowOf(0, 0, 0), true));
    expect(index.trailer.get("Marker").asInteger()).toBe(5);
  });

  it("refuses data that is not a whole deflate stream", async () => {
    const broken = Buffer.from(deflateSync(rowOf(0, 0, 0))).subarray(0, 5);
    const text = xrefStreamFile("/Size 1 /W [1 4 2]", broken, false).toString("latin1").replace("/Length", "/Filter /FlateDecode /Length");
    expect(await refusalOf(textFile(text))).not.toBe("");
  });
});
