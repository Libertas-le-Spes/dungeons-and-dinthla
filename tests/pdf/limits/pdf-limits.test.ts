import { describe, expect, it } from "vitest";
import * as limits from "../../../src/pdf/limits/pdf-limits";

const MEBIBYTE = 1024 * 1024;

describe("the limits", () => {
  it("are the ones the plan lists", () => {
    expect({
      file: limits.MAX_FILE_BYTES,
      sections: limits.MAX_XREF_SECTIONS,
      entries: limits.MAX_XREF_ENTRIES,
      objects: limits.MAX_OBJECTS_PARSED,
      inStream: limits.MAX_OBJECTS_IN_STREAM,
      nesting: limits.MAX_NESTING,
      fieldDepth: limits.MAX_FIELD_DEPTH,
      fields: limits.MAX_FIELDS,
      stream: limits.MAX_STREAM_BYTES,
      allStreams: limits.MAX_ALL_STREAM_BYTES,
      ratioAbove: limits.RATIO_CHECKED_ABOVE_BYTES,
      ratio: limits.MAX_RATIO,
      string: limits.MAX_STRING_BYTES,
      fieldText: limits.MAX_FIELD_TEXT_CHARACTERS,
      name: limits.MAX_NAME_BYTES,
      time: limits.TIME_LIMIT_MS,
      timeSteps: limits.STEPS_PER_TIME_CHECK,
    }).toEqual({
      file: 10 * MEBIBYTE,
      sections: 32,
      entries: 100_000,
      objects: 20_000,
      inStream: 10_000,
      nesting: 32,
      fieldDepth: 16,
      fields: 2_000,
      stream: 16 * MEBIBYTE,
      allStreams: 32 * MEBIBYTE,
      ratioAbove: MEBIBYTE,
      ratio: 200,
      string: 64 * 1024,
      fieldText: 8_000,
      name: 127,
      time: 5_000,
      timeSteps: 1_000,
    });
  });
});
