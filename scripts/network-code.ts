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

const ALLOWED_CODE = [...ALLOWED_MODULES, ...ALLOWED_ADDRESSES];

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
  { name: "open on a window", pattern: /\b(?:window|globalThis|self|top|parent|frames|opener|activeWindow|defaultView)\s*(?:\?\.|\.|\[)\s*["'`]?open\b/ },
  { name: "location", pattern: /\blocation\b/ },
  { name: "innerHTML", pattern: /\binnerHTML\b/ },
  { name: "outerHTML", pattern: /\bouterHTML\b/ },
  { name: "insertAdjacentHTML", pattern: /\binsertAdjacentHTML\b/ },
  { name: "srcdoc", pattern: /\bsrcdoc\b/ },
  { name: "an img, link, script or iframe element", pattern: /["'`](?:img|link|script|iframe)["'`]/i },
  { name: "a module other than Obsidian or CodeMirror", pattern: /require/ },
  { name: "a Node file, network or process module", pattern: new RegExp(`require\\(\\s*["'\`](node:)?(${NODE_NETWORK_MODULES})["'\`]\\s*\\)`) },
  { name: "electron", pattern: /require\(\s*["'`]electron["'`]\s*\)/ },
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

export function networkCodeIn(text: string): string[] {
  return NETWORK_CODE.filter(isIn(withoutAllowed(text))).map(nameOf);
}
