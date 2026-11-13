import { describe, expect, it } from "vitest";
import { predictionOf } from "../../../src/pdf/streams/decode-parameters";
import { PdfAbsent } from "../../../src/pdf/values/scalars/pdf-absent";
import { parsed, refusalFrom } from "../support/parsed";

describe("predictionOf", () => {
  it("finds no prediction when there are no parameters", () => {
    expect(predictionOf(PdfAbsent.ABSENT, true)).toBeNull();
    expect(predictionOf(parsed("null"), true)).toBeNull();
    expect(predictionOf(parsed("<< >>"), true)).toBeNull();
  });

  it("finds no prediction for the predictor 1", () => {
    expect(predictionOf(parsed("<< /Predictor 1 >>"), true)).toBeNull();
  });

  it("finds the up predictor and its columns", () => {
    expect(predictionOf(parsed("<< /Predictor 12 /Columns 7 >>"), true)).toEqual({ columns: 7 });
  });

  it("takes one column when none are named", () => {
    expect(predictionOf(parsed("<< /Predictor 12 >>"), true)).toEqual({ columns: 1 });
  });

  it("refuses the up predictor where predictors are not allowed", () => {
    expect(refusalFrom(() => predictionOf(parsed("<< /Predictor 12 >>"), false))).toContain("settings the reader does not understand");
  });

  it.each([2, 10, 11, 13, 14, 15, 0, 99])("refuses the predictor %s", (predictor) => {
    expect(refusalFrom(() => predictionOf(parsed(`<< /Predictor ${predictor} >>`), true))).toContain("settings the reader does not understand");
  });

  it.each(["/Predictor /Up", "/Predictor 12.0", "/Predictor 12 /Columns /A", "/Predictor 12 /Columns 3.5"])("refuses the settings %s", (entries) => {
    expect(refusalFrom(() => predictionOf(parsed(`<< ${entries} >>`), true))).toContain("settings the reader does not understand");
  });

  it("reads the parameters of a one-item list of filters", () => {
    expect(predictionOf(parsed("[<< /Predictor 12 /Columns 4 >>]"), true)).toEqual({ columns: 4 });
    expect(predictionOf(parsed("[null]"), true)).toBeNull();
  });

  it.each(["[]", "[<< >> << >>]", "5", "(text)", "/Name", "3 0 R", "[5]"])("refuses the parameters %s", (text) => {
    expect(refusalFrom(() => predictionOf(parsed(text), true))).toContain("settings the reader does not understand");
  });

  it("refuses colours other than one, and bits other than eight", () => {
    expect(refusalFrom(() => predictionOf(parsed("<< /Predictor 12 /Colors 3 >>"), true))).toContain("settings the reader does not understand");
    expect(refusalFrom(() => predictionOf(parsed("<< /Predictor 12 /BitsPerComponent 16 >>"), true))).toContain("settings the reader does not understand");
  });

  it("accepts the plain colours and bits stated outright", () => {
    expect(predictionOf(parsed("<< /Predictor 12 /Colors 1 /BitsPerComponent 8 /Columns 5 >>"), true)).toEqual({ columns: 5 });
  });
});
