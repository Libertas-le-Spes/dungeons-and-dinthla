import { describe, expect, it } from "vitest";
import { AGREEMENT_KEY, DeviceAgreement } from "../../../src/imports/agreement/device-agreement";
import { MadeUpDevice } from "./made-up-device";

describe("the agreement kept on this device", () => {
  it("is given when this device's own storage holds true under the agreement's key", () => {
    const device = MadeUpDevice.agreed();
    expect(new DeviceAgreement(device.storage).given()).toBe(true);
    expect(device.loadLocalStorage).toHaveBeenCalledExactlyOnceWith(AGREEMENT_KEY);
  });

  it("is not given when this device's storage holds nothing for it", () => {
    expect(new DeviceAgreement(new MadeUpDevice().storage).given()).toBe(false);
  });

  it.each([["true"], [1], ["yes"], [{}]])("is not given when this device's storage holds %j rather than true", (held) => {
    expect(new DeviceAgreement(MadeUpDevice.holding(held).storage).given()).toBe(false);
  });

  it("is kept as true under the agreement's key, in this device's own storage", () => {
    const device = new MadeUpDevice();
    new DeviceAgreement(device.storage).give();
    expect(device.saveLocalStorage).toHaveBeenCalledExactlyOnceWith(AGREEMENT_KEY, true);
  });
});
