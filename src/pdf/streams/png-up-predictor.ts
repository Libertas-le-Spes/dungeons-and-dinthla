import { PdfRefusal } from "../refusals/pdf-refusal";
import type { WorkBudget } from "../work/work-budget";

const UP_TAG = 2;
const BAD_ROWS = "A compressed part of the file is laid out in rows the reader does not understand, so it was not read.";

function aboveByte(unrolled: DataView, row: number, column: number, columns: number): number {
  if (row === 0) return 0;
  return unrolled.getUint8((row - 1) * columns + column);
}

export function undoUpPredictor(packed: Uint8Array, columns: number, work: WorkBudget): Uint8Array {
  const rowSize = columns + 1;
  if (columns < 1 || packed.byteLength % rowSize !== 0) throw new PdfRefusal(BAD_ROWS);
  const rows = packed.byteLength / rowSize;
  const unrolled = new Uint8Array(rows * columns);
  const input = new DataView(packed.buffer, packed.byteOffset, packed.byteLength);
  const output = new DataView(unrolled.buffer, unrolled.byteOffset, unrolled.byteLength);
  for (let row = 0; row < rows; row += 1) {
    if (input.getUint8(row * rowSize) !== UP_TAG) throw new PdfRefusal(BAD_ROWS);
    for (let column = 0; column < columns; column += 1) {
      work.spend();
      const delta = input.getUint8(row * rowSize + 1 + column);
      output.setUint8(row * columns + column, delta + aboveByte(output, row, column, columns));
    }
  }
  return unrolled;
}
