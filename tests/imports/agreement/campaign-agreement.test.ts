import { describe, expect, it, vi } from "vitest";
import { CampaignAgreement } from "../../../src/imports/agreement/campaign-agreement";
import { AGREEMENT_KEY, DeviceAgreement } from "../../../src/imports/agreement/device-agreement";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { MadeUpDevice } from "./made-up-device";
import { pressOn, textsIn } from "./shown-parts";

class MadeUpPage {
  readonly agreementAnswered = vi.fn();
}

function shownStep(device: MadeUpDevice, page: MadeUpPage): { agreement: CampaignAgreement; stepEl: HTMLElement } {
  const agreement = new CampaignAgreement(new DeviceAgreement(device.storage));
  const stepEl = obsidianDocument().createElement("div");
  agreement.showIn(stepEl, page);
  return { agreement, stepEl };
}

describe("the agreement step at campaign creation", () => {
  it("shows the agreement's own words with Agree and Not yet", () => {
    const { stepEl } = shownStep(new MadeUpDevice(), new MadeUpPage());
    expect(textsIn(stepEl, ".dd-agreement-title")).toEqual(["Fetch your character from D&D Beyond?"]);
    expect(textsIn(stepEl, ".dd-agreement-words")).toEqual([
      "To bring your character in, this plugin sends one message to one address, character-service.dndbeyond.com. The message holds your character's number and nothing else. It sends no login and no cookies, and it never touches your D&D Beyond account.",
      "Your character has to be set to Public on D&D Beyond. A public character's backstory and notes can be read by anyone who has the link, not only by this plugin. The plugin throws them away before it reads anything and never saves them in your vault.",
      "You are asked this once on this device. After you continue, the button fetches only when you press it. If you would rather send nothing, bring your character in with its PDF instead.",
    ]);
    expect(textsIn(stepEl, "button")).toEqual(["Agree", "Not yet"]);
  });

  it("is wanted on a device that hasn't agreed", () => {
    const agreement = new CampaignAgreement(new DeviceAgreement(new MadeUpDevice().storage));
    expect(agreement.wanted()).toBe(true);
  });

  it("is not wanted on a device that agreed already", () => {
    const agreement = new CampaignAgreement(new DeviceAgreement(MadeUpDevice.agreed().storage));
    expect(agreement.wanted()).toBe(false);
  });

  it("keeps Agree on this device, then tells the page once", () => {
    const device = new MadeUpDevice();
    const page = new MadeUpPage();
    const { agreement, stepEl } = shownStep(device, page);
    pressOn(stepEl, "Agree");
    expect(device.saveLocalStorage).toHaveBeenCalledExactlyOnceWith(AGREEMENT_KEY, true);
    expect(page.agreementAnswered).toHaveBeenCalledOnce();
    expect(agreement.wanted()).toBe(false);
  });

  it("keeps nothing for Not yet, tells the page once, and isn't wanted again while the plugin runs", () => {
    const device = new MadeUpDevice();
    const page = new MadeUpPage();
    const { agreement, stepEl } = shownStep(device, page);
    pressOn(stepEl, "Not yet");
    expect(device.saveLocalStorage).not.toHaveBeenCalled();
    expect(page.agreementAnswered).toHaveBeenCalledOnce();
    expect(agreement.wanted()).toBe(false);
  });
});
