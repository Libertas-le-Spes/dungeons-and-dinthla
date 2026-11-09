import { build } from "esbuild";
import { describe, expect, it } from "vitest";
import { PLUGIN_BUNDLE } from "../../scripts/bundle-options";
import { networkCodeIn } from "../../scripts/network-code";

async function builtBundle(): Promise<string> {
  const result = await build({ ...PLUGIN_BUNDLE, write: false, logLevel: "silent" });
  const [bundle] = result.outputFiles;
  if (bundle === undefined) throw new Error("The build gave back no bundle.");
  return bundle.text;
}

function expectEachFound(samples: [string, string][]): void {
  for (const [sample, name] of samples) expect(networkCodeIn(sample), sample).toContain(name);
}

describe("networkCodeIn", () => {
  it("finds each kind of network code a bundle could hold", () => {
    expectEachFound([
      ['fetch("https://example.invalid")', "fetch"],
      ["(0, import_obsidian.requestUrl)({ url })", "requestUrl"],
      ["new XMLHttpRequest()", "XMLHttpRequest"],
      ["new WebSocket(address)", "WebSocket"],
      ["new EventSource(address)", "EventSource"],
      ["navigator.sendBeacon(address, body)", "sendBeacon"],
      ['require("fs")', "a Node file, network or process module"],
      ["require('node:https')", "a Node file, network or process module"],
      ['require("child_process")', "a Node file, network or process module"],
      ['require("net")', "a Node file, network or process module"],
      ['require("http")', "a Node file, network or process module"],
      ['require("electron")', "electron"],
      ['import("./later.js")', "a module loaded while running"],
    ]);
  });

  it("finds every module loaded other than Obsidian and CodeMirror", () => {
    const anyOther = "a module other than Obsidian or CodeMirror";
    expectEachFound([
      ['require("original-fs")', anyOther],
      ["require(name)", anyOther],
      ["require('obsidian')", anyOther],
      ['require( "obsidian" )', anyOther],
      ['require("obsidian" + suffix)', anyOther],
      ['require("@codemirror/language")', anyOther],
      ["const load = require;", anyOther],
      ['module.require("tls")', anyOther],
      ['var __require = (name) => name;', anyOther],
    ]);
  });

  it("finds every web address other than the app's own file addresses", () => {
    expectEachFound([
      ['const address = "https://example.invalid/a.png";', "a web address"],
      ['const address = "http://example.invalid/a.png";', "a web address"],
      ['const address = "ws://example.invalid/feed";', "a web address"],
      ['const address = "wss://example.invalid/feed";', "a web address"],
      ['const address = "HTTPS://example.invalid/a.png";', "a web address"],
      ['const address = "https:example.invalid/a.png";', "a web address"],
      ['const address = "http://localhost:8080/_capacitor_file_/";', "a web address"],
      ['el.style.backgroundImage = "url(https://example.invalid/a.png)";', "a web address"],
      ['const address = "//example.invalid/a.js";', "an address starting //"],
      ['const address = "app://example.invalid/a.png";', "an address starting //"],
      ['const address = "capacitor://example.invalid/a.png";', "an address starting //"],
      ['const address = "ftp:" + "//example.invalid";', "an address starting //"],
    ]);
  });

  it("finds nothing in the app's own file addresses", () => {
    const allowed = [
      '{ on: "isDesktopApp", prefixes: ["app://"] },',
      '{ on: "isIosApp", prefixes: ["capacitor://localhost/_capacitor_file_/"] },',
      '{ on: "isAndroidApp", prefixes: ["http://localhost/_capacitor_file_/", "https://localhost/_capacitor_file_/"] },',
      "// src/campaign/picture-css.ts",
    ];
    expect(networkCodeIn(allowed.join("\n"))).toEqual([]);
  });

  it("finds nothing in code that only loads Obsidian and CodeMirror", () => {
    const allowed = [
      'var import_obsidian = require("obsidian");',
      'var import_state = require("@codemirror/state");',
      'var import_view = require("@codemirror/view");',
    ];
    expect(networkCodeIn(allowed.join("\n"))).toEqual([]);
  });
});

describe("the built plugin", () => {
  it("holds no network code", async () => {
    const bundle = await builtBundle();
    expect(bundle).toContain('require("obsidian")');
    expect(networkCodeIn(bundle)).toEqual([]);
  }, 30_000);
});
