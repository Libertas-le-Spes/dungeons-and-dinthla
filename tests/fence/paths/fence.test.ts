import { STUB_SPELLING } from "../../host/stub-spelling";
import { describe, expect, it } from "vitest";
import { Fence } from "../../../src/fence/paths/fence";

const CONFIG_DIR = ".obsidian";

describe("Fence", () => {
  it("holds a path inside the Campaigns folder, at any depth", () => {
    const fence = new Fence(() => "Games/D&D", CONFIG_DIR, STUB_SPELLING);
    expect(fence.holds("Games/D&D/Pale Moon/Pale Moon.md")).toBe(true);
    expect(fence.holds("Games/D&D/Pale Moon/Sessions/Session 1.md")).toBe(true);
  });

  it("doesn't hold the Campaigns folder itself, a folder beside it with a longer name, or anything outside", () => {
    const fence = new Fence(() => "Games/D&D", CONFIG_DIR, STUB_SPELLING);
    for (const path of ["Games/D&D", "Games/D&D Old/Pale Moon.md", "Games/Pale Moon.md", "Private.md"]) expect(fence.holds(path)).toBe(false);
  });

  it("doesn't hold a path that climbs back out with ..", () => {
    expect(new Fence(() => "D&D", CONFIG_DIR, STUB_SPELLING).holds("D&D/../Private.md")).toBe(false);
    expect(new Fence(() => "D&D", CONFIG_DIR, STUB_SPELLING).holds("D&D/.. /Private.md")).toBe(false);
  });

  it("holds nothing while no Campaigns folder is set", () => {
    expect(new Fence(() => null, CONFIG_DIR, STUB_SPELLING).holds("D&D/Pale Moon/Pale Moon.md")).toBe(false);
    expect(new Fence(() => null, CONFIG_DIR, STUB_SPELLING).holds("null/Pale Moon/Pale Moon.md")).toBe(false);
  });

  it("holds nothing when the Campaigns folder is the vault itself or not a plain path", () => {
    for (const folder of ["/", "", "../D&D", "D&D/", ".. ", "D&D."]) expect(new Fence(() => folder, CONFIG_DIR, STUB_SPELLING).holds("D&D/Pale Moon/Pale Moon.md")).toBe(false);
  });

  it("holds nothing when the Campaigns folder is the vault's settings folder or inside it, even when its name has no dot", () => {
    for (const folder of ["Vault Settings", "Vault Settings/D&D"]) {
      expect(new Fence(() => folder, "Vault Settings", STUB_SPELLING).holds(`${folder}/Pale Moon/Pale Moon.md`)).toBe(false);
      expect(new Fence(() => folder, "Vault Settings", STUB_SPELLING).isTheFolder(folder)).toBe(false);
    }
  });

  it("holds nothing when the Campaigns folder is hidden, such as the vault's settings folder", () => {
    for (const folder of [".obsidian", "Games/.hidden"]) expect(new Fence(() => folder, CONFIG_DIR, STUB_SPELLING).holds(`${folder}/Pale Moon/Pale Moon.md`)).toBe(false);
  });

  it("follows the Campaigns folder as it changes", () => {
    let folder = "D&D";
    const fence = new Fence(() => folder, CONFIG_DIR, STUB_SPELLING);
    folder = "Games";
    expect(fence.holds("D&D/Pale Moon/Pale Moon.md")).toBe(false);
    expect(fence.holds("Games/Pale Moon/Pale Moon.md")).toBe(true);
  });

  it("holds a note the vault already holds in decomposed letters or with a no-break space", () => {
    const fence = new Fence(() => "D&D", CONFIG_DIR, STUB_SPELLING);
    expect(fence.holds("D&D/Zoe\u0308/Zoe\u0308.md")).toBe(true);
    expect(fence.holds("D&D/Pale\u00a0Moon/Pale\u00a0Moon.md")).toBe(true);
  });

  it("holds a Campaigns folder named in decomposed letters", () => {
    expect(new Fence(() => "Zoe\u0308", CONFIG_DIR, STUB_SPELLING).holds("Zoe\u0308/Pale Moon/Pale Moon.md")).toBe(true);
  });

  it("holds a new path only as Obsidian writes it", () => {
    const fence = new Fence(() => "D&D", CONFIG_DIR, STUB_SPELLING);
    expect(fence.holdsNew("D&D/Pale Moon/Sessions/Session 2.md")).toBe(true);
    expect(fence.holdsNew("D&D/Zoe\u0308/Zoe\u0308.md")).toBe(false);
    expect(fence.holdsNew("D&D/Pale\u00a0Moon/Pale\u00a0Moon.md")).toBe(false);
  });

  it("holds no new path outside, or while no Campaigns folder is set", () => {
    expect(new Fence(() => "D&D", CONFIG_DIR, STUB_SPELLING).holdsNew("Private/Secondary.md")).toBe(false);
    expect(new Fence(() => "D&D", CONFIG_DIR, STUB_SPELLING).holdsNew("D&D/../Private/Secondary.md")).toBe(false);
    expect(new Fence(() => null, CONFIG_DIR, STUB_SPELLING).holdsNew("D&D/Pale Moon/Pale Moon.md")).toBe(false);
    expect(new Fence(() => null, CONFIG_DIR, STUB_SPELLING).holdsNew("null/Pale Moon/Pale Moon.md")).toBe(false);
  });

  it("knows the Campaigns folder itself, and nothing else as it", () => {
    const fence = new Fence(() => "D&D", CONFIG_DIR, STUB_SPELLING);
    expect(fence.isTheFolder("D&D")).toBe(true);
    expect(fence.isTheFolder("D&D/Pale Moon")).toBe(false);
    expect(new Fence(() => null, CONFIG_DIR, STUB_SPELLING).isTheFolder("D&D")).toBe(false);
  });
});
