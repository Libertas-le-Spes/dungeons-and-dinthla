import type { PdfValue } from "../values/pdf-value";
import type { WorkBudget } from "../work/work-budget";
import { predictionOf } from "./decode-parameters";
import type { BoundedInflater } from "./inflate/bounded-inflater";
import { undoUpPredictor } from "./png-up-predictor";
import type { StreamFilter } from "./stream-filter";

export class FlateFilter implements StreamFilter {
  constructor(
    private readonly inflater: BoundedInflater,
    private readonly work: WorkBudget,
  ) {}

  named(name: string): boolean {
    return name === "FlateDecode";
  }

  async decode(raw: Uint8Array, parameters: PdfValue, predictorAllowed: boolean): Promise<Uint8Array> {
    const prediction = predictionOf(parameters, predictorAllowed);
    const unpacked = await this.inflater.inflate(raw);
    if (prediction === null) return unpacked;
    return undoUpPredictor(unpacked, prediction.columns, this.work);
  }
}
