import { afterEach, describe, expect, it } from "vitest";
import { answerUrlsWith, forgetUrls, requestUrl, urlsAsked } from "./obsidian";

afterEach(() => {
  forgetUrls();
});

describe("the requestUrl stub", () => {
  it("throws when a test has not said what it answers, and still records what was asked", async () => {
    await expect(requestUrl({ url: "https://example.invalid/1" })).rejects.toThrow("without saying what it answers");
    expect(urlsAsked.map((asked) => asked.url)).toEqual(["https://example.invalid/1"]);
  });

  it("answers with what the test gave, and forgets it when told to", async () => {
    answerUrlsWith(async () => ({ status: 200 }) as never);
    expect((await requestUrl({ url: "https://example.invalid/2" })).status).toBe(200);
    forgetUrls();
    expect(urlsAsked).toEqual([]);
    await expect(requestUrl({ url: "https://example.invalid/3" })).rejects.toThrow();
  });
});
