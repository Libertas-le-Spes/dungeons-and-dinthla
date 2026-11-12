import { describe, expect, it } from "vitest";
import { MAX_ITEMS_IN_CONTAINER, WORK_EXTRA, WORK_PER_BYTE } from "../../../src/pdf/limits/pdf-limits";
import { classicPdf } from "../writer/classic-layout";
import { FormDocument } from "../writer/form-document";
import { literal } from "../writer/pdf-text";
import { treeDocument, treeWriter } from "../writer/tree-document";
import { readCounting, reasonOf } from "./step-counting";

const FIVE_MEGABYTES = 5_000_000;
const SLACK = 2 * STEPS_ROUND();

function STEPS_ROUND(): number {
  return 1_000;
}

function inCatalog(extra: string): Buffer {
  return new FormDocument({ catalogExtra: extra }).text("Primary Name", literal("Aria")).classic();
}

function inField(extra: string): Buffer {
  return new FormDocument().text("Primary Name", literal("Aria"), extra).classic();
}

const SHAPES_TRAVERSED_ONCE: [string, () => Buffer][] = [
  ["whitespace", () => inCatalog(" ".repeat(FIVE_MEGABYTES))],
  ["line ends", () => inCatalog("\n".repeat(FIVE_MEGABYTES))],
  ["one long comment", () => inCatalog(`%${"c".repeat(FIVE_MEGABYTES)}\n`)],
  ["many short comments", () => inCatalog("%\n".repeat(FIVE_MEGABYTES / 2))],
  ["comments that look like tokens", () => inCatalog("%(<<[/Name 1 0 R]>>)\n".repeat(FIVE_MEGABYTES / 20))],
  ["NUL bytes as whitespace", () => inCatalog("\0".repeat(FIVE_MEGABYTES))],
];

const SHAPES_STOPPED_EARLY: [string, () => Buffer, string][] = [
  ["a literal string with no end", () => inCatalog(`/Big (${"a".repeat(FIVE_MEGABYTES)}`), "too long"],
  ["a literal string of nested brackets", () => inCatalog(`/Big ${"(".repeat(FIVE_MEGABYTES)}`), "too long"],
  ["a literal string of escapes", () => inCatalog(`/Big (${"\\101".repeat(FIVE_MEGABYTES / 4)})`), "too long"],
  ["a hex string", () => inCatalog(`/Big <${"41".repeat(FIVE_MEGABYTES / 2)}>`), "too long"],
  ["a hex string of spaces and digits", () => inCatalog(`/Big <${"4 1 ".repeat(FIVE_MEGABYTES / 4)}>`), "too long"],
  ["a name", () => inCatalog(`/Big /${"a".repeat(FIVE_MEGABYTES)}`), "too long"],
  ["a name of escapes", () => inCatalog(`/Big /${"#41".repeat(FIVE_MEGABYTES / 3)}`), "too long"],
  ["a number", () => inCatalog(`/Big ${"1".repeat(FIVE_MEGABYTES)}`), "too long"],
  ["a number of leading zeros", () => inCatalog(`/Big ${"0".repeat(FIVE_MEGABYTES)}1`), "too long"],
  ["a real number", () => inCatalog(`/Big 1.${"1".repeat(FIVE_MEGABYTES)}`), "too long"],
  ["arrays opened and never closed", () => inCatalog(`/Big ${"[".repeat(FIVE_MEGABYTES)}`), "nests lists or groups too deeply"],
  ["dictionaries opened and never closed", () => inCatalog(`/Big ${"<</A ".repeat(FIVE_MEGABYTES / 5)}`), "nests lists or groups too deeply"],
  ["angle brackets", () => inCatalog(`/Big ${"<".repeat(FIVE_MEGABYTES)}`), "A group in the file is not written"],
  ["an array of numbers", () => inCatalog(`/Big [${"1 ".repeat(FIVE_MEGABYTES / 2)}]`), "list in the file is too long"],
  ["an array of references", () => inCatalog(`/Big [${"1 0 R ".repeat(FIVE_MEGABYTES / 6)}]`), "list in the file is too long"],
  ["an array of numbers that almost make references", () => inCatalog(`/Big [${"1 0 ".repeat(FIVE_MEGABYTES / 4)}]`), "list in the file is too long"],
  ["a dictionary of different names", () => inCatalog(`/Big << ${distinctNames(FIVE_MEGABYTES / 8)} >>`), "group in the file is too long"],
  ["a dictionary that repeats one name", () => inCatalog(`/Big << ${"/A 1 ".repeat(FIVE_MEGABYTES / 5)} >>`), "names the same entry twice"],
  ["a stream that never ends", () => fieldValuedBy(`<< /Length 99999999999 >>\nstream\n${"x".repeat(FIVE_MEGABYTES)}`), "outside itself"],
  ["junk where an object should be", () => classicWithFirstBody("x".repeat(FIVE_MEGABYTES)), "not written the way PDF writes it"],
];

function distinctNames(count: number): string {
  let names = "";
  for (let index = 0; index < count; index += 1) names += `/N${index} 1 `;
  return names;
}

function fieldValuedBy(body: string): Buffer {
  const writer = new FormDocument().text("Primary Name", "90 0 R").writer();
  writer.set(90, body);
  return classicPdf(writer);
}

function stream(text: string): Buffer {
  const writer = new FormDocument().text("Primary Name", literal("Aria")).writer();
  writer.set(90, text);
  return classicPdf(writer);
}

function classicWithFirstBody(body: string): Buffer {
  const writer = new FormDocument().text("Primary Name", literal("Aria")).writer();
  writer.set(2, body);
  return classicPdf(writer);
}

describe("reading hostile input about five megabytes long", () => {
  it.each(SHAPES_TRAVERSED_ONCE)("takes no more than one step for each byte of %s", async (_name, build) => {
    const bytes = build();
    expect(bytes.length).toBeGreaterThanOrEqual(FIVE_MEGABYTES);
    const counted = await readCounting(bytes);
    expect(counted.result.ok).toBe(true);
    expect(counted.steps).toBeLessThanOrEqual(bytes.length + SLACK);
  });

  it.each(SHAPES_STOPPED_EARLY)("stops early on %s, within a tenth of the bytes", async (_name, build, words) => {
    const bytes = build();
    expect(bytes.length).toBeGreaterThanOrEqual(FIVE_MEGABYTES);
    const counted = await readCounting(bytes);
    expect(reasonOf(counted)).toContain(words);
    expect(counted.steps).toBeLessThanOrEqual(bytes.length / 10);
  });

  it("takes only a few steps to find the header, the end and the index of a file padded with junk inside", async () => {
    const counted = await readCounting(stream(`(${"a".repeat(FIVE_MEGABYTES)})`));
    expect(counted.result.ok).toBe(true);
    expect(counted.steps).toBeLessThanOrEqual(5_000);
  });

  it("takes no more than one step for each byte of a table that lists no entries, over and over", async () => {
    const table = `xref\n${"0 0\n".repeat(FIVE_MEGABYTES / 4)}`;
    const writer = new FormDocument().text("Primary Name", literal("Aria")).writer();
    const counted = await readCounting(classicPdf(writer, { tableText: table + "0 1\n0000000000 65535 f \n" }));
    expect(counted.steps).toBeLessThanOrEqual(FIVE_MEGABYTES + SLACK);
  });
});

describe("reading input that would repeat work if it were not stopped", () => {
  it("is stopped by the work allowed when many pages share one long list of widgets", async () => {
    const writer = treeWriter({ objects: { 11: "<< /Subtype /Widget /T (Leaf) /FT /Tx /V (x) >>" } });
    writer.set(2, `<< /Type /Pages /Kids [${pageReferences(300)}] >>`);
    writer.set(100, `[${"11 0 R ".repeat(MAX_ITEMS_IN_CONTAINER)}]`);
    for (let page = 0; page < 300; page += 1) writer.set(200 + page, "<< /Type /Page /Annots 100 0 R >>");
    const bytes = classicPdf(writer);
    const counted = await readCounting(bytes);
    expect(reasonOf(counted)).toContain("takes too much work");
    expect(counted.steps).toBeLessThanOrEqual(WORK_EXTRA + WORK_PER_BYTE * bytes.length + 2 * SLACK);
  });

  it("is stopped by the work allowed when many actions share one long list of actions that follow", async () => {
    const objects: Record<number, string> = { 5000: `[${"5001 0 R ".repeat(MAX_ITEMS_IN_CONTAINER)}]`, 5001: "<< /S /JavaScript /JS (x) >>" };
    const form = new FormDocument();
    for (let index = 0; index < 300; index += 1) {
      objects[1000 + index] = "<< /S /JavaScript /JS (x) /Next 5000 0 R >>";
      form.text(`Field ${index}`, literal("v"), `/A ${1000 + index} 0 R`);
    }
    const writer = form.writer();
    for (const [number, body] of Object.entries(objects)) writer.set(Number(number), body);
    const bytes = classicPdf(writer);
    const counted = await readCounting(bytes);
    expect(reasonOf(counted)).toContain("takes too much work");
    expect(counted.steps).toBeLessThanOrEqual(WORK_EXTRA + WORK_PER_BYTE * bytes.length + 2 * SLACK);
  });

  it("is refused at once when one field is listed again and again", async () => {
    const objects: Record<number, string> = { 11: "<< /T (Leaf) /FT /Tx /V (x) >>" };
    const bytes = treeDocument({ objects, formFields: new Array<number>(MAX_ITEMS_IN_CONTAINER).fill(11) });
    const counted = await readCounting(bytes);
    expect(reasonOf(counted)).toContain("nested too deeply, or loop");
    expect(counted.steps).toBeLessThanOrEqual(2 * bytes.length);
  });

  it("reads a widget listed ten thousand times once", async () => {
    const objects: Record<number, string> = { 11: "<< /Subtype /Widget /T (Leaf) /FT /Tx /V (x) >>" };
    const bytes = treeDocument({ objects, annotations: new Array<number>(MAX_ITEMS_IN_CONTAINER).fill(11) });
    const counted = await readCounting(bytes);
    expect(counted.result.ok).toBe(true);
    expect(counted.steps).toBeLessThanOrEqual(2 * bytes.length);
  });

  it("is refused at once when one page is listed again and again", async () => {
    const writer = treeWriter({ objects: { 11: "<< /Subtype /Widget /T (Leaf) /FT /Tx /V (x) >>" }, annotations: [11] });
    writer.set(2, `<< /Type /Pages /Kids [${"3 0 R ".repeat(MAX_ITEMS_IN_CONTAINER)}] >>`);
    const bytes = classicPdf(writer);
    const counted = await readCounting(bytes);
    expect(reasonOf(counted)).toContain("pages could not be read");
    expect(counted.steps).toBeLessThanOrEqual(bytes.length + SLACK);
  });
});

function pageReferences(count: number): string {
  let references = "";
  for (let page = 0; page < count; page += 1) references += `${200 + page} 0 R `;
  return references;
}
