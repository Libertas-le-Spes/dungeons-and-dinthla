import { describe, expect, it, vi } from "vitest";
import { CampaignAgreement } from "../../../src/imports/agreement/campaign-agreement";
import { AGREEMENT_KEY, KeptAgreement } from "../../../src/imports/agreement/kept-agreement";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { MadeUpDevice } from "./made-up-device";
import { mountedIn, pressOn, textsIn } from "./shown-parts";

class MadeUpPage {
  readonly answered = vi.fn();
}

function shownStep(device: MadeUpDevice, page: MadeUpPage): { agreement: CampaignAgreement; stepEl: HTMLElement } {
  const agreement = new CampaignAgreement(new KeptAgreement(device.places));
  const stepEl = obsidianDocument().createElement("div");
  mountedIn(stepEl, agreement.trees(page.answered));
  return { agreement, stepEl };
}

describe("the agreement step at campaign creation", () => {
  it("shows the agreement's own words with Agree and Not yet", () => {
    const { stepEl } = shownStep(new MadeUpDevice(), new MadeUpPage());
    expect(textsIn(stepEl, ".dd-agreement-title")).toEqual(["Bring in your character from D&D Beyond?"]);
    expect(textsIn(stepEl, ".dd-agreement-words")).toEqual([
      "The plugin asks D&D Beyond for your character by its number, and sends nothing else. The character must be set to Public there, so anyone with its link can see it. Its backstory and notes are never saved.",
    ]);
    expect(textsIn(stepEl, "button")).toEqual(["Agree", "Not yet"]);
    expect(stepEl.querySelector("button.mod-cta")).toBeNull();
  });

  it("is wanted on a device that hasn't agreed", () => {
    const agreement = new CampaignAgreement(new KeptAgreement(new MadeUpDevice().places));
    expect(agreement.wanted()).toBe(true);
  });

  it("is not wanted on a device that agreed already", () => {
    const agreement = new CampaignAgreement(new KeptAgreement(MadeUpDevice.agreed().places));
    expect(agreement.wanted()).toBe(false);
  });

  it("keeps Agree in the vault, then tells the page once", () => {
    const device = new MadeUpDevice();
    const page = new MadeUpPage();
    const { agreement, stepEl } = shownStep(device, page);
    pressOn(stepEl, "Agree");
    expect(device.keepAgreed).toHaveBeenCalledOnce();
    expect(page.answered).toHaveBeenCalledOnce();
    expect(agreement.wanted()).toBe(false);
  });

  it("keeps nothing for Not yet, tells the page once, and isn't wanted again while the plugin runs", () => {
    const device = new MadeUpDevice();
    const page = new MadeUpPage();
    const { agreement, stepEl } = shownStep(device, page);
    pressOn(stepEl, "Not yet");
    expect(device.keepAgreed).not.toHaveBeenCalled();
    expect(page.answered).toHaveBeenCalledOnce();
    expect(agreement.wanted()).toBe(false);
  });
});
