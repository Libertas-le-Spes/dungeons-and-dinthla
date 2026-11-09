export interface NetworkCode {
  name: string;
  pattern: RegExp;
}

const NODE_NETWORK_MODULES = "fs|fs/promises|net|http|https|http2|tls|dgram|dns|child_process";

const ALLOWED_MODULES = ['require("obsidian")', 'require("@codemirror/state")', 'require("@codemirror/view")'];

const ALLOWED_ADDRESSES = [
  '"app://"',
  '"capacitor://localhost/_capacitor_file_/"',
  '"http://localhost/_capacitor_file_/"',
  '"https://localhost/_capacitor_file_/"',
];

export const PICTURE_CSS = "`url(\"${safe}\")`";

const ALLOWED_CODE = [...ALLOWED_MODULES, ...ALLOWED_ADDRESSES, PICTURE_CSS];

export const WEB_ADDRESSES: NetworkCode[] = [
  { name: "a web address", pattern: /\b(?:https?|wss?):/i },
  { name: "an address starting //", pattern: /\/\/(?!\s)/ },
];

export const NETWORK_CODE: NetworkCode[] = [
  { name: "fetch", pattern: /\bfetch\b/ },
  { name: "request", pattern: /\brequest\b/ },
  { name: "requestUrl", pattern: /\brequestUrl\b/ },
  { name: "ajax", pattern: /\bajax\b/ },
  { name: "ajaxPromise", pattern: /\bajaxPromise\b/ },
  { name: "XMLHttpRequest", pattern: /\bXMLHttpRequest\b/ },
  { name: "WebSocket", pattern: /\bWebSocket\b/ },
  { name: "EventSource", pattern: /\bEventSource\b/ },
  { name: "sendBeacon", pattern: /\bsendBeacon\b/ },
  { name: "RTCPeerConnection", pattern: /\bRTCPeerConnection\b/ },
  { name: "Image", pattern: /\bImage\b/ },
  { name: "Worker", pattern: /\bWorker\b/ },
  { name: "SharedWorker", pattern: /\bSharedWorker\b/ },
  { name: "importScripts", pattern: /\bimportScripts\b/ },
  { name: "open called on its own", pattern: /(?<![\w$])(?<!\.\s*)open\s*\((?![^()]*\)\s*\{)/ },
  { name: "open on a window", pattern: /\b(?:window|globalThis|self|top|parent|frames|opener|activeWindow|defaultView)\s*(?:\?\.|\.|\[)\s*["'`]?open\b/ },
  { name: "location", pattern: /\blocation\b/ },
  { name: "innerHTML", pattern: /\binnerHTML\b/ },
  { name: "outerHTML", pattern: /\bouterHTML\b/ },
  { name: "insertAdjacentHTML", pattern: /\binsertAdjacentHTML\b/ },
  { name: "srcdoc", pattern: /\bsrcdoc\b/ },
  { name: "a url( other than the background picture's", pattern: /(?<![\w$])url\(/i },
  { name: "sanitizeHTMLToDom", pattern: /\bsanitizeHTMLToDom\b/ },
  { name: "DOMParser", pattern: /\bDOMParser\b/ },
  { name: "createContextualFragment", pattern: /\bcreateContextualFragment\b/ },
  { name: "setHTMLUnsafe or parseHTMLUnsafe", pattern: /\b(?:set|parse)HTMLUnsafe\b/ },
  { name: "write or writeln, which a document has", pattern: /(?<!\bthis\s*)\.\s*write(?:ln)?\s*\(|\[\s*["'`]write(?:ln)?["'`]\s*\]|\bwriteln\b/ },
  { name: "Audio", pattern: /\bAudio\b/ },
  { name: "FontFace", pattern: /\bFontFace\b/ },
  { name: "CSSStyleSheet", pattern: /\bCSSStyleSheet\b/ },
  { name: "adoptedStyleSheets", pattern: /\badoptedStyleSheets\b/ },
  { name: "submit on anything but the plugin's own dialog", pattern: /(?<!\bthis\s*)\.\s*submit\s*\(|\[\s*["'`]submit["'`]\s*\]|\brequestSubmit\b/ },
  { name: "caches", pattern: /\bcaches\b/ },
  { name: "Notification", pattern: /\bNotification\b/ },
  { name: "an element that loads from an address", pattern: /(?<![!=]=\s*)["'`](?:img|image|link|script|style|iframe|audio|video|source|embed|object|track)["'`]/i },
  { name: "a module other than Obsidian or CodeMirror", pattern: /require/ },
  { name: "a Node file, network or process module", pattern: new RegExp(`require\\(\\s*["'\`](node:)?(${NODE_NETWORK_MODULES})["'\`]\\s*\\)`) },
  { name: "electron", pattern: /require\(\s*["'`]electron["'`]\s*\)/ },
  { name: "process", pattern: /(?<![\w$])(?<!\.\s*)process(?![\w$])(?!\s*\([^()]*\)\s*\{)|\bprocess\s*(?:\?\.|\.|\[)/ },
  { name: "getBuiltinModule", pattern: /\bgetBuiltinModule\b/ },
  { name: "mainModule", pattern: /\bmainModule\b/ },
  { name: "_load", pattern: /(?<![\w$])_load\b/ },
  { name: "dlopen", pattern: /\bdlopen\b/ },
  { name: "a module loaded while running", pattern: /\bimport\s*\(/ },
  ...WEB_ADDRESSES,
];

function withoutAllowed(text: string): string {
  return ALLOWED_CODE.reduce((left, allowed) => left.replaceAll(allowed, ""), text);
}

function isIn(text: string): (code: NetworkCode) => boolean {
  return (code) => code.pattern.test(text);
}

function nameOf(code: NetworkCode): string {
  return code.name;
}

export function codesFoundIn(codes: NetworkCode[], text: string): string[] {
  return codes.filter(isIn(text)).map(nameOf);
}

export function networkCodeIn(text: string): string[] {
  return codesFoundIn(NETWORK_CODE, withoutAllowed(text));
}
