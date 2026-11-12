export function bytesOf(text: string): Buffer {
  return Buffer.from(text, "latin1");
}

export function padded(value: number, width: number): string {
  return String(value).padStart(width, "0");
}
