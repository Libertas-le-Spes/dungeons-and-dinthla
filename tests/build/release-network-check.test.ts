import { describe, expect, it, vi } from "vitest";
import { exitCodeOfCheck, NO_FILES } from "../../scripts/release-network-check.ts";

const CLEAN_PLUGIN = 'var import_obsidian = require("obsidian");';
const CLEAN_STYLES = ".dd-frame { color: red; }";
const FETCHING_PLUGIN = 'fetch("https://example.invalid/a.json");';
const BEYOND_ADDRESS_LINE = 'var BEYOND_ADDRESS = "https://character-service.dndbeyond.com/character/v5/character/";';
const BEYOND_CALL = 'const reply = await (0, import_obsidian9.requestUrl)({ url: beyondAddressOf(id), method: "GET", throw: false });';
const LOADING_STYLES = ".dd-frame { background-image: url(https://example.invalid/a.png); }";

function checkWith(files: Record<string, string>) {
  const read = vi.fn((path: string) => {
    const text = files[path];
    if (text === undefined) throw new Error(`No file ${path}`);
    return text;
  });
  const said = vi.fn();
  const failed = vi.fn();
  return { read, said, failed };
}

describe("exitCodeOfCheck", () => {
  it("fails and names both files when each holds network code", () => {
    const needs = checkWith({ "main.js": FETCHING_PLUGIN, "styles.css": LOADING_STYLES });
    expect(exitCodeOfCheck(["main.js", "styles.css"], needs)).toBe(1);
    expect(needs.failed).toHaveBeenCalledWith("main.js holds network code: fetch");
    expect(needs.failed).toHaveBeenCalledWith("styles.css holds network code: a url( that is not a base64 data URL");
  });

  it("passes and says so for each file when neither holds network code", () => {
    const needs = checkWith({ "main.js": CLEAN_PLUGIN, "styles.css": CLEAN_STYLES });
    expect(exitCodeOfCheck(["main.js", "styles.css"], needs)).toBe(0);
    expect(needs.said.mock.calls).toEqual([["main.js holds no network code beyond what is allowed."], ["styles.css holds no network code beyond what is allowed."]]);
    expect(needs.failed).not.toHaveBeenCalled();
  });

  it("fails when only one of the files holds network code", () => {
    const needs = checkWith({ "main.js": CLEAN_PLUGIN, "styles.css": LOADING_STYLES });
    expect(exitCodeOfCheck(["main.js", "styles.css"], needs)).toBe(1);
  });

  it("reads exactly the files it is given", () => {
    const needs = checkWith({ "build/plugin.js": CLEAN_PLUGIN, "build/look.css": CLEAN_STYLES });
    exitCodeOfCheck(["build/plugin.js", "build/look.css"], needs);
    expect(needs.read.mock.calls).toEqual([["build/plugin.js"], ["build/look.css"]]);
  });

  it("checks a stylesheet with the stylesheet rules, which refuse any url( but a data URL", () => {
    const needs = checkWith({ "look.css": LOADING_STYLES });
    expect(exitCodeOfCheck(["look.css"], needs)).toBe(1);
    expect(needs.failed).toHaveBeenCalledWith("look.css holds network code: a url( that is not a base64 data URL");
  });

  it("refuses to run with no files and reads nothing", () => {
    const needs = checkWith({});
    expect(exitCodeOfCheck([], needs)).toBe(1);
    expect(needs.failed).toHaveBeenCalledExactlyOnceWith(NO_FILES);
    expect(needs.read).not.toHaveBeenCalled();
  });

  it("fails on a file it has no rules for, without reading it", () => {
    const needs = checkWith({ "notes.txt": "" });
    expect(exitCodeOfCheck(["notes.txt"], needs)).toBe(1);
    expect(needs.failed).toHaveBeenCalledExactlyOnceWith("notes.txt isn't a .js or .css file, so it can't be checked.");
    expect(needs.read).not.toHaveBeenCalled();
  });

  it("passes a built plugin holding the one D&D Beyond call and its address once each", () => {
    const needs = checkWith({ "main.js": `${CLEAN_PLUGIN}\n${BEYOND_ADDRESS_LINE}\n${BEYOND_CALL}`, "styles.css": CLEAN_STYLES });
    expect(exitCodeOfCheck(["main.js", "styles.css"], needs)).toBe(0);
  });

  it("fails a built plugin holding a second call, though the first is the allowed one", () => {
    const needs = checkWith({ "main.js": `${CLEAN_PLUGIN}\n${BEYOND_ADDRESS_LINE}\n${BEYOND_CALL}\n${BEYOND_CALL}`, "styles.css": CLEAN_STYLES });
    expect(exitCodeOfCheck(["main.js", "styles.css"], needs)).toBe(1);
    expect(needs.failed).toHaveBeenCalledWith("main.js holds network code: requestUrl");
  });

  it("fails a built plugin whose one call sends a header", () => {
    const sending = BEYOND_CALL.replace("throw: false", "throw: false, headers: { Cookie: jar }");
    const needs = checkWith({ "main.js": `${CLEAN_PLUGIN}\n${BEYOND_ADDRESS_LINE}\n${sending}`, "styles.css": CLEAN_STYLES });
    expect(exitCodeOfCheck(["main.js", "styles.css"], needs)).toBe(1);
  });

  it("fails a stylesheet that holds the allowed address or call, since only the plugin may", () => {
    const needs = checkWith({ "main.js": CLEAN_PLUGIN, "styles.css": `.dd-frame { content: ${BEYOND_ADDRESS_LINE} }` });
    expect(exitCodeOfCheck(["main.js", "styles.css"], needs)).toBe(1);
    expect(needs.failed).toHaveBeenCalledWith("styles.css holds network code: a web address");
  });
});
