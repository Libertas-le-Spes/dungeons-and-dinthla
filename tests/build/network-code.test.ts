import { build } from "esbuild";
import { describe, expect, it } from "vitest";
import type { BuildOptions } from "esbuild";
import { PLUGIN_BUNDLE, STYLES_BUNDLE } from "../../scripts/bundle-options.ts";
import { networkCodeIn } from "../../scripts/network-code.ts";
import { styleNetworkCodeIn } from "../../scripts/style-network-code.ts";

async function built(options: BuildOptions): Promise<string> {
  const result = await build({ ...options, write: false, logLevel: "silent" });
  const [output] = result.outputFiles;
  if (output === undefined) throw new Error("The build gave back no file.");
  return output.text;
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

  it("finds each other way a page can reach the network", () => {
    expectEachFound([
      ["(0, import_obsidian.request)({ url })", "request"],
      ['import_obsidian["request"]({ url })', "request"],
      ["window.ajax({ url })", "ajax"],
      ["window.ajaxPromise({ url })", "ajaxPromise"],
      ["new Image().src = address", "Image"],
      ["const picture = new Image;", "Image"],
      ["new Worker(address)", "Worker"],
      ["new SharedWorker(address)", "SharedWorker"],
      ["new RTCPeerConnection()", "RTCPeerConnection"],
      ["importScripts(address)", "importScripts"],
      ["window.open(address)", "open on a window"],
      ["globalThis.open(address)", "open on a window"],
      ["activeWindow.open(address)", "open on a window"],
      ['window["open"](address)', "open on a window"],
      ["window?.open(address)", "open on a window"],
      ["location.assign(address)", "location"],
      ["window.location.href = address", "location"],
      ['el.innerHTML = "<img src=x>"', "innerHTML"],
      ["el.outerHTML = text", "outerHTML"],
      ['el.insertAdjacentHTML("beforeend", text)', "insertAdjacentHTML"],
      ["frame.srcdoc = text", "srcdoc"],
      ['document.createElement("img")', "an img, link, script or iframe element"],
      ['document.createElement("link")', "an img, link, script or iframe element"],
      ['document.createElement("script")', "an img, link, script or iframe element"],
      ['document.createElement("iframe")', "an img, link, script or iframe element"],
      ['parent.createEl("img", { attr: { src: address } })', "an img, link, script or iframe element"],
      ["document.createElement('IMG')", "an img, link, script or iframe element"],
    ]);
  });

  it("finds nothing in Obsidian modals and the plugin's own open methods", () => {
    const allowed = [
      "new ConfirmModal(this.app, text, confirmed, closed).open();",
      "await this.store.open(folder);",
      "super.open();",
      'this.registerEvent(this.app.workspace.on("window-open", added));',
      "const timer = window.setTimeout(run, 0);",
    ];
    expect(networkCodeIn(allowed.join("\n"))).toEqual([]);
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

describe("styleNetworkCodeIn", () => {
  it("finds each way a stylesheet could reach the network", () => {
    const samples: [string, string][] = [
      [".dd-frame { background-image: url(https://example.invalid/a.png); }", "a url( that is not a base64 data URL"],
      ['.dd-frame { background-image: url("https://example.invalid/a.png"); }', "a url( that is not a base64 data URL"],
      [".dd-frame { background-image: URL(//example.invalid/a.png); }", "a url( that is not a base64 data URL"],
      [".dd-frame { background-image: url(a.png); }", "a url( that is not a base64 data URL"],
      [".dd-frame { background-image: url(data:image/svg+xml,<svg></svg>); }", "a url( that is not a base64 data URL"],
      ['@import "https://example.invalid/a.css";', "@import"],
      ["@import url(a.css);", "@import"],
      ["@IMPORT 'a.css';", "@import"],
      [".dd-frame { background-image: u\\72l(a.png); }", "an escaped letter or sign"],
      [".dd-frame { background-image: \\75 rl(a.png); }", "an escaped letter or sign"],
      [".dd-frame { background-image: u\\rl(a.png); }", "an escaped letter or sign"],
      ['@\\69mport "a.css";', "an escaped letter or sign"],
      ['.dd-frame { background-image: image-set("https://example.invalid/a.png" 1x); }', "a web address"],
      ['.dd-frame { background-image: image-set("//example.invalid/a.png" 1x); }', "an address starting //"],
    ];
    for (const [sample, name] of samples) expect(styleNetworkCodeIn(sample), sample).toContain(name);
  });

  it("finds nothing in embedded fonts and escaped arrows", () => {
    const allowed = [
      "@font-face {",
      '  font-family: "Alegreya";',
      "  src: url(data:font/woff2;base64,d09GMgAB//AAAKnU+/z0kQY4w==) format(\"woff2\");",
      "}",
      '.dd-frame { background-image: url("data:image/png;base64,iVBORw0KGgo="); }',
      '.dd-answer::before { content: "\\2192  "; }',
      '.dd-name::after { content: "\\00e9"; }',
      "/* styles/fonts.css */",
    ];
    expect(styleNetworkCodeIn(allowed.join("\n"))).toEqual([]);
  });
});

describe("the built plugin", () => {
  it("holds no network code", async () => {
    const bundle = await built(PLUGIN_BUNDLE);
    expect(bundle).toContain('require("obsidian")');
    expect(networkCodeIn(bundle)).toEqual([]);
  }, 30_000);
});

describe("the built styles", () => {
  it("hold no network code", async () => {
    const styles = await built(STYLES_BUNDLE);
    expect(styles).toContain("url(data:font/woff2;base64,");
    expect(styleNetworkCodeIn(styles)).toEqual([]);
  }, 30_000);
});
