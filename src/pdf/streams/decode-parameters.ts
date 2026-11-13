import { PdfRefusal } from "../refusals/pdf-refusal";
import type { PdfDictionary } from "../values/pdf-dictionary";
import type { PdfValue } from "../values/pdf-value";

const NO_PREDICTOR = 1;
const UP_PREDICTOR = 12;
const PLAIN_COLORS = 1;
const PLAIN_BITS = 8;
const BAD_PARAMETERS = "A compressed part of the file has settings the reader does not understand, so it was not read.";

export interface RowPrediction {
  columns: number;
}

function dictionaryOrRefuse(value: PdfValue): PdfDictionary | null {
  if (!value.isPresent()) return null;
  const dictionary = value.asDictionary();
  if (dictionary === null) throw new PdfRefusal(BAD_PARAMETERS);
  return dictionary;
}

function parametersDictionary(value: PdfValue): PdfDictionary | null {
  const array = value.asArray();
  if (array === null) return dictionaryOrRefuse(value);
  const only = array.single();
  if (only === null) throw new PdfRefusal(BAD_PARAMETERS);
  return dictionaryOrRefuse(only);
}

function wholeNumberOr(value: PdfValue, fallback: number): number {
  if (!value.isPresent()) return fallback;
  const whole = value.asInteger();
  if (whole === null) throw new PdfRefusal(BAD_PARAMETERS);
  return whole;
}

function refuseUnusualPixels(dictionary: PdfDictionary): void {
  const colors = wholeNumberOr(dictionary.get("Colors"), PLAIN_COLORS);
  const bits = wholeNumberOr(dictionary.get("BitsPerComponent"), PLAIN_BITS);
  if (colors !== PLAIN_COLORS || bits !== PLAIN_BITS) throw new PdfRefusal(BAD_PARAMETERS);
}

export function predictionOf(parameters: PdfValue, predictorAllowed: boolean): RowPrediction | null {
  const dictionary = parametersDictionary(parameters);
  if (dictionary === null) return null;
  const predictor = wholeNumberOr(dictionary.get("Predictor"), NO_PREDICTOR);
  if (predictor === NO_PREDICTOR) return null;
  if (predictor !== UP_PREDICTOR || !predictorAllowed) throw new PdfRefusal(BAD_PARAMETERS);
  refuseUnusualPixels(dictionary);
  return { columns: wholeNumberOr(dictionary.get("Columns"), 1) };
}
