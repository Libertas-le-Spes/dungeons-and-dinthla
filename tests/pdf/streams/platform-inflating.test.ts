import { afterEach, describe, expect, it, vi } from "vitest";
import { startPlatformInflating } from "../../../src/pdf/streams/inflate/platform-inflating";
import { refusalFrom } from "../support/parsed";

class StubDecompressionStream {
  static made: string[] = [];
  readonly readable = { getReader: () => ({ marker: "reader" }) };
  readonly writable = {};

  constructor(format: string) {
    StubDecompressionStream.made.push(format);
  }
}

class StubBlob {
  static made = 0;
  static packed: number[] = [];

  constructor(parts: Uint8Array[]) {
    StubBlob.made += 1;
    for (const part of parts) StubBlob.packed.push(...part);
  }

  stream() {
    return {
      pipeThrough: (through: StubDecompressionStream) => through.readable,
    };
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  StubDecompressionStream.made = [];
  StubBlob.made = 0;
  StubBlob.packed = [];
});

describe("startPlatformInflating", () => {
  it("refuses plainly, and reads nothing, when the device has no DecompressionStream", () => {
    vi.stubGlobal("DecompressionStream", undefined);
    expect(refusalFrom(() => startPlatformInflating(new Uint8Array(3)))).toBe("This device can't read PDFs, so the file was not read.");
  });

  it("does not make a Blob when the device has no DecompressionStream", () => {
    vi.stubGlobal("DecompressionStream", undefined);
    vi.stubGlobal("Blob", StubBlob);
    refusalFrom(() => startPlatformInflating(new Uint8Array(3)));
    expect(StubBlob.made).toBe(0);
  });

  it("asks for one decompression stream of the deflate format, over one blob of the packed bytes", () => {
    vi.stubGlobal("DecompressionStream", StubDecompressionStream);
    vi.stubGlobal("Blob", StubBlob);
    startPlatformInflating(Uint8Array.from([1, 2, 3]));
    expect(StubDecompressionStream.made).toEqual(["deflate"]);
    expect(StubBlob.made).toBe(1);
    expect(StubBlob.packed).toEqual([1, 2, 3]);
  });
});
