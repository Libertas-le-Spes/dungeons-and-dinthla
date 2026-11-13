import { padded } from "../object-bytes";

const ENTRY_BYTES = 20;

function tableStartOf(buffer: Buffer): number {
  return buffer.toString("latin1").lastIndexOf("xref\n0 ");
}

export function withEntryOffset(buffer: Buffer, objectNumber: number, offset: number): Buffer {
  const text = buffer.toString("latin1");
  const start = tableStartOf(buffer);
  const firstEntry = text.indexOf("\n", text.indexOf("\n", start) + 1) + 1;
  const patched = Buffer.from(buffer);
  patched.write(padded(offset, 10), firstEntry + ENTRY_BYTES * objectNumber, "latin1");
  return patched;
}

export function offsetOf(buffer: Buffer, objectNumber: number): number {
  return buffer.toString("latin1").indexOf(`\n${objectNumber} 0 obj`) + 1;
}

export function tableOffsetOf(buffer: Buffer): number {
  return tableStartOf(buffer);
}
