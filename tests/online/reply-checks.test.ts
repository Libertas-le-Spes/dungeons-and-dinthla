import { describe, expect, it } from "vitest";
import { Refusal } from "../../src/beyond/shape/refusal";
import { A_DIFFERENT_CHARACTER, NO_SUCH_CHARACTER, NOT_A_CHARACTER, NOT_PUBLIC } from "../../src/online/online-words";
import { checkedReply } from "../../src/online/reply-checks";
import { CharacterId } from "../../src/online/character-id";
import { MadeUpReply } from "../beyond/builders/made-up-reply";
import { goodReply, madeUpId, replyWith } from "./builders/made-up-beyond";

function refusedWith(words: string): Refusal {
  return new Refusal(words);
}

describe("checkedReply", () => {
  it("gives the character of a 200 reply of JSON for the id asked for", () => {
    const replied = checkedReply(goodReply(), madeUpId());
    expect(replied.id).toBe(4242);
    expect(replied.character.name.text).toBe("Primary Monk");
    expect(replied.character.route.name).toBe("online");
  });

  it.each(["application/json", "application/json; charset=utf-8", "Application/JSON", "APPLICATION/JSON;charset=UTF-8"])("takes the content type %s", (contentType) => {
    expect(checkedReply(replyWith({ contentType }), madeUpId()).id).toBe(4242);
  });

  it.each([
    [403, NOT_PUBLIC],
    [404, NO_SUCH_CHARACTER],
    [401, NOT_A_CHARACTER],
    [500, NOT_A_CHARACTER],
    [503, NOT_A_CHARACTER],
    [301, NOT_A_CHARACTER],
    [302, NOT_A_CHARACTER],
    [204, NOT_A_CHARACTER],
    [201, NOT_A_CHARACTER],
    [0, NOT_A_CHARACTER],
  ])("refuses status %i in plain words, though the text is a good character", (status, words) => {
    expect(() => checkedReply(replyWith({ status }), madeUpId())).toThrow(refusedWith(words));
  });

  it.each(["", "text/html", "text/plain", "application/xml", "text/html; note=application/json", "x-application/json", " application/json"])("refuses the content type %j, though the text is a good character", (contentType) => {
    expect(() => checkedReply(replyWith({ contentType }), madeUpId())).toThrow(refusedWith(NOT_A_CHARACTER));
  });

  it("refuses a character whose id is not the one asked for", () => {
    expect(() => checkedReply(goodReply(), CharacterId.of("4243"))).toThrow(refusedWith(A_DIFFERENT_CHARACTER));
    expect(() => checkedReply(goodReply(), CharacterId.of("424"))).toThrow(refusedWith(A_DIFFERENT_CHARACTER));
  });

  it("refuses a reply of more than five million bytes before reading it as JSON", () => {
    const refusal = refusalOf(() => checkedReply(replyWith({ text: " ".repeat(5_000_001) }), madeUpId()));
    expect(refusal.message).toBe("The reply is over the limit of 5000000 bytes.");
  });

  it("refuses text that is not JSON, and a reply that says it failed", () => {
    expect(refusalOf(() => checkedReply(replyWith({ text: "<html>" }), madeUpId()))).toBeInstanceOf(Refusal);
    const failed = JSON.stringify({ id: 4242, success: false, message: "no", data: null });
    expect(refusalOf(() => checkedReply(replyWith({ text: failed }), madeUpId()))).toBeInstanceOf(Refusal);
  });

  it("gives back only what the shape and reply code read, never the backstory or notes", () => {
    const text = MadeUpReply.levelOneMonk().with(["notes", "backstory"], "Mira grew up beneath the Pale Moon").wholeText();
    const replied = checkedReply(replyWith({ text }), madeUpId());
    expect(JSON.stringify(replied)).not.toContain("Pale Moon");
  });
});

function refusalOf(run: () => unknown): Refusal {
  try {
    run();
  } catch (error) {
    if (error instanceof Refusal) return error;
    throw error;
  }
  throw new Error("Nothing was refused.");
}
