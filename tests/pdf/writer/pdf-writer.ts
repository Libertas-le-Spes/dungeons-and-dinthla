import { bytesOf } from "./object-bytes";

export class PdfWriter {
  private readonly bodies = new Map<number, Buffer>();

  set(number: number, body: string | Buffer): void {
    if (typeof body === "string") this.bodies.set(number, bytesOf(body));
    else this.bodies.set(number, body);
  }

  stream(number: number, dictionary: string, data: Buffer, declaredLength: string): void {
    this.set(number, Buffer.concat([bytesOf(`<< ${dictionary} /Length ${declaredLength} >>\nstream\n`), data, bytesOf("\nendstream")]));
  }

  highestNumber(): number {
    return Math.max(...this.bodies.keys());
  }

  numbers(): number[] {
    return [...this.bodies.keys()].sort(byValue);
  }

  bodyOf(number: number): Buffer {
    const body = this.bodies.get(number);
    if (body === undefined) throw new Error(`The test PDF has no object ${number}.`);
    return body;
  }
}

export function byValue(first: number, second: number): number {
  return first - second;
}
