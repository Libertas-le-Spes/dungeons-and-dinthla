import { STEPS_PER_TIME_CHECK } from "../../../src/pdf/limits/pdf-limits";
import { readPdfFieldsWith } from "../../../src/pdf/read-pdf-fields";
import type { PdfReadResult } from "../../../src/pdf/pdf-read-result";
import { inflateWithZlib } from "../writer/zlib-chunks";

export interface Counted {
  result: PdfReadResult;
  steps: number;
}

export async function readCounting(bytes: Uint8Array): Promise<Counted> {
  let looks = 0;
  const clock = (): number => {
    looks += 1;
    return 0;
  };
  const result = await readPdfFieldsWith(bytes, { startInflating: inflateWithZlib, clock });
  return { result, steps: looks * STEPS_PER_TIME_CHECK };
}

export function reasonOf(counted: Counted): string {
  if (counted.result.ok) return "";
  return counted.result.reason;
}
