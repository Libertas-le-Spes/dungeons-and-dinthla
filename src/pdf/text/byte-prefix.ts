export function hasPrefix(bytes: Uint8Array, prefix: readonly number[]): boolean {
  if (bytes.byteLength < prefix.length) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let place = 0;
  for (const expected of prefix) {
    if (view.getUint8(place) !== expected) return false;
    place += 1;
  }
  return true;
}
