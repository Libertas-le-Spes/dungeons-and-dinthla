import { describe, expect, it } from "vitest";
import { AGREEMENT_KEY, KeptAgreement } from "../../../src/imports/agreement/kept-agreement";
import { MadeUpDevice } from "./made-up-device";

describe("the D&D Beyond agreement, kept in the vault", () => {
  it("is given when the vault keeps it, without looking at this device", () => {
    const device = MadeUpDevice.agreed();
    expect(new KeptAgreement(device.places).given()).toBe(true);
    expect(device.loadLocalStorage).not.toHaveBeenCalled();
  });

  it("is given when this device agreed before it was kept in the vault", () => {
    const device = MadeUpDevice.agreedOnThisDeviceBefore();
    expect(new KeptAgreement(device.places).given()).toBe(true);
    expect(device.loadLocalStorage).toHaveBeenCalledExactlyOnceWith(AGREEMENT_KEY);
  });

  it("is not given when neither the vault nor this device holds it", () => {
    expect(new KeptAgreement(new MadeUpDevice().places).given()).toBe(false);
  });

  it.each([["true"], [1], ["yes"], [{}]])("is not given when this device holds %j rather than true", (held) => {
    expect(new KeptAgreement(MadeUpDevice.holding(held).places).given()).toBe(false);
  });

  it("is kept in the vault once when given, and is given from then on", () => {
    const device = new MadeUpDevice();
    const agreement = new KeptAgreement(device.places);
    agreement.give();
    expect(device.keepAgreed).toHaveBeenCalledOnce();
    expect(agreement.given()).toBe(true);
  });

  it("stays given here and says so when the vault can't keep it", async () => {
    const device = MadeUpDevice.refusingToKeep(new Error("Read-only."));
    const agreement = new KeptAgreement(device.places);
    await agreement.give();
    expect(agreement.given()).toBe(true);
    expect(device.notKept).toHaveBeenCalledExactlyOnceWith(new Error("Read-only."));
  });
});
