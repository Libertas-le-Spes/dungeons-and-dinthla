export function viewOf(bytes: Uint8Array, start: number, length: number): Uint8Array {
  return new Uint8Array(bytes.buffer, bytes.byteOffset + start, length);
}
