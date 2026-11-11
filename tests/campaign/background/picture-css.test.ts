import { describe, expect, it } from "vitest";
import { PictureCss, type ResourcePlatform } from "../../../src/campaign/background/picture-css";
import { ANDROID, DESKTOP, IPHONE } from "../shown-picture";

const DESKTOP_ROOT = "app://f3a9c1/home/player/Vault/Art/";

function cssOn(url: string, platform: ResourcePlatform): string | null {
  const picture = PictureCss.of(url, platform);
  if (picture === null) return null;
  return picture.value;
}

function desktopCss(url: string): string | null {
  return cssOn(url, DESKTOP);
}

describe("PictureCss", () => {
  it("wraps a plain desktop picture as it is", () => {
    expect(desktopCss(`${DESKTOP_ROOT}harbour.jpg?1700000000`)).toBe(`url("${DESKTOP_ROOT}harbour.jpg?1700000000")`);
  });

  it("keeps a picture named to break out of the url from adding another layer", () => {
    const value = desktopCss(`${DESKTOP_ROOT}a"), url("https://elsewhere.example/t.png`);
    expect(value).toBe(`url("${DESKTOP_ROOT}a%22%29,%20url%28%22https://elsewhere.example/t.png")`);
  });

  it("encodes single quotes and backslashes in the name", () => {
    expect(desktopCss(`${DESKTOP_ROOT}it's\\here.png`)).toBe(`url("${DESKTOP_ROOT}it%27s%5Chere.png")`);
  });

  it("encodes spaces, tabs and line breaks in the name", () => {
    expect(desktopCss(`${DESKTOP_ROOT}old map\t2\n.png`)).toBe(`url("${DESKTOP_ROOT}old%20map%092%0A.png")`);
  });

  it("encodes a wide space as its UTF-8 bytes", () => {
    expect(desktopCss(`${DESKTOP_ROOT}old\u3000map.png`)).toBe(`url("${DESKTOP_ROOT}old%E3%80%80map.png")`);
  });

  it("shows nothing for a web address on the desktop", () => {
    expect(desktopCss("https://elsewhere.example/t.png")).toBeNull();
  });

  it("shows nothing for a scheme Obsidian doesn't give on this platform", () => {
    expect(cssOn("capacitor://localhost/_capacitor_file_/Art/harbour.jpg", DESKTOP)).toBeNull();
    expect(cssOn(`${DESKTOP_ROOT}harbour.jpg`, IPHONE)).toBeNull();
    expect(cssOn("http://localhost/_capacitor_file_/Art/harbour.jpg", IPHONE)).toBeNull();
  });

  it("shows nothing for another host on a phone", () => {
    expect(cssOn("http://elsewhere.example/_capacitor_file_/Art/harbour.jpg", ANDROID)).toBeNull();
  });

  it("takes the picture paths Obsidian gives on a phone", () => {
    expect(cssOn("capacitor://localhost/_capacitor_file_/Art/harbour.jpg", IPHONE)).toBe('url("capacitor://localhost/_capacitor_file_/Art/harbour.jpg")');
    expect(cssOn("http://localhost/_capacitor_file_/Art/harbour.jpg", ANDROID)).toBe('url("http://localhost/_capacitor_file_/Art/harbour.jpg")');
    expect(cssOn("https://localhost/_capacitor_file_/Art/harbour.jpg", ANDROID)).toBe('url("https://localhost/_capacitor_file_/Art/harbour.jpg")');
  });
});
