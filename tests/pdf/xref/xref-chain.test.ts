import { describe, expect, it } from "vitest";
import { MAX_XREF_SECTIONS } from "../../../src/pdf/limits/pdf-limits";
import { RecordingLoading } from "../support/recording-loading";
import { refusalOf } from "../support/read-buffer";
import { indexOf, textFile } from "../support/xref-files";

const HEADER = "%PDF-1.7\n";
const FREE = "0000000000 65535 f \n";

function prevEntry(previous: number | null): string {
  if (previous === null) return "";
  return `/Prev ${previous}`;
}

function section(previous: number | null, extra = ""): string {
  return `xref\n0 1\n${FREE}trailer\n<< /Size 1 /Root 1 0 R ${prevEntry(previous)} ${extra} >>\n`;
}

function chainOf(count: number): Buffer {
  let text = HEADER;
  let previous: number | null = null;
  for (let step = 0; step < count; step += 1) {
    const offset = text.length;
    text += section(previous);
    previous = offset;
  }
  return textFile(`${text}startxref\n${previous}\n%%EOF\n`);
}

function pointingAt(first: string, startxref: number): Buffer {
  return textFile(`${HEADER}${first}startxref\n${startxref}\n%%EOF\n`);
}

describe("following the cross-reference chain", () => {
  it("returns the newest trailer", async () => {
    const index = await indexOf(pointingAt(section(null, "/Info 9 0 R"), HEADER.length));
    expect(index.trailer.has("Info")).toBe(true);
  });

  it("follows /Prev to older sections, and the newest section's entries win", async () => {
    const older = `xref\n0 2\n${FREE}0000000009 00000 n \ntrailer\n<< /Size 2 /Root 1 0 R >>\n`;
    const newerOffset = HEADER.length + older.length;
    const newer = `xref\n1 1\n0000000011 00000 n \ntrailer\n<< /Size 2 /Root 1 0 R /Prev ${HEADER.length} >>\n`;
    const index = await indexOf(textFile(`${HEADER}${older}${newer}startxref\n${newerOffset}\n%%EOF\n`));
    const loading = new RecordingLoading();
    index.crossReference.get(1)?.load(loading, 1);
    expect(loading.offsets).toEqual([11]);
  });

  it("follows a chain of exactly the most sections allowed", async () => {
    const index = await indexOf(chainOf(MAX_XREF_SECTIONS));
    expect(index.trailer.has("Prev")).toBe(true);
  });

  it("refuses a chain one section longer", async () => {
    expect(await refusalOf(chainOf(MAX_XREF_SECTIONS + 1))).toContain("updated too many times");
  });

  it("refuses a section whose /Prev is its own offset", async () => {
    expect(await refusalOf(pointingAt(section(HEADER.length), HEADER.length))).toContain("loops back on itself");
  });

  it("refuses two sections that point at each other", async () => {
    const first = HEADER.length;
    let second = 0;
    for (let round = 0; round < 3; round += 1) second = first + section(second).length;
    const text = `${HEADER}${section(second)}${section(first)}startxref\n${first}\n%%EOF\n`;
    expect(await refusalOf(textFile(text))).toContain("loops back on itself");
  });

  it.each(["/Prev -1", "/Prev 1.5", "/Prev /Name", "/Prev 5 0 R"])("refuses %s", async (entry) => {
    const text = `xref\n0 1\n${FREE}trailer\n<< /Size 1 /Root 1 0 R ${entry} >>\n`;
    expect(await refusalOf(pointingAt(text, HEADER.length))).toContain("could not be found");
  });

  it("refuses a /Prev that points outside the file", async () => {
    expect(await refusalOf(pointingAt(section(99999), HEADER.length))).toContain("outside itself");
  });

  it("refuses a /Prev that points at something that is not a section", async () => {
    expect(await refusalOf(pointingAt(section(2), HEADER.length))).toContain("could not be found");
  });

  it("refuses a startxref that points at something that is not a section", async () => {
    expect(await refusalOf(pointingAt(section(null), 3))).toContain("could not be found");
  });

  it("refuses a startxref that points outside the file", async () => {
    expect(await refusalOf(pointingAt(section(null), 99999))).toContain("outside itself");
  });

  it("refuses a startxref that points at whitespace before the section", async () => {
    expect(await refusalOf(pointingAt(`\n${section(null)}`, HEADER.length))).toContain("could not be found");
  });

  it("refuses an /Encrypt in the newest trailer", async () => {
    expect(await refusalOf(pointingAt(section(null, "/Encrypt 5 0 R"), HEADER.length))).toContain("locked with a password or encryption");
  });

  it("refuses an /Encrypt in an older trailer", async () => {
    const older = section(null, "/Encrypt 5 0 R");
    const text = `${HEADER}${older}${section(HEADER.length)}startxref\n${HEADER.length + older.length}\n%%EOF\n`;
    expect(await refusalOf(textFile(text))).toContain("locked with a password or encryption");
  });

  it("refuses a hybrid file that names /XRefStm", async () => {
    expect(await refusalOf(pointingAt(section(null, "/XRefStm 5"), HEADER.length))).toContain("mixes two kinds of index");
  });
});
