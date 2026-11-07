import { describe, expect, it } from "vitest";
import { readQuest } from "../../src/notes/quest";

describe("readQuest", () => {
  it("separates the title from who gave it and the reward", () => {
    expect(readQuest("Find the caravan, from: [[Lady Vess]], reward: 200 gp")).toEqual({
      title: "Find the caravan",
      givenBy: "[[Lady Vess]]",
      reward: "200 gp",
    });
  });

  it("reads a quest with only a title", () => {
    expect(readQuest("Clear the cellar")).toEqual({ title: "Clear the cellar" });
  });

  it("reads a reward without a giver", () => {
    expect(readQuest("Slay the wolf reward: 50 gp")).toEqual({ title: "Slay the wolf", reward: "50 gp" });
  });
});
