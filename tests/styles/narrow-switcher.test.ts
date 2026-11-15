import { describe, expect, it } from "vitest";
import { present } from "../pdf/support/present";
import { readStyles } from "./style-files";

const NARROW = "@container (max-width: 1023px) {";

function narrowBlock(css: string): string {
  const start = css.indexOf(NARROW);
  if (start < 0) throw new Error("The narrow layout rules are missing.");
  return css.slice(start);
}

function hiddenSelectors(block: string): string[] {
  const rules = [...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const hiding = rules.filter(([, , body]) => present(body).includes("display: none"));
  return hiding.flatMap(([, selectors]) => present(selectors).split(",").map((selector) => selector.trim()));
}

function ruleFor(block: string, selector: string): string {
  const rule = [...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(([, selectors]) => present(selectors).trim() === selector);
  return present(present(rule)[2]);
}

describe("the campaign tab on a narrow layout", () => {
  const block = narrowBlock(readStyles("campaign.css"));

  it("hides the campaign's name but keeps the switcher and its row", () => {
    const hidden = hiddenSelectors(block);
    expect(hidden).toContain(".dd-campaign .dd-nav-campaign");
    expect(hidden).not.toContain(".dd-campaign .dd-nav-heading");
    expect(hidden).not.toContain(".dd-campaign .dd-nav-switch");
  });

  it("keeps the switcher a touch-sized target as tall as the bar, in a row with no padding", () => {
    expect(ruleFor(block, ".dd-campaign .dd-nav-switch")).toContain("min-width: var(--touch-min)");
    expect(ruleFor(block, ".dd-campaign .dd-nav-switch")).toContain("min-height: var(--bar-height)");
    expect(ruleFor(block, ".dd-campaign .dd-nav-heading")).toContain("padding: 0");
  });
});
