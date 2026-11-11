import { describe, expect, it } from "vitest";
import type { QuestionRecord } from "../../../src/campaign/record/campaign";
import { questionThreadKind } from "../../../src/campaign/threads/question-thread-kind";
import { followUpWouldGoElsewhere } from "../../../src/campaign/threads/thread-text-checks";

const source = { path: "Pale Moon/Sessions/Session 1.md", line: 0 };
const ferry: QuestionRecord = { text: "Ferry", source, clues: [], answer: null };
const crossing: QuestionRecord = { text: "Ferry: the crossing", source, clues: [], answer: { text: "done", source } };

describe("followUpWouldGoElsewhere", () => {
  it("leaves out an answered question whose text the follow-up starts with", () => {
    expect(followUpWouldGoElsewhere(questionThreadKind, [ferry, crossing], ferry, "the crossing: done")).toBe(false);
  });

  it("keeps an answered question's own follow-up with it", () => {
    expect(followUpWouldGoElsewhere(questionThreadKind, [ferry, crossing], crossing, "done again")).toBe(false);
  });
});
