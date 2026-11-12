import { describe, expect, it } from "vitest";
import { MAX_XREF_ENTRIES } from "../../../src/pdf/limits/pdf-limits";
import { RecordingLoading } from "../support/recording-loading";
import { refusalOf } from "../support/read-buffer";
import { classicEntries, indexOf, textFile } from "../support/xref-files";

const HEADER = "%PDF-1.7\n";

function fileWith(table: string, trailer = "trailer\n<< /Size 3 /Root 1 0 R >>\n"): Buffer {
  return textFile(`${HEADER}${table}${trailer}startxref\n${HEADER.length}\n%%EOF\n`);
}

function entryLine(offset: number, generation: number, mark: string, ending = " \n"): string {
  return `${String(offset).padStart(10, "0")} ${String(generation).padStart(5, "0")} ${mark}${ending}`;
}

describe("reading a classic cross-reference table", () => {
  it("reads in-file entries with their offsets and generations", async () => {
    const index = await indexOf(fileWith(`xref\n0 3\n${entryLine(0, 65535, "f")}${entryLine(9, 0, "n")}${entryLine(20, 3, "n")}`));
    const loading = new RecordingLoading();
    index.crossReference.get(1)?.load(loading, 1);
    index.crossReference.get(2)?.load(loading, 2);
    expect(loading.offsets).toEqual([9, 20]);
    expect(loading.generations).toEqual([0, 3]);
  });

  it("reads a free entry as an entry that cannot be loaded", async () => {
    const index = await indexOf(fileWith(`xref\n0 2\n${entryLine(0, 65535, "f")}${entryLine(0, 0, "f")}`));
    expect(index.crossReference.get(1)?.acceptsGeneration(0)).toBe(false);
  });

  it("reads several subsections, each starting at its own object number", async () => {
    const index = await indexOf(fileWith(`xref\n0 1\n${entryLine(0, 65535, "f")}5 2\n${entryLine(9, 0, "n")}${entryLine(11, 0, "n")}`));
    expect(index.crossReference.get(5)).toBeDefined();
    expect(index.crossReference.get(6)).toBeDefined();
    expect(index.crossReference.get(2)).toBeUndefined();
  });

  it.each([" \n", " \r", "\r\n"])("accepts the two-byte line end %j", async (ending) => {
    const index = await indexOf(fileWith(`xref\n0 2\n${entryLine(0, 65535, "f", ending)}${entryLine(9, 0, "n", ending)}`));
    expect(index.crossReference.get(1)).toBeDefined();
  });

  it.each(["\n", "\r", "  ", "\n\n", " ", ""])("refuses the line end %j, which is not two bytes of PDF's", async (ending) => {
    const reason = await refusalOf(fileWith(`xref\n0 2\n${entryLine(0, 65535, "f", ending)}${entryLine(9, 0, "n", ending)}`));
    expect(reason).not.toBe("");
  });

  it("refuses a line whose offset is not ten digits", async () => {
    expect(await refusalOf(fileWith(`xref\n0 1\n000000042 00000 n \n`))).toContain("A line of the file's index");
  });

  it("refuses a line whose generation is not five digits", async () => {
    expect(await refusalOf(fileWith(`xref\n0 1\n0000000042 0000 n \n`))).toContain("A line of the file's index");
  });

  it("refuses a line whose two last bytes are not a line end", async () => {
    expect(await refusalOf(fileWith(`xref\n0 1\n${entryLine(0, 65535, "f", "ab")}`))).toContain("A line of the file's index");
  });

  it("refuses a line whose separators are not spaces", async () => {
    expect(await refusalOf(fileWith(`xref\n0 1\n0000000042X00000 n \n`))).toContain("A line of the file's index");
    expect(await refusalOf(fileWith(`xref\n0 1\n0000000042 00000Xn \n`))).toContain("A line of the file's index");
  });

  it("refuses a line whose mark is neither n nor f", async () => {
    expect(await refusalOf(fileWith(`xref\n0 1\n0000000042 00000 x \n`))).toContain("not written the way PDF writes it");
  });

  it("refuses a subsection that says more entries than the file has room for", async () => {
    expect(await refusalOf(fileWith(`xref\n0 50\n${entryLine(0, 65535, "f")}`))).toContain("not written the way PDF writes it");
  });

  it("refuses an in-file entry that points exactly at the end of the file", async () => {
    const before = fileWith(`xref\n0 1\n${entryLine(1, 0, "n")}`);
    const atEnd = fileWith(`xref\n0 1\n${entryLine(before.length, 0, "n")}`);
    expect(await refusalOf(atEnd)).toContain("points at a place outside the file");
  });

  it("accepts an in-file entry that points at the last byte of the file", async () => {
    const before = fileWith(`xref\n0 1\n${entryLine(1, 0, "n")}`);
    const index = await indexOf(fileWith(`xref\n0 1\n${entryLine(before.length - 1, 0, "n")}`));
    expect(index.crossReference.get(0)).toBeDefined();
  });

  it("refuses a table with no trailer", async () => {
    expect(await refusalOf(textFile(`${HEADER}xref\n0 1\n${entryLine(0, 65535, "f")}startxref\n${HEADER.length}\n%%EOF`))).toContain("is missing");
  });

  it("refuses a trailer that is not a dictionary", async () => {
    expect(await refusalOf(fileWith(`xref\n0 1\n${entryLine(0, 65535, "f")}`, "trailer\n[1 2]\n"))).toContain("not written the way PDF writes it");
  });

  it("keeps the first entry when a section names an object twice", async () => {
    const index = await indexOf(fileWith(`xref\n0 1\n${entryLine(0, 65535, "f")}1 1\n${entryLine(9, 0, "n")}1 1\n${entryLine(20, 0, "n")}`));
    const loading = new RecordingLoading();
    index.crossReference.get(1)?.load(loading, 1);
    expect(loading.offsets).toEqual([9]);
  });

  it("allows comments and blank lines between subsections", async () => {
    const index = await indexOf(fileWith(`xref\n0 1\n${entryLine(0, 65535, "f")}%a comment\n\n3 1\n${entryLine(9, 0, "n")}`));
    expect(index.crossReference.get(3)).toBeDefined();
  });

  it("reads a table that lists exactly the most entries allowed", async () => {
    const index = await indexOf(fileWith(`xref\n0 ${MAX_XREF_ENTRIES}\n${classicEntries(MAX_XREF_ENTRIES, "f")}`));
    expect(index.crossReference.get(MAX_XREF_ENTRIES - 1)).toBeDefined();
  });

  it("refuses a table that lists one entry more", async () => {
    expect(await refusalOf(fileWith(`xref\n0 ${MAX_XREF_ENTRIES + 1}\n${classicEntries(MAX_XREF_ENTRIES + 1, "f")}`))).toContain("lists too many objects");
  });

  it("counts the entries of every subsection together", async () => {
    const table = `xref\n0 ${MAX_XREF_ENTRIES}\n${classicEntries(MAX_XREF_ENTRIES, "f")}${MAX_XREF_ENTRIES} 1\n${classicEntries(1, "f")}`;
    expect(await refusalOf(fileWith(table))).toContain("lists too many objects");
  });

  it("refuses a count with more digits than any real count", async () => {
    expect(await refusalOf(fileWith(`xref\n0 ${"9".repeat(25)}\n`))).toContain("too long");
  });
});
