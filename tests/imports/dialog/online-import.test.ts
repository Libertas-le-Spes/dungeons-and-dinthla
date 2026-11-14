import type { RequestUrlResponse } from "obsidian";
import { afterEach, describe, expect, it } from "vitest";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { AGREED, NOT_YET } from "../../../src/imports/agreement/agreement-answers";
import { DeviceAgreement } from "../../../src/imports/agreement/device-agreement";
import { FirstPress } from "../../../src/imports/agreement/first-press";
import { NOTHING_SENT } from "../../../src/imports/dialog/import-words";
import { OnlineImport } from "../../../src/imports/dialog/online/online-import";
import { callBeyond } from "../../../src/online/beyond-call";
import { BEYOND_ADDRESS } from "../../../src/online/beyond-address";
import { BeyondCalls } from "../../../src/online/call-rules";
import { NOT_A_CHARACTER_LINK } from "../../../src/online/online-words";
import { answerUrlsWith, forgetUrls, urlsAsked } from "../../stubs/obsidian";
import { MadeUpReply } from "../../beyond/builders/made-up-reply";
import { MadeUpAsking } from "../agreement/made-up-asking";
import { MadeUpDevice } from "../agreement/made-up-device";

function goodAnswer(): RequestUrlResponse {
  return { status: 200, headers: { "content-type": "application/json" }, text: MadeUpReply.levelOneMonk().wholeText(), json: null, arrayBuffer: new ArrayBuffer(0) };
}

function onlineWith(device: MadeUpDevice, asking: MadeUpAsking): OnlineImport {
  return new OnlineImport(new FirstPress(new DeviceAgreement(device.storage), asking), new BeyondCalls(callBeyond, () => 0));
}

afterEach(() => {
  forgetUrls();
});

describe("OnlineImport", () => {
  it("asks the agreement at the first press, then asks D&D Beyond once for the digits and gives the sheet of an online character", async () => {
    answerUrlsWith(async () => goodAnswer());
    const asking = new MadeUpAsking(AGREED);
    const sheet = await onlineWith(new MadeUpDevice(), asking).sheetFor("https://www.dndbeyond.com/characters/4242/builder");
    expect(asking.ask).toHaveBeenCalledOnce();
    expect(urlsAsked).toEqual([{ url: `${BEYOND_ADDRESS}4242`, method: "GET", throw: false }]);
    expect(sheet.character.name.text).toBe("Primary Monk");
    expect(sheet.character.route.name).toBe("online");
    expect(sheet.leftOut).toEqual({ items: { tooLong: 0, notClean: 0 }, spells: { tooLong: 0, notClean: 0 }, features: { tooLong: 0, notClean: 0 } });
  });

  it("sends nothing and says so when the agreement is not given, and asks again at the next press", async () => {
    answerUrlsWith(async () => goodAnswer());
    const asking = new MadeUpAsking(NOT_YET);
    const online = onlineWith(new MadeUpDevice(), asking);
    await expect(online.sheetFor("4242")).rejects.toThrow(new Refusal(NOTHING_SENT));
    await expect(online.sheetFor("4242")).rejects.toThrow(new Refusal(NOTHING_SENT));
    expect(urlsAsked).toEqual([]);
    expect(asking.ask).toHaveBeenCalledTimes(2);
  });

  it("does not ask the agreement again on a device that gave it", async () => {
    answerUrlsWith(async () => goodAnswer());
    const asking = new MadeUpAsking(NOT_YET);
    await onlineWith(MadeUpDevice.agreed(), asking).sheetFor("4242");
    expect(asking.ask).not.toHaveBeenCalled();
    expect(urlsAsked).toHaveLength(1);
  });

  it("refuses text that is not a character's link or number before asking the agreement or sending anything", async () => {
    answerUrlsWith(async () => goodAnswer());
    const asking = new MadeUpAsking(AGREED);
    const online = onlineWith(new MadeUpDevice(), asking);
    await expect(online.sheetFor("my character")).rejects.toThrow(new Refusal(NOT_A_CHARACTER_LINK));
    await expect(online.sheetFor("4242?extra=1")).rejects.toThrow(new Refusal(NOT_A_CHARACTER_LINK));
    expect(asking.ask).not.toHaveBeenCalled();
    expect(urlsAsked).toEqual([]);
  });

  it("sends only the constant address and digits for every kind of link", async () => {
    answerUrlsWith(async () => goodAnswer());
    const device = MadeUpDevice.agreed();
    for (const link of ["4242", "dndbeyond.com/characters/4242", "https://www.dndbeyond.com/characters/4242/sheet?a=b#c"]) {
      const online = new OnlineImport(new FirstPress(new DeviceAgreement(device.storage), new MadeUpAsking(AGREED)), new BeyondCalls(callBeyond, () => 0));
      await online.sheetFor(link);
    }
    expect(urlsAsked.map((asked) => asked.url)).toEqual([`${BEYOND_ADDRESS}4242`, `${BEYOND_ADDRESS}4242`, `${BEYOND_ADDRESS}4242`]);
    for (const asked of urlsAsked) expect(Object.keys(asked)).toEqual(["url", "method", "throw"]);
  });
});
