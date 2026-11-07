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

  it("reads a giver and a reward without a comma between them", () => {
    expect(readQuest("Slay the wolf from: [[Tor]] reward: 50 gp")).toEqual({
      title: "Slay the wolf",
      givenBy: "[[Tor]]",
      reward: "50 gp",
    });
  });

  it("keeps a reward written with a thousands comma whole", () => {
    expect(readQuest("Escort the duke, reward: 1,000 gp")).toEqual({ title: "Escort the duke", reward: "1,000 gp" });
  });

  it("keeps a linked name that has a comma in it whole", () => {
    expect(readQuest("Find the seal, from: [[Vess, Lady of Ash]]")).toEqual({
      title: "Find the seal",
      givenBy: "[[Vess, Lady of Ash]]",
    });
  });

  it("keeps words after the facts in the title", () => {
    expect(readQuest("Find the caravan, from: [[Lady Vess]], before the thaw")).toEqual({
      title: "Find the caravan, before the thaw",
      givenBy: "[[Lady Vess]]",
    });
  });

  it("ignores a fact with nothing after it", () => {
    expect(readQuest("Clear the cellar, from: ,")).toEqual({ title: "Clear the cellar" });
  });

  it("reads a very long line quickly", () => {
    const started = performance.now();
    readQuest(`a${",".repeat(50_000)}b${" ".repeat(50_000)}from:`);
    expect(performance.now() - started).toBeLessThan(200);
  });
});
