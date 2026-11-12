import { describe, expect, it } from "vitest";
import { MAX_NESTING } from "../../../src/pdf/limits/pdf-limits";
import { classicPdf } from "../writer/classic-layout";
import { FormDocument } from "../writer/form-document";
import { literal } from "../writer/pdf-text";
import { treeDocument, treeWriter } from "../writer/tree-document";
import { fieldsOf, refusalOf } from "../support/read-buffer";

const WIDGET = "/Type /Annot /Subtype /Widget /Rect [0 0 1 1]";
const SCRIPT = "<< /S /JavaScript /JS (AddSpell(this)) >>";

function fieldWith(extra: string): string {
  return `<< ${WIDGET} /FT /Tx /T (Primary Name) /V (Aria) ${extra} >>`;
}

function documentWithField(extra: string, more: Record<number, string> = {}): Buffer {
  return treeDocument({ objects: { 10: fieldWith(extra), ...more }, annotations: [10] });
}

const REFUSED_ACTIONS = [
  ["Launch", "another program"],
  ["URI", "web address"],
  ["SubmitForm", "send its form somewhere"],
  ["ImportData", "pull in data"],
  ["GoToR", "open another file"],
  ["GoToE", "open an embedded file"],
];

describe("a field's own script", () => {
  it("is read past, and the value is read", async () => {
    expect(await fieldsOf(documentWithField(`/A ${SCRIPT}`))).toEqual({ "Primary Name": "Aria" });
  });

  it("is read past when it is in the additional actions", async () => {
    expect(await fieldsOf(documentWithField(`/AA << /K ${SCRIPT} /F ${SCRIPT} /V ${SCRIPT} /C ${SCRIPT} >>`))).toEqual({ "Primary Name": "Aria" });
  });

  it("is read past when it is an object of its own", async () => {
    expect(await fieldsOf(documentWithField("/A 30 0 R", { 30: SCRIPT }))).toEqual({ "Primary Name": "Aria" });
  });

  it("is never looked up, so a script that points at nothing, or at a stream, does not matter", async () => {
    const stream = "<< /S /JavaScript /JS 31 0 R >>";
    const writer = treeWriter({ objects: { 10: fieldWith("/A 30 0 R") }, annotations: [10] });
    writer.set(30, stream);
    writer.stream(31, "", Buffer.from("this.calculate()"), "16");
    expect(await fieldsOf(classicPdf(writer))).toEqual({ "Primary Name": "Aria" });
    expect(await fieldsOf(documentWithField("/A << /S /JavaScript /JS 99 0 R >>"))).toEqual({ "Primary Name": "Aria" });
  });

  it("is never decoded, so text that PDF text rules would refuse does not matter", async () => {
    expect(await fieldsOf(documentWithField("/A << /S /JavaScript /JS (\\000\\001 not text \\377) >>"))).toEqual({ "Primary Name": "Aria" });
  });

  it("is read past in fifty fields at once, as in a real export", async () => {
    const form = new FormDocument();
    for (let index = 0; index < 50; index += 1) form.text(`Spell ${index}`, literal("v"), `/AA << /K ${SCRIPT} >> /A ${SCRIPT}`);
    expect(Object.keys(await fieldsOf(form.classic())).length).toBe(50);
  });

  it("is read past on a parent field and on a widget kid", async () => {
    const bytes = treeDocument({
      objects: {
        10: `<< /T (Top) /FT /Tx /V (x) /A ${SCRIPT} /Kids [11 0 R] >>`,
        11: `<< ${WIDGET} /AA << /E ${SCRIPT} >> >>`,
      },
      formFields: [10],
    });
    expect(await fieldsOf(bytes)).toEqual({ Top: "x" });
  });

  it("is read past when the action has no kind", async () => {
    expect(await fieldsOf(documentWithField("/A << /JS (x) >>"))).toEqual({ "Primary Name": "Aria" });
  });

  it.each(["Named", "ResetForm", "Hide", "GoTo", "SetOCGState"])("is read past for an action of the kind %s, which this reader does not list as refused", async (kind) => {
    expect(await fieldsOf(documentWithField(`/A << /S /${kind} >>`))).toEqual({ "Primary Name": "Aria" });
  });

  it("is read past when a trigger is null", async () => {
    expect(await fieldsOf(documentWithField("/AA << /K null >> /A null"))).toEqual({ "Primary Name": "Aria" });
  });
});

describe("a field's own action that does something else", () => {
  it.each(REFUSED_ACTIONS)("refuses the file for a %s action in /A", async (kind, words) => {
    expect(await refusalOf(documentWithField(`/A << /S /${kind} >>`))).toContain(words);
  });

  it.each(REFUSED_ACTIONS)("refuses the file for a %s action in a trigger", async (kind, words) => {
    expect(await refusalOf(documentWithField(`/AA << /K ${SCRIPT} /E << /S /${kind} >> >>`))).toContain(words);
  });

  it.each(REFUSED_ACTIONS)("refuses the file for a %s action that is an object of its own", async (kind, words) => {
    expect(await refusalOf(documentWithField("/A 30 0 R", { 30: `<< /S /${kind} >>` }))).toContain(words);
  });

  it.each(REFUSED_ACTIONS)("refuses the file for a %s action that follows a script", async (kind, words) => {
    expect(await refusalOf(documentWithField(`/A << /S /JavaScript /JS (x) /Next << /S /${kind} >> >>`))).toContain(words);
  });

  it("refuses the file for a refused action in a list that follows a script", async () => {
    expect(await refusalOf(documentWithField(`/A << /S /JavaScript /JS (x) /Next [${SCRIPT} << /S /Launch >>] >>`))).toContain("another program");
  });

  it("refuses the file for a refused action on a parent field", async () => {
    const bytes = treeDocument({
      objects: { 10: "<< /T (Top) /A << /S /URI >> /Kids [11 0 R] >>", 11: fieldWith("/Parent 10 0 R") },
      annotations: [11],
    });
    expect(await refusalOf(bytes)).toContain("web address");
  });

  it("refuses the file for a refused action on a widget kid of a field in the form", async () => {
    const bytes = treeDocument({
      objects: { 10: "<< /T (Top) /FT /Tx /V (x) /Kids [11 0 R] >>", 11: `<< ${WIDGET} /A << /S /SubmitForm >> >>` },
      formFields: [10],
    });
    expect(await refusalOf(bytes)).toContain("send its form somewhere");
  });

  it("refuses the file for a refused action on a field that has no value", async () => {
    const bytes = treeDocument({ objects: { 10: `<< ${WIDGET} /FT /Tx /T (Empty) /A << /S /Launch >> >>` }, annotations: [10] });
    expect(await refusalOf(bytes)).toContain("another program");
  });

  it("refuses the file for a refused action on a field of a kind the reader leaves out", async () => {
    const bytes = treeDocument({ objects: { 10: `<< ${WIDGET} /FT /Sig /T (Signature) /A << /S /Launch >> >>` }, annotations: [10] });
    expect(await refusalOf(bytes)).toContain("another program");
  });

  it.each(["/A 5", "/A [1]", "/A (x)", "/AA 5", "/AA [1]", "/AA << /K 5 >>"])("refuses the file for the action entry %s, which the reader can't make sense of", async (extra) => {
    expect(await refusalOf(documentWithField(extra))).toContain("action the reader can't make sense of");
  });

  it("refuses the file for an action that points at nothing", async () => {
    expect(await refusalOf(documentWithField("/A 99 0 R"))).toContain("object that is not there");
  });
});

describe("a chain of actions", () => {
  function chainOfActions(length: number, last: string): Buffer {
    const objects: Record<number, string> = {};
    for (let step = 0; step < length; step += 1) {
      const number = 40 + step;
      if (step === length - 1) objects[number] = `<< /S /${last} /Next null >>`;
      else objects[number] = `<< /S /JavaScript /JS (x) /Next ${number + 1} 0 R >>`;
    }
    return documentWithField("/A 40 0 R", objects);
  }

  it("is followed for exactly as many steps as nesting allows", async () => {
    expect(await fieldsOf(chainOfActionsEndingInScript(MAX_NESTING + 1))).toEqual({ "Primary Name": "Aria" });
  });

  it("is refused one step further", async () => {
    expect(await refusalOf(chainOfActionsEndingInScript(MAX_NESTING + 2))).toContain("action the reader can't make sense of");
  });

  it("is followed to its end, where a refused action is found", async () => {
    expect(await refusalOf(chainOfActions(MAX_NESTING + 1, "Launch"))).toContain("another program");
  });

  it("is not followed round a circle for ever", async () => {
    const bytes = documentWithField("/A 40 0 R", { 40: "<< /S /JavaScript /JS (x) /Next 41 0 R >>", 41: "<< /S /JavaScript /JS (y) /Next 40 0 R >>" });
    expect(await fieldsOf(bytes)).toEqual({ "Primary Name": "Aria" });
  });

  it("is not followed round a circle of one", async () => {
    const bytes = documentWithField("/A 40 0 R", { 40: "<< /S /JavaScript /JS (x) /Next 40 0 R >>" });
    expect(await fieldsOf(bytes)).toEqual({ "Primary Name": "Aria" });
  });

  it("is looked at once however many fields share an action", async () => {
    const writer = treeWriter({ objects: { 10: fieldWith("/A 40 0 R"), 11: `<< ${WIDGET} /FT /Tx /T (Second) /V (b) /A 40 0 R >>`, 40: SCRIPT }, annotations: [10, 11] });
    expect(Object.keys(await fieldsOf(classicPdf(writer))).length).toBe(2);
  });
});

function chainOfActionsEndingInScript(length: number): Buffer {
  const objects: Record<number, string> = {};
  for (let step = 0; step < length; step += 1) {
    const number = 40 + step;
    if (step === length - 1) objects[number] = "<< /S /JavaScript /JS (x) >>";
    else objects[number] = `<< /S /JavaScript /JS (x) /Next ${number + 1} 0 R >>`;
  }
  return documentWithField("/A 40 0 R", objects);
}
