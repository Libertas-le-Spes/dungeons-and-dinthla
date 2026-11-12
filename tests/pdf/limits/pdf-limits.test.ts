import { describe, expect, it } from "vitest";
import * as limits from "../../../src/pdf/limits/pdf-limits";

const KIBIBYTE = 1024;
const MEBIBYTE = 1024 * KIBIBYTE;

const PLANNED: Record<string, number> = {
  MAX_FILE_BYTES: 10 * MEBIBYTE,
  MAX_XREF_SECTIONS: 32,
  MAX_XREF_ENTRIES: 100_000,
  MAX_OBJECTS_PARSED: 20_000,
  MAX_OBJECTS_IN_STREAM: 10_000,
  MAX_NESTING: 32,
  MAX_FIELD_DEPTH: 16,
  MAX_FIELDS: 2_000,
  MAX_ITEMS_IN_CONTAINER: 10_000,
  MAX_STREAM_BYTES: 16 * MEBIBYTE,
  MAX_OBJECT_STREAM_BYTES: 4 * MEBIBYTE,
  MAX_VALUES_PARSED: 1_000_000,
  MAX_ALL_STREAM_BYTES: 32 * MEBIBYTE,
  RATIO_CHECKED_ABOVE_BYTES: MEBIBYTE,
  MAX_RATIO: 200,
  MAX_STRING_BYTES: 64 * KIBIBYTE,
  MAX_FIELD_TEXT_CHARACTERS: 8_000,
  MAX_NAME_BYTES: 127,
  MAX_NUMBER_CHARACTERS: 20,
  MAX_ENTRY_FIELD_WIDTH: 4,
  TIME_LIMIT_MS: 5_000,
  STEPS_PER_TIME_CHECK: 1_000,
  WORK_PER_BYTE: 8,
  WORK_EXTRA: MEBIBYTE,
  HEADER_WINDOW_BYTES: KIBIBYTE,
  TRAILER_WINDOW_BYTES: KIBIBYTE,
  MAX_PAGE_TREE_DEPTH: 16,
};

describe("the limits", () => {
  it.each(Object.entries(PLANNED))("%s is %s", (name, value) => {
    expect(Object.entries(limits)).toContainEqual([name, value]);
  });

  it("are exactly the ones planned, with none left out of the list", () => {
    expect(Object.keys(limits).sort()).toEqual(Object.keys(PLANNED).sort());
  });
});
