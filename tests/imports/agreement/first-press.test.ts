import { describe, expect, it } from "vitest";
import { AGREED, NOT_YET } from "../../../src/imports/agreement/agreement-answers";
import { CampaignAgreement } from "../../../src/imports/agreement/campaign-agreement";
import { AGREEMENT_KEY, KeptAgreement } from "../../../src/imports/agreement/kept-agreement";
import { FirstPress } from "../../../src/imports/agreement/first-press";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { MadeUpAsking } from "./made-up-asking";
import { MadeUpDevice } from "./made-up-device";
import { pressOn } from "./shown-parts";

function nothingToDo(): void {}

describe("the first press of the button that would go online", () => {
  it("asks, keeps Import in the vault and answers agreed", async () => {
    const device = new MadeUpDevice();
    const asking = new MadeUpAsking(AGREED);
    const answer = await new FirstPress(new KeptAgreement(device.places), asking).answer();
    expect(answer.agreed).toBe(true);
    expect(asking.ask).toHaveBeenCalledOnce();
    expect(device.keepAgreed).toHaveBeenCalledOnce();
  });

  it("never asks again after Import, and answers agreed each time", async () => {
    const device = new MadeUpDevice();
    const asking = new MadeUpAsking(AGREED);
    const press = new FirstPress(new KeptAgreement(device.places), asking);
    await press.answer();
    const second = await press.answer();
    const third = await press.answer();
    expect(second.agreed).toBe(true);
    expect(third.agreed).toBe(true);
    expect(asking.ask).toHaveBeenCalledOnce();
    expect(device.keepAgreed).toHaveBeenCalledOnce();
  });

  it("keeps nothing for Cancel, answers not yet, and asks again at the next press", async () => {
    const device = new MadeUpDevice();
    const asking = new MadeUpAsking(NOT_YET);
    const press = new FirstPress(new KeptAgreement(device.places), asking);
    const first = await press.answer();
    const second = await press.answer();
    expect(first.agreed).toBe(false);
    expect(second.agreed).toBe(false);
    expect(asking.ask).toHaveBeenCalledTimes(2);
    expect(device.keepAgreed).not.toHaveBeenCalled();
  });

  it("doesn't ask in a vault that agreed at campaign creation", async () => {
    const device = MadeUpDevice.agreed();
    const asking = new MadeUpAsking(NOT_YET);
    const answer = await new FirstPress(new KeptAgreement(device.places), asking).answer();
    expect(answer.agreed).toBe(true);
    expect(asking.ask).not.toHaveBeenCalled();
  });

  it("asks when the campaign step was answered Not yet", async () => {
    const device = new MadeUpDevice();
    const agreement = new KeptAgreement(device.places);
    const stepEl = obsidianDocument().createElement("div");
    new CampaignAgreement(agreement).showIn(stepEl, nothingToDo);
    pressOn(stepEl, "Not yet");
    const asking = new MadeUpAsking(AGREED);
    const answer = await new FirstPress(agreement, asking).answer();
    expect(asking.ask).toHaveBeenCalledOnce();
    expect(answer.agreed).toBe(true);
  });
});
