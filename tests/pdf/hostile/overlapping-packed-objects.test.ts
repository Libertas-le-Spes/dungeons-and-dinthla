import { describe, expect, it } from "vitest";
import { MAX_OBJECT_STREAM_BYTES } from "../../../src/pdf/limits/pdf-limits";
import { FormDocument } from "../writer/documents/form-document";
import { literal } from "../writer/pdf-text";
import { readCounting, reasonOf } from "./step-counting";

class SeededNumbers {
  private state = 12345;

  next(): number {
    this.state = (this.state * 1103515245 + 12345) % 2147483648;
    return this.state % 10000;
  }
}

function arrayOfArrays(inner: number, items: number): string {
  const numbers = new SeededNumbers();
  let text = "[";
  for (let row = 0; row < inner; row += 1) {
    text += "[";
    for (let item = 0; item < items; item += 1) text += `${numbers.next()} `;
    text += "] ";
  }
  return `${text}]`;
}

function formOfTwenty(): FormDocument {
  const form = new FormDocument();
  for (let index = 0; index < 17; index += 1) form.text(`Field ${index}`, literal("v"));
  return form;
}

function allAt(offsetOf: (position: number) => number, count: number): string {
  let header = "";
  for (let position = 0; position < count; position += 1) header += `${10 + position} ${offsetOf(position)} `;
  return header;
}

describe("a packed group whose objects overlap", () => {
  const body = arrayOfArrays(60, 9000);

  it("is refused when twenty objects all sit at the same big array, before any is parsed", async () => {
    const header = allAt(() => 0, 20);
    const bytes = formOfTwenty().streamed({ packed: Array.from({ length: 20 }, (_none, position) => 10 + position), objectStreamText: { count: 20, first: header.length, text: header + body } });
    const counted = await readCounting(bytes);
    expect(reasonOf(counted)).toContain("not packed the way PDF packs them");
    expect(counted.steps).toBeLessThanOrEqual(2 * bytes.length + 2 * body.length);
  });

  it("is refused when each object is read from its own place inside the big array, because the first runs into the second", async () => {
    const header = allAt((position) => position, 20);
    const bytes = formOfTwenty().streamed({ packed: Array.from({ length: 20 }, (_none, position) => 10 + position), objectStreamText: { count: 20, first: header.length, text: header + body } });
    const counted = await readCounting(bytes);
    expect(reasonOf(counted)).toContain("not packed the way PDF packs them");
    expect(counted.steps).toBeLessThanOrEqual(2 * bytes.length + 2 * body.length);
  });
});

describe("a packed group that unpacks to too much", () => {
  it("is refused when one group unpacks to more than the most bytes allowed", async () => {
    const header = "10 0 ";
    const numbers = new SeededNumbers();
    let padding = "\n%";
    while (padding.length <= MAX_OBJECT_STREAM_BYTES) padding += String.fromCharCode(97 + (numbers.next() % 26));
    const bytes = formOfTwenty().streamed({ packed: [10], objectStreamText: { count: 1, first: header.length, text: `${header}[1]${padding}` } });
    expect(reasonOf(await readCounting(bytes))).toContain("A group of objects packed inside the file unpacks to too much");
  });
});
