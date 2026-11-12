import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_FILE_BYTES } from "../../src/pdf/limits/pdf-limits";
import { readPdfFields, readPdfFieldsWith } from "../../src/pdf/read-pdf-fields";
import { startPlatformInflating } from "../../src/pdf/streams/inflate/platform-inflating";
import { PdfRefusal } from "../../src/pdf/refusals/pdf-refusal";
import { FormDocument, FIRST_FIELD_NUMBER } from "./writer/form-document";
import { withUpdate } from "./writer/incremental-update";
import { literal } from "./writer/pdf-text";
import { offsetOf, tableOffsetOf, withEntryOffset } from "./writer/table-patch";
import { fieldsOf, refusalOf } from "./support/read-buffer";
import { pdfOfExactly } from "./support/padded-pdf";
import { testParts } from "./writer/zlib-chunks";

afterEach(() => {
  vi.unstubAllGlobals();
});

function sheet(options: ConstructorParameters<typeof FormDocument>[0] = {}): FormDocument {
  return new FormDocument(options).text("Primary Name", literal("Aria Vell")).text("Primary Class", literal("Wizard")).check("Primary Flag", "/Yes").check("Secondary Flag", "/Off").choice("Primary Pick", literal("Red"));
}

const EXPECTED = { "Primary Name": "Aria Vell", "Primary Class": "Wizard", "Primary Flag": true, "Secondary Flag": false, "Primary Pick": "Red" };

describe("reading a made-up character sheet end to end", () => {
  it("reads a classic file whose fields are found as widgets on the pages", async () => {
    expect(await fieldsOf(sheet().classic())).toEqual(EXPECTED);
  });

  it("reads a classic file with a form", async () => {
    expect(await fieldsOf(sheet({ acroForm: true }).classic())).toEqual(EXPECTED);
  });

  it("reads a file with a cross-reference stream and packed objects", async () => {
    expect(await fieldsOf(sheet().streamed())).toEqual(EXPECTED);
  });

  it("reads a file with a cross-reference stream that uses the up predictor", async () => {
    expect(await fieldsOf(sheet({ acroForm: true }).streamed({ predictor: true }))).toEqual(EXPECTED);
  });

  it("reads a file with some objects packed and some not", async () => {
    expect(await fieldsOf(sheet().streamed({ packed: [FIRST_FIELD_NUMBER, FIRST_FIELD_NUMBER + 1] }))).toEqual(EXPECTED);
  });

  it("reads the same fields from both shapes", async () => {
    const form = sheet();
    expect(await fieldsOf(form.streamed())).toEqual(await fieldsOf(form.classic()));
  });

  it("reads a file that has bytes before its header, counting offsets from the header", async () => {
    expect(await fieldsOf(sheet().classic({ junkBefore: "some junk\n" }))).toEqual(EXPECTED);
  });

  it("returns every field as plain text, a flag or a list", async () => {
    const result = await readPdfFieldsWith(sheet().classic(), testParts());
    if (!result.ok) throw new Error(result.reason);
    expect(result.fields).toBeInstanceOf(Map);
    expect(result.fields.get("Primary Flag")).toBe(true);
  });
});

describe("a file with packed objects that the reader cannot follow", () => {
  it("is refused when the group of packed objects uses a predictor", async () => {
    const bytes = sheet().streamed({ objectStreamExtra: "/DecodeParms << /Predictor 12 /Columns 1 >>" });
    expect(await refusalOf(bytes)).toContain("settings the reader does not understand");
  });

  it("is refused when the group of packed objects is typed as something else", async () => {
    const text = sheet().streamed().toString("latin1").replace("/Type /ObjStm", "/Type /Other");
    expect(await refusalOf(Buffer.from(text, "latin1"))).toContain("not a group of objects");
  });
});

describe("a later update of the file", () => {
  it("overrides the value of the earlier one", async () => {
    const base = new FormDocument().text("Primary Name", literal("Old")).text("Primary Class", literal("Wizard")).classic();
    const updated = withUpdate(base, FIRST_FIELD_NUMBER, "<< /Type /Annot /Subtype /Widget /FT /Tx /T (Primary Name) /V (New) /Rect [0 0 10 10] >>", FIRST_FIELD_NUMBER + 2);
    expect(await fieldsOf(updated)).toEqual({ "Primary Name": "New", "Primary Class": "Wizard" });
  });

  it("is read through the earlier one for what it did not change", async () => {
    const base = new FormDocument().text("Primary Name", literal("Old")).classic();
    const updated = withUpdate(base, 3, `<< /Type /Page /Parent 2 0 R /Annots [${FIRST_FIELD_NUMBER} 0 R] /Extra 1 >>`, FIRST_FIELD_NUMBER + 1);
    expect(await fieldsOf(updated)).toEqual({ "Primary Name": "Old" });
  });
});

describe("what the file must be", () => {
  it.each(["", "not a pdf at all", "%PDF-1.7"])("refuses %j", async (text) => {
    expect(await refusalOf(Buffer.from(text, "latin1"))).not.toBe("");
  });

  it("accepts a file of exactly the most bytes allowed", async () => {
    const bytes = pdfOfExactly(MAX_FILE_BYTES);
    expect(bytes.length).toBe(MAX_FILE_BYTES);
    expect(await fieldsOf(bytes)).toEqual({ "Primary Name": "Aria" });
  });

  it("refuses a file one byte bigger", async () => {
    const bytes = pdfOfExactly(MAX_FILE_BYTES + 1);
    expect(bytes.length).toBe(MAX_FILE_BYTES + 1);
    expect(await refusalOf(bytes)).toContain("too big to be a character sheet");
  });
});

describe("a file that goes wrong in a way nobody planned for", () => {
  it("is refused with plain words, not thrown", async () => {
    const parts = { startInflating: () => { throw new TypeError("a bug"); }, clock: () => 0 };
    expect(await refusalOf(sheet().streamed(), parts)).toBe("Something went wrong while reading this file, so it was not read.");
  });

  it("is refused with the words of the refusal when a refusal is what went wrong", async () => {
    const parts = { startInflating: () => { throw new PdfRefusal("these exact words"); }, clock: () => 0 };
    expect(await refusalOf(sheet().streamed(), parts)).toBe("these exact words");
  });

  it("does not put anything from the file into the words", async () => {
    const reason = await refusalOf(new FormDocument({ catalogExtra: "/OpenAction (SECRET-FROM-THE-FILE)" }).text("Primary Name", literal("Aria")).classic());
    expect(reason).not.toContain("SECRET-FROM-THE-FILE");
  });
});

describe("a device without DecompressionStream", () => {
  it("still reads a file that has nothing compressed", async () => {
    vi.stubGlobal("DecompressionStream", undefined);
    const result = await readPdfFields(Uint8Array.from(sheet().classic()));
    expect(result.ok).toBe(true);
  });

  it("refuses plainly a file that has something compressed", async () => {
    vi.stubGlobal("DecompressionStream", undefined);
    const result = await readPdfFieldsWith(Uint8Array.from(sheet().streamed()), { startInflating: startPlatformInflating, clock: () => 0 });
    expect(result).toEqual({ ok: false, reason: "This device can't read PDFs, so the file was not read." });
  });
});

class SteppingClock {
  private time = 0;

  constructor(private readonly step: number) {}

  now(): number {
    this.time += this.step;
    return this.time;
  }
}

describe("the time limit", () => {
  it("refuses a file that takes longer to read than the limit, by the clock the parts give", async () => {
    const clock = new SteppingClock(3_000);
    const parts = { startInflating: testParts().startInflating, clock: () => clock.now() };
    expect(await refusalOf(sheet().classic(), parts)).toContain("took too long");
  });
});

function insideAString(bytes: Buffer): number {
  return bytes.toString("latin1").indexOf("Aria Vell") + 2;
}

function atTheStart(): number {
  return 0;
}

function atTheTable(bytes: Buffer): number {
  return tableOffsetOf(bytes);
}

function atAnotherObject(bytes: Buffer): number {
  return offsetOf(bytes, FIRST_FIELD_NUMBER + 1);
}

function oneByteBefore(bytes: Buffer): number {
  return offsetOf(bytes, FIRST_FIELD_NUMBER) - 1;
}

function oneByteInto(bytes: Buffer): number {
  return offsetOf(bytes, FIRST_FIELD_NUMBER) + 1;
}

describe("a file with bad offsets", () => {
  const PLACES: [string, (bytes: Buffer) => number][] = [
    ["inside a string", insideAString],
    ["at the start of the file", atTheStart],
    ["at the cross-reference table itself", atTheTable],
    ["at another object", atAnotherObject],
    ["one byte before its object", oneByteBefore],
    ["one byte into its object", oneByteInto],
  ];

  it.each(PLACES)("is refused when an object's offset points %s", async (_where, place) => {
    const bytes = sheet().classic();
    expect(await refusalOf(withEntryOffset(bytes, FIRST_FIELD_NUMBER, place(bytes)))).not.toBe("");
  });

  it("is refused when an offset points past the end", async () => {
    const bytes = sheet().classic();
    expect(await refusalOf(withEntryOffset(bytes, FIRST_FIELD_NUMBER, bytes.length + 5))).toContain("outside the file");
  });

  it("is refused when startxref points into the middle of a string", async () => {
    const bytes = sheet().classic();
    const startxref = `startxref\n${tableOffsetOf(bytes)}`;
    const at = String(insideAString(bytes)).padStart(String(tableOffsetOf(bytes)).length, "0");
    const damaged = bytes.toString("latin1").replace(startxref, `startxref\n${at}`);
    expect(await refusalOf(Buffer.from(damaged, "latin1"))).not.toBe("");
  });
});
