export function firstBytes(bytes: Buffer, length: number): Buffer {
  const cut = Buffer.alloc(length);
  bytes.copy(cut, 0, 0, length);
  return cut;
}
