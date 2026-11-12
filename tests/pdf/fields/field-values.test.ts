import { describe, expect, it } from "vitest";
import { MAX_FIELD_TEXT_CHARACTERS } from "../../../src/pdf/limits/pdf-limits";
import { classicPdf } from "../writer/layouts/classic-layout";
import { FormDocument } from "../writer/documents/form-document";
import { literal, utf16Hex } from "../writer/pdf-text";
import { fieldsOf, refusalOf } from "../support/read-buffer";

const WRONG_VALUE = "value of a kind the reader does not read";
const RADIO = "32768";
const PUSH_BUTTON = "65536";

function oneText(value: string, extra = ""): Buffer {
  return new FormDocument().text("Primary Name", value, extra).classic();
}

describe("the value of a text field", () => {
  it("reads a literal string", async () => {
    expect(await fieldsOf(oneText(literal("Aria Vell")))).toEqual({ "Primary Name": "Aria Vell" });
  });

  it("reads a hex string in PDFDocEncoding", async () => {
    expect(await fieldsOf(oneText("<4172 6961>"))).toEqual({ "Primary Name": "Aria" });
  });

  it("reads a string in UTF-16 with its byte order mark", async () => {
    expect(await fieldsOf(oneText(utf16Hex("Aria é中")))).toEqual({ "Primary Name": "Aria é中" });
  });

  it("reads an empty string as an empty value, not as no value", async () => {
    expect(await fieldsOf(oneText("()"))).toEqual({ "Primary Name": "" });
  });

  it("reads escapes and octal in a literal string", async () => {
    expect(await fieldsOf(oneText("(Line one\\nLine \\(two\\) \\101)"))).toEqual({ "Primary Name": "Line one\nLine (two) A" });
  });

  it("returns the text raw, with no guards applied", async () => {
    expect(await fieldsOf(oneText("([[Link]] <b>bold</b> # | %%)"))).toEqual({ "Primary Name": "[[Link]] <b>bold</b> # | %%" });
  });

  it("gives no entry for a field with no value", async () => {
    const fields = await fieldsOf(new FormDocument().text("Primary Name", "").text("Secondary Name", literal("Bex")).classic());
    expect(fields).toEqual({ "Secondary Name": "Bex" });
  });

  it("reads a value written as a reference to a string object", async () => {
    const writer = new FormDocument().text("Primary Name", "30 0 R").writer();
    writer.set(30, "(Cass)");
    expect(await fieldsOf(classicPdf(writer))).toEqual({ "Primary Name": "Cass" });
  });

  it("reads a value that is exactly the longest text allowed", async () => {
    const text = "a".repeat(MAX_FIELD_TEXT_CHARACTERS);
    expect(await fieldsOf(oneText(literal(text)))).toEqual({ "Primary Name": text });
  });

  it("refuses a value one character longer", async () => {
    expect(await refusalOf(oneText(literal("a".repeat(MAX_FIELD_TEXT_CHARACTERS + 1))))).toContain("more text than the reader allows");
  });

  it("counts characters, not bytes, so a UTF-16 value of the longest length is read", async () => {
    const text = "中".repeat(MAX_FIELD_TEXT_CHARACTERS);
    expect(await fieldsOf(oneText(utf16Hex(text)))).toEqual({ "Primary Name": text });
  });

  it.each(["/Name", "12", "true", "[(a)]", "<< /A 1 >>"])("refuses the value %s in a text field", async (value) => {
    expect(await refusalOf(oneText(value))).toContain(WRONG_VALUE);
  });

  it("reads a null value as no value", async () => {
    expect(await fieldsOf(new FormDocument().text("Primary Name", "null").text("Secondary Name", literal("Bex")).classic())).toEqual({ "Secondary Name": "Bex" });
  });

  it("refuses a value that is a stream", async () => {
    const writer = new FormDocument().text("Primary Name", "30 0 R").writer();
    writer.stream(30, "", Buffer.from("abcd"), "4");
    expect(await refusalOf(classicPdf(writer))).toContain("value is a stream");
  });

  it("refuses text with bytes PDFDocEncoding leaves empty", async () => {
    expect(await refusalOf(oneText("(a\\000b)"))).toContain("text that is not written the way PDF writes it");
  });

  it("refuses UTF-16 text with half of a pair", async () => {
    expect(await refusalOf(oneText("<FEFFD83D>"))).toContain("text that is not written the way PDF writes it");
  });
});

describe("the value of a checkbox", () => {
  it("reads /Yes as true and /Off as false", async () => {
    const fields = await fieldsOf(new FormDocument().check("Primary Flag", "/Yes").check("Secondary Flag", "/Off").classic());
    expect(fields).toEqual({ "Primary Flag": true, "Secondary Flag": false });
  });

  it("reads any name other than /Off as true", async () => {
    expect(await fieldsOf(new FormDocument().check("Primary Flag", "/On").classic())).toEqual({ "Primary Flag": true });
  });

  it("reads a name that only starts like Off as true", async () => {
    expect(await fieldsOf(new FormDocument().check("Primary Flag", "/Offline").classic())).toEqual({ "Primary Flag": true });
  });

  it("reads a name with an escape by what it stands for", async () => {
    expect(await fieldsOf(new FormDocument().check("Primary Flag", "/O#66f").classic())).toEqual({ "Primary Flag": false });
  });

  it.each(["(Yes)", "1", "true", "[/Yes]"])("refuses the value %s in a checkbox", async (value) => {
    expect(await refusalOf(new FormDocument().check("Primary Flag", value).classic())).toContain(WRONG_VALUE);
  });
});

describe("the value of a radio button and a push button", () => {
  it("reads a radio group's chosen name as text", async () => {
    const fields = await fieldsOf(new FormDocument().check("Primary Group", "/Second", `/Ff ${RADIO}`).classic());
    expect(fields).toEqual({ "Primary Group": "Second" });
  });

  it("gives no entry for a push button, which has no value", async () => {
    const fields = await fieldsOf(new FormDocument().check("Primary Button", "/Yes", `/Ff ${PUSH_BUTTON}`).text("Primary Name", literal("Aria")).classic());
    expect(fields).toEqual({ "Primary Name": "Aria" });
  });

  it("reads the flags when several are set", async () => {
    const both = String(32768 + 4);
    expect(await fieldsOf(new FormDocument().check("Primary Group", "/Second", `/Ff ${both}`).classic())).toEqual({ "Primary Group": "Second" });
  });

  it.each(["/Ff /A", "/Ff 1.5", "/Ff (x)"])("refuses the settings %s", async (extra) => {
    expect(await refusalOf(new FormDocument().check("Primary Flag", "/Yes", extra).classic())).toContain("settings the reader does not understand");
  });
});

describe("the value of a choice field", () => {
  it("reads one chosen string", async () => {
    expect(await fieldsOf(new FormDocument().choice("Primary Class", literal("Wizard")).classic())).toEqual({ "Primary Class": "Wizard" });
  });

  it("reads several chosen strings as a list", async () => {
    expect(await fieldsOf(new FormDocument().choice("Primary Picks", "[(Red) <426c7565>]").classic())).toEqual({ "Primary Picks": ["Red", "Blue"] });
  });

  it("reads an empty list of choices", async () => {
    expect(await fieldsOf(new FormDocument().choice("Primary Picks", "[]").classic())).toEqual({ "Primary Picks": [] });
  });

  it.each(["[(a) /b]", "[(a) 1]", "[[(a)]]", "/Name", "5"])("refuses the value %s in a choice field", async (value) => {
    expect(await refusalOf(new FormDocument().choice("Primary Class", value).classic())).toContain(WRONG_VALUE);
  });

  it("refuses a chosen string that is too long", async () => {
    expect(await refusalOf(new FormDocument().choice("Primary Picks", `[(ok) ${literal("a".repeat(MAX_FIELD_TEXT_CHARACTERS + 1))}]`).classic())).toContain("more text than the reader allows");
  });
});

describe("a field of a kind the reader does not read", () => {
  it("leaves out a signature field", async () => {
    const fields = await fieldsOf(new FormDocument().field("Primary Signature", "Sig", "<< /Type /Sig >>", "").text("Primary Name", literal("Aria")).classic());
    expect(fields).toEqual({ "Primary Name": "Aria" });
  });

  it("leaves out a field of a type that is not one of the three", async () => {
    const fields = await fieldsOf(new FormDocument().field("Primary Plain", "Zz", literal("x"), "").text("Primary Name", literal("Aria")).classic());
    expect(fields).toEqual({ "Primary Name": "Aria" });
  });
});
