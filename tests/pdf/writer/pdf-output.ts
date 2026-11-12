import { bytesOf } from "./object-bytes";

export class PdfOutput {
  private readonly parts: Buffer[] = [];
  private written = 0;
  private origin = 0;

  put(content: string | Buffer): number {
    const start = this.written - this.origin;
    const bytes = this.asBytes(content);
    this.parts.push(bytes);
    this.written += bytes.length;
    return start;
  }

  startFileHere(): void {
    this.origin = this.written;
  }

  toBuffer(): Buffer {
    return Buffer.concat(this.parts);
  }

  private asBytes(content: string | Buffer): Buffer {
    if (typeof content === "string") return bytesOf(content);
    return content;
  }
}
