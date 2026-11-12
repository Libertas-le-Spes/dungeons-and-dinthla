export function byteCountOf(text: string): number {
  return new TextEncoder().encode(text).length;
}
