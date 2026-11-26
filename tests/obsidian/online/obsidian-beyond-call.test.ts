import { afterEach, describe, expect, it } from "vitest";
import { OBSIDIAN_BEYOND_CALL } from "../../../src/obsidian/online/obsidian-beyond-call";
import { BEYOND_ADDRESS } from "../../../src/online/beyond-address";
import { CharacterId } from "../../../src/online/character-id";
import { answerUrlsWith, forgetUrls, urlsAsked } from "../../stubs/obsidian";
import type { RequestUrlResponse } from "obsidian";

function answered(headers: Record<string, string>): RequestUrlResponse {
  return { status: 200, headers, text: "{}", json: { leaked: true }, arrayBuffer: new ArrayBuffer(0) };
}

afterEach(() => {
  forgetUrls();
});

describe("OBSIDIAN_BEYOND_CALL", () => {
  it("asks for the constant address and the character's digits with a GET, and nothing else", async () => {
    answerUrlsWith(async () => answered({ "content-type": "application/json" }));
    await OBSIDIAN_BEYOND_CALL.get(CharacterId.of("https://www.dndbeyond.com/characters/424242424/builder?x=1"));
    expect(urlsAsked).toEqual([{ url: `${BEYOND_ADDRESS}424242424`, method: "GET", throw: false }]);
    const [asked] = urlsAsked;
    if (asked === undefined) throw new Error("Nothing was asked.");
    expect(Object.keys(asked)).toEqual(["url", "method", "throw"]);
  });

  it("asks exactly once for each call", async () => {
    answerUrlsWith(async () => answered({}));
    await OBSIDIAN_BEYOND_CALL.get(CharacterId.of("7"));
    await OBSIDIAN_BEYOND_CALL.get(CharacterId.of("8"));
    expect(urlsAsked.map((asked) => asked.url)).toEqual([`${BEYOND_ADDRESS}7`, `${BEYOND_ADDRESS}8`]);
  });

  it("gives back the status, the content type and the text, and nothing else of the reply", async () => {
    answerUrlsWith(async () => answered({ "content-type": "application/json; charset=utf-8", "set-cookie": "a=b" }));
    const reply = await OBSIDIAN_BEYOND_CALL.get(CharacterId.of("7"));
    expect(reply).toEqual({ status: 200, contentType: "application/json; charset=utf-8", text: "{}" });
    expect(Object.keys(reply)).toEqual(["status", "contentType", "text"]);
  });

  it("reads the content type under either way of writing its name, and gives an empty one when there is none", async () => {
    answerUrlsWith(async () => answered({ "Content-Type": "application/json" }));
    expect((await OBSIDIAN_BEYOND_CALL.get(CharacterId.of("7"))).contentType).toBe("application/json");
    answerUrlsWith(async () => answered({}));
    expect((await OBSIDIAN_BEYOND_CALL.get(CharacterId.of("7"))).contentType).toBe("");
  });

  it("finds the content type whatever capitals its name has", async () => {
    answerUrlsWith(async () => answered({ "Content-type": "application/json", other: "x" }));
    expect((await OBSIDIAN_BEYOND_CALL.get(CharacterId.of("7"))).contentType).toBe("application/json");
    answerUrlsWith(async () => answered({ "CONTENT-TYPE": "text/html" }));
    expect((await OBSIDIAN_BEYOND_CALL.get(CharacterId.of("7"))).contentType).toBe("text/html");
  });

  it("gives back a status that is not 200 as it is, since the call is told not to throw", async () => {
    answerUrlsWith(async () => ({ ...answered({}), status: 403 }));
    expect((await OBSIDIAN_BEYOND_CALL.get(CharacterId.of("7"))).status).toBe(403);
  });

  it("passes on a failure of the call itself", async () => {
    answerUrlsWith(() => Promise.reject(new Error("offline")));
    await expect(OBSIDIAN_BEYOND_CALL.get(CharacterId.of("7"))).rejects.toThrow("offline");
  });
});
