import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT, VIRTUAL_FOLDER } from "../reading/scan-paths";
import { extendsRootConfig } from "./sample-scan";

describe("the configuration a sample is scanned under", () => {
  it.each(["one", "one/two", "one/two/three", "one/two/three/four"])("is the repo's own, from a family folder %s deep", (family) => {
    const folder = `${VIRTUAL_FOLDER}/${family}`;
    expect(resolve(folder, extendsRootConfig(folder))).toBe(`${ROOT}/tsconfig.json`);
  });
});
