import { build } from "esbuild";
import { describe, expect, it } from "vitest";
import type { BuildOptions } from "esbuild";
import { PLUGIN_BUNDLE, STYLES_BUNDLE } from "../../scripts/bundle-options.ts";
import { ALLOWED_IN_PLACE, networkCodeIn, timesIn } from "../../scripts/network-code.ts";
import { styleNetworkCodeIn } from "../../scripts/style-network-code.ts";

async function built(options: BuildOptions): Promise<string> {
  const result = await build({ ...options, write: false, logLevel: "silent" });
  const [output] = result.outputFiles;
  if (output === undefined) throw new Error("The build gave back no file.");
  return output.text;
}

const ALLOWED_TEXT = ALLOWED_IN_PLACE.flatMap((allowed) => Array.from({ length: allowed.count }, () => allowed.code)).join(";\n");

function expectEachFound(samples: [string, string][]): void {
  for (const [sample, name] of samples) expect(networkCodeIn(sample), sample).toContain(name);
}

const BEYOND_ADDRESS_LINE = 'var BEYOND_ADDRESS = "https://character-service.dndbeyond.com/character/v5/character/";';

function beyondCall(importName: string): string {
  return `const reply = await (0, ${importName}.requestUrl)({ url: beyondAddressOf(id), method: "GET", throw: false });`;
}

const ELEMENT = "an element that loads from or sends to an address";

const PAST_AN_ALLOWANCE: [string, string][] = [
  ['document.createElement({ role: "link" }.role)', ELEMENT],
  ['parent.createEl("link", { attr: { role: "link", href: address } })', ELEMENT],
  ['el.setAttribute("role", "link")', ELEMENT],
  ['el.style.backgroundImage = `url("${safe}")`;', "a url( other than the background picture's"],
  ["function put(this: Document, t) { this.write(t) }", "write or writeln, which a document has"],
  ["this.writeln(text)", "write or writeln, which a document has"],
  ["const { writeln } = document;", "write or writeln, which a document has"],
  ["function send() { this.submit() }\nsend.call(form)", "submit, which a form has"],
  ['el.style.backgroundImage = `image-set("${where}" 1x)`;', "image-set"],
  ['el.style.background = "-webkit-image-set(" + where + " 1x)";', "image-set"],
  ['createEl("a", { href: where }).click()', "click"],
  ['link["click"]()', "click"],
  ["a.click.call(a)", "click"],
  ["HTMLElement.prototype.click.call(a)", "click"],
  ["const { click } = a; click.call(a)", "click"],
  ['el.addEventListener("click", follow)', "click"],
  ['this.registerDomEvent(link, "click", follow)', "click"],
  ['el.dispatchEvent(new MouseEvent("click"))', "dispatchEvent"],
  ['el.dispatchEvent(new MouseEvent("click"))', "MouseEvent or PointerEvent"],
  ['el.dispatchEvent(new PointerEvent("click"))', "MouseEvent or PointerEvent"],
  ['el.dispatchEvent(new Event("click"))', "click"],
  ["setTimeout(() => link.dispatchEvent(pressed))", "dispatchEvent"],
  ["form.submit.call(form)", "submit, which a form has"],
  ["const { submit } = form; submit.call(form)", "submit, which a form has"],
  ['HTMLFormElement.prototype.submit.call(form)', "submit, which a form has"],
  ['el.style.background = "IMAGE-SET(" + where + " 1x)";', "image-set"],
  ['document.head.createEl("meta", { attr: { "http-equiv": "refresh", content: `0;${where}` } })', ELEMENT],
  ['document.createElement("form")', ELEMENT],
  ['document.head.createEl("base", { attr: { href: where } })', ELEMENT],
];

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

  it("finds each way to reach Node's own modules without require", () => {
    expectEachFound([
      ['process.getBuiltinModule("node:https").get(address)', "process"],
      ['process.getBuiltinModule("child_process").exec(command)', "process"],
      ['process["getBuiltinModule"]("fs")', "process"],
      ["process?.binding(name)", "process"],
      ["process . dlopen(target, path)", "process"],
      ["const host = process;", "process"],
      ['globalThis.process.getBuiltinModule("net")', "process"],
      ['const { getBuiltinModule } = host;', "getBuiltinModule"],
      ['host.mainModule.require("http")', "mainModule"],
      ['loader._load("https", parent)', "_load"],
      ["host.dlopen(target, path)", "dlopen"],
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
      ["open(address)", "open called on its own"],
      ["const opened = open(address);", "open called on its own"],
      ['open ("https:" + rest)', "open called on its own"],
      ["return open(target(address));", "open called on its own"],
      ["location.assign(address)", "location"],
      ["window.location.href = address", "location"],
      ['el.innerHTML = "<img src=x>"', "innerHTML"],
      ["el.outerHTML = text", "outerHTML"],
      ['el.insertAdjacentHTML("beforeend", text)', "insertAdjacentHTML"],
      ["frame.srcdoc = text", "srcdoc"],
      ['document.createElement("img")', "an element that loads from or sends to an address"],
      ['document.createElement("link")', "an element that loads from or sends to an address"],
      ['document.createElement("script")', "an element that loads from or sends to an address"],
      ['document.createElement("iframe")', "an element that loads from or sends to an address"],
      ['parent.createEl("img", { attr: { src: address } })', "an element that loads from or sends to an address"],
      ["document.createElement('IMG')", "an element that loads from or sends to an address"],
      ['document.createElement("audio")', "an element that loads from or sends to an address"],
      ['parent.createEl("video", { attr: { src: address } })', "an element that loads from or sends to an address"],
      ['video.createEl("source", { attr: { src: address } })', "an element that loads from or sends to an address"],
      ['document.createElement("embed")', "an element that loads from or sends to an address"],
      ['document.createElement("object")', "an element that loads from or sends to an address"],
      ['video.createEl("track", { attr: { src: address } })', "an element that loads from or sends to an address"],
      ['document.createElement(kind === "a" && "object")', "an element that loads from or sends to an address"],
    ]);
  });

  it("finds nothing in the one D&D Beyond call and its one address, however Obsidian's import is numbered", () => {
    expect(networkCodeIn(`${BEYOND_ADDRESS_LINE}\n${beyondCall("import_obsidian3")}`)).toEqual([]);
    expect(networkCodeIn(`${BEYOND_ADDRESS_LINE}\n${beyondCall("import_obsidian116")}`)).toEqual([]);
  });

  it("finds a second call, even one exactly like the allowed call", () => {
    const twice = `${BEYOND_ADDRESS_LINE}\n${beyondCall("import_obsidian3")}\n${beyondCall("import_obsidian4")}`;
    expect(networkCodeIn(twice)).toContain("requestUrl");
  });

  it.each([
    ["a header", '{ url: beyondAddressOf(id), method: "GET", throw: false, headers: { a: "b" } }'],
    ["a body", '{ url: beyondAddressOf(id), method: "GET", throw: false, body: text }'],
    ["POST", '{ url: beyondAddressOf(id), method: "POST", throw: false }'],
    ["throw on", '{ url: beyondAddressOf(id), method: "GET", throw: true }'],
    ["another address", '{ url: "https://example.invalid/a", method: "GET", throw: false }'],
    ["an address built from text", '{ url: `${BEYOND_ADDRESS}${link}`, method: "GET", throw: false }'],
    ["a second option order", '{ method: "GET", url: beyondAddressOf(id), throw: false }'],
  ])("finds the call with %s", (_what, options) => {
    const found = networkCodeIn(`${BEYOND_ADDRESS_LINE}\n(0, import_obsidian3.requestUrl)(${options})`);
    expect(found).toContain("requestUrl");
  });

  it("finds the call written any other way", () => {
    for (const other of ["const get = import_obsidian3.requestUrl;", 'import_obsidian3["requestUrl"]({ url })', "const { requestUrl } = import_obsidian3;"]) {
      expect(networkCodeIn(`${BEYOND_ADDRESS_LINE}\n${beyondCall("import_obsidian3")}\n${other}`)).toContain("requestUrl");
    }
  });

  it("finds a second address, or the address more than once", () => {
    const another = `${BEYOND_ADDRESS_LINE}\n${beyondCall("import_obsidian3")}\nvar OTHER = "https://character-service.dndbeyond.com/character/v6/character/";`;
    expect(networkCodeIn(another)).toContain("a web address");
    const twice = `${BEYOND_ADDRESS_LINE}\n${BEYOND_ADDRESS_LINE}\n${beyondCall("import_obsidian3")}`;
    expect(networkCodeIn(twice)).toContain("a web address");
  });

  it("holds each allowed piece to its own count, so the address alone and the call alone each pass here", () => {
    expect(networkCodeIn(BEYOND_ADDRESS_LINE)).toEqual([]);
    expect(networkCodeIn(beyondCall("import_obsidian3"))).toEqual([]);
  });

  it("finds a cookie, a login header or credentials sent with a call", () => {
    expectEachFound([
      ['headers: { Cookie: "CobaltSession=1" }', "Cookie"],
      ['headers: { cookie: session }', "Cookie"],
      ["const jar = document.cookie;", "Cookie"],
      ['headers: { "Set-Cookie": value }', "Cookie"],
      ['headers: { Authorization: "Bearer 1" }', "Authorization"],
      ['headers: { authorization: token }', "Authorization"],
      ["xhr.withCredentials = true", "withCredentials"],
      ['{ credentials: "include", withCredentials: true }', "withCredentials"],
    ]);
  });

  it("finds each way to parse HTML, write a document, load a sound, font or stylesheet, or send a form", () => {
    expectEachFound([
      ["(0, import_obsidian.sanitizeHTMLToDom)(text)", "sanitizeHTMLToDom"],
      ['new DOMParser().parseFromString(text, "text/html")', "DOMParser"],
      ["document.createRange().createContextualFragment(text)", "createContextualFragment"],
      ["el.setHTMLUnsafe(text)", "setHTMLUnsafe or parseHTMLUnsafe"],
      ["Document.parseHTMLUnsafe(text)", "setHTMLUnsafe or parseHTMLUnsafe"],
      ["document.write(text)", "write or writeln, which a document has"],
      ["activeDocument.writeln(text)", "write or writeln, which a document has"],
      ["el.doc.write(text)", "write or writeln, which a document has"],
      ['page["write"](text)', "write or writeln, which a document has"],
      ["new Audio(address).play()", "Audio"],
      ['new FontFace("Alegreya", source).load()', "FontFace"],
      ["const sheet = new CSSStyleSheet();", "CSSStyleSheet"],
      ["document.adoptedStyleSheets = [sheet];", "adoptedStyleSheets"],
      ['document.head.createEl("style", { text })', "an element that loads from or sends to an address"],
      ['document.createElement("style")', "an element that loads from or sends to an address"],
      ['el.createSvg("image", { attr: { href: address } })', "an element that loads from or sends to an address"],
      ['el.createEl("input", { type: "image", attr: { src: address } })', "an element that loads from or sends to an address"],
      ["form.submit()", "submit, which a form has"],
      ["this.form.submit()", "submit, which a form has"],
      ['form["submit"]()', "submit, which a form has"],
      ["form.requestSubmit()", "submit, which a form has"],
      ['caches.open("pictures")', "caches"],
      ['new Notification("Pale Moon", { icon: address })', "Notification"],
    ]);
  });

  it("finds every url( built in code other than the background picture's", () => {
    const other = "a url( other than the background picture's";
    expectEachFound([
      ["el.style.backgroundImage = `url(${address})`;", other],
      ['el.style.setProperty("background-image", "url(" + address + ")");', other],
      ['el.style.backgroundImage = "URL(" + address + ")";', other],
      ['el.style.backgroundImage = `url("${other}")`;', other],
      ['el.style.backgroundImage = `url("${safe}"), url(${address})`;', other],
      ['el.style.backgroundImage = `url("${safe}")` + `, url(${address})`;', other],
      ['el.style.background = "center/cover url(" + address + ")";', other],
      ['el.style.background = "-webkit-image-set(url(" + address + ") 1x)";', other],
    ]);
  });

  it("finds each way to load from an address or run code through a name built in code", () => {
    expectEachFound([
      ['layer.setCssProps({ "--dd-campaign-picture": ["u", "rl(https:", "//example.invalid/a.png)"].join("") })', "CSS set from code other than the background picture's"],
      ["el.setCssStyles({ backgroundImage: where })", "CSS set from code other than the background picture's"],
      ['el.style.setProperty("--dd-campaign-picture", where)', "CSS set from code other than the background picture's"],
      ["el.style.cssText = where", "CSS set from code other than the background picture's"],
      ['const img = doc.createElement(["i", "mg"].join(""))', "an element made from a name built in code"],
      ["parent.createEl(tag, { cls: \"dd-frame\" })", "an element made from a name built in code"],
      ['doc.createElementNS("http://www.w3.org/2000/svg", "image")', "an element made from a name built in code"],
      ['img.setAttribute(["s", "rc"].join(""), where)', "an attribute set from a name built in code, or an event handler"],
      ['el.setAttribute("onmouseover", code)', "an attribute set from a name built in code, or an event handler"],
      ['el.setAttr("ONCLICK", code)', "an attribute set from a name built in code, or an event handler"],
      ["el.toggleAttribute(name)", "an attribute set from a name built in code, or an event handler"],
    ]);
  });

  it("finds nothing in elements and attributes named in place", () => {
    expect(networkCodeIn('row.setAttribute("aria-current", "true"); parent.createEl("p", { cls: "dd-reading" }); first.ownerDocument.createElement("span"); text.inputEl.setAttr("aria-label", label);')).toEqual([]);
  });

  it("finds nothing in the code allowed in its place, each as often as it is allowed", () => {
    expect(networkCodeIn(ALLOWED_TEXT)).toEqual([]);
  });

  it.each(ALLOWED_IN_PLACE)("finds $code once it shows up more often than allowed", (allowed) => {
    expect(networkCodeIn(`${ALLOWED_TEXT};\n${allowed.code}`)).not.toEqual([]);
  });

  it.each(PAST_AN_ALLOWANCE)("finds %s, alone and beside the code allowed in its place", (sample, name) => {
    expect(networkCodeIn(sample)).toContain(name);
    expect(networkCodeIn(`${ALLOWED_TEXT};\n${sample}`)).toContain(name);
  });

  it("finds nothing in Obsidian modals, the plugin's own open and process methods, and checks of a value's type", () => {
    const allowed = [
      "new ConfirmModal(this.app, text, confirmed, closed).open();",
      "await this.store.open(folder);",
      "super.open();",
      'this.registerEvent(this.app.workspace.on("window-open", added));',
      "const timer = window.setTimeout(run, 0);",
      "  async open(folder) {",
      "  open() {",
      "  async process(file, change) {",
      "await this.files.process(file, (text) => text);",
      'if (typeof saved !== "object" || saved === null) return settings;',
      "if (event.defaultPrevented || !isSubmit(event, false)) return;",
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
      "// src/campaign/background/picture-css.ts",
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
  });

  it("holds each code allowed in its place exactly as often as it is allowed", async () => {
    const bundle = await built(PLUGIN_BUNDLE);
    for (const allowed of ALLOWED_IN_PLACE) expect(timesIn(bundle, allowed.code), allowed.code).toBe(allowed.count);
  });
});

describe("the built styles", () => {
  it("hold no network code", async () => {
    const styles = await built(STYLES_BUNDLE);
    expect(styles).toContain(".dd-tokens");
    expect(styleNetworkCodeIn(styles)).toEqual([]);
  });
});
