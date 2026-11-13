import { dataViewOf } from "../bytes/data-view-of";
export function hasPrefix(bytes: Uint8Array, prefix: readonly number[]): boolean {
  if (bytes.byteLength < prefix.length) return false;
  const view = dataViewOf(bytes);
  let place = 0;
  for (const expected of prefix) {
    if (view.getUint8(place) !== expected) return false;
    place += 1;
  }
  return true;
}
