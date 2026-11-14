import { describe, expect, it } from "vitest";
import { AGREED, NOT_YET } from "../../../src/imports/agreement/agreement-answers";
import { CampaignAgreement } from "../../../src/imports/agreement/campaign-agreement";
import { AGREEMENT_KEY, DeviceAgreement } from "../../../src/imports/agreement/device-agreement";
import { FirstPress } from "../../../src/imports/agreement/first-press";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { MadeUpAsking } from "./made-up-asking";
import { MadeUpDevice } from "./made-up-device";
import { pressOn } from "./shown-parts";

function nothingToDo(): void {}

const NO_PAGE = { agreementAnswered: nothingToDo };

describe("the first press of the button that would go online", () => {
  it("asks, keeps Continue on this device and answers agreed", async () => {
    const device = new MadeUpDevice();
    const asking = new MadeUpAsking(AGREED);
    const answer = await new FirstPress(new DeviceAgreement(device.storage), asking).answer();
    expect(answer.agreed).toBe(true);
    expect(asking.ask).toHaveBeenCalledOnce();
    expect(device.saveLocalStorage).toHaveBeenCalledExactlyOnceWith(AGREEMENT_KEY, true);
  });

  it("never asks again after Continue, and answers agreed each time", async () => {
    const device = new MadeUpDevice();
    const asking = new MadeUpAsking(AGREED);
    const press = new FirstPress(new DeviceAgreement(device.storage), asking);
    await press.answer();
    const second = await press.answer();
    const third = await press.answer();
    expect(second.agreed).toBe(true);
    expect(third.agreed).toBe(true);
    expect(asking.ask).toHaveBeenCalledOnce();
    expect(device.saveLocalStorage).toHaveBeenCalledOnce();
  });

  it("keeps nothing for Use a PDF instead, answers not yet, and asks again at the next press", async () => {
    const device = new MadeUpDevice();
    const asking = new MadeUpAsking(NOT_YET);
    const press = new FirstPress(new DeviceAgreement(device.storage), asking);
    const first = await press.answer();
    const second = await press.answer();
    expect(first.agreed).toBe(false);
    expect(second.agreed).toBe(false);
    expect(asking.ask).toHaveBeenCalledTimes(2);
    expect(device.saveLocalStorage).not.toHaveBeenCalled();
  });

  it("doesn't ask on a device that agreed at campaign creation", async () => {
    const device = MadeUpDevice.agreed();
    const asking = new MadeUpAsking(NOT_YET);
    const answer = await new FirstPress(new DeviceAgreement(device.storage), asking).answer();
    expect(answer.agreed).toBe(true);
    expect(asking.ask).not.toHaveBeenCalled();
  });

  it("asks when the campaign step was answered Not yet on this device", async () => {
    const device = new MadeUpDevice();
    const agreement = new DeviceAgreement(device.storage);
    const stepEl = obsidianDocument().createElement("div");
    new CampaignAgreement(agreement).showIn(stepEl, NO_PAGE);
    pressOn(stepEl, "Not yet");
    const asking = new MadeUpAsking(AGREED);
    const answer = await new FirstPress(agreement, asking).answer();
    expect(asking.ask).toHaveBeenCalledOnce();
    expect(answer.agreed).toBe(true);
  });
});
