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

export interface AllowedCode {
  code: string;
  count: number;
}

const ALLOWED_ANYWHERE = [...ALLOWED_MODULES, ...ALLOWED_ADDRESSES];

export const ALLOWED_IN_PLACE: AllowedCode[] = [
  { code: "new _PictureCss(`url(\"${safe}\")`)", count: 1 },
  { code: 'attr: { role: "link", tabindex: "0", draggable: "false" }', count: 1 },
  { code: 'role: "link", tabIndex: 0, undraggable: true', count: 1 },
  { code: 'parentEl.createEl("form", { cls: "dd-welcome-make" })', count: 1 },
  { code: 'elementOf(into).createEl("form")', count: 1 },
  { code: '!("base" in read)', count: 1 },
  { code: "this.write({ ...this.current, ...change })", count: 1 },
  { code: "this.write()", count: 2 },
  { code: 'formEl.createEl("button", { cls: form.buttonCls, type: "submit", text: form.buttonText })', count: 1 },
  { code: 'owner.registerDomEvent(formEl, "submit", ', count: 1 },
  { code: 'addEventListener("click", ', count: 22 },
  { code: ', "click", ', count: 6 },
  { code: 'this.input.dispatchEvent(new Event("input"))', count: 1 },
  { code: '.requestUrl)({ url: beyondAddressOf(id), method: "GET", throw: false })', count: 1 },
  { code: '"https://character-service.dndbeyond.com/character/v5/character/"', count: 1 },
  { code: "frameEl.setCssProps({ [PICTURE_PROPERTY]: shown.picture.value })", count: 1 },
  { code: 'layer.setCssProps({ "--dd-campaign-picture": shown.picture.value })', count: 1 },
];

export const WEB_ADDRESSES: NetworkCode[] = [
  { name: "a web address", pattern: /\b(?:https?|wss?):/i },
  { name: "an address starting //", pattern: /\/\/(?!\s)/ },
];

export const NETWORK_CODE: NetworkCode[] = [
  { name: "fetch", pattern: /\bfetch\b/ },
  { name: "request", pattern: /\brequest\b/ },
  { name: "requestUrl", pattern: /\brequestUrl\b/ },
  { name: "Cookie", pattern: /\bcookie\b/i },
  { name: "Authorization", pattern: /\bauthorization\b/i },
  { name: "withCredentials", pattern: /\bwithCredentials\b/ },
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
  { name: "write or writeln, which a document has", pattern: /\.\s*write(?:ln)?\s*\(|\[\s*["'`]write(?:ln)?["'`]\s*\]|\bwriteln\b/ },
  { name: "Audio", pattern: /\bAudio\b/ },
  { name: "FontFace", pattern: /\bFontFace\b/ },
  { name: "CSSStyleSheet", pattern: /\bCSSStyleSheet\b/ },
  { name: "adoptedStyleSheets", pattern: /\badoptedStyleSheets\b/ },
  { name: "submit, which a form has", pattern: /\bsubmit\b|\brequestSubmit\b/ },
  { name: "click", pattern: /\bclick\b/ },
  { name: "dispatchEvent", pattern: /\bdispatchEvent\b/ },
  { name: "MouseEvent or PointerEvent", pattern: /\b(?:Mouse|Pointer)Event\b/ },
  { name: "image-set", pattern: /image-set\s*\(/i },
  { name: "caches", pattern: /\bcaches\b/ },
  { name: "Notification", pattern: /\bNotification\b/ },
  { name: "an element that loads from or sends to an address", pattern: /(?<![!=]=\s*)["'`](?:img|image|link|script|style|iframe|audio|video|source|embed|object|track|meta|form|base)["'`]/i },
  { name: "an element made from a name built in code", pattern: /\bcreate(?:El|Element|ElementNS|Svg)\s*\(\s*(?!["'][\w-]+["']\s*[,)])/ },
  { name: "an attribute set from a name built in code, or an event handler", pattern: /\b(?:setAttribute|setAttr|toggleAttribute|setAttributeNS)\s*\(\s*(?!["'](?!on)[\w-]+["']\s*[,)])/i },
  { name: "CSS set from code other than the background picture's", pattern: /\bsetCss(?:Props|Styles)\b|\bsetProperty\b|\bcssText\b/ },
  { name: "a module other than Obsidian or CodeMirror", pattern: /require(?![\w$])/ },
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

export function timesIn(text: string, code: string): number {
  return text.split(code).length - 1;
}

function withoutAllowedInPlace(text: string, allowed: AllowedCode): string {
  if (timesIn(text, allowed.code) !== allowed.count) return text;
  return text.replaceAll(allowed.code, "");
}

function withoutAllowed(text: string): string {
  const inPlace = ALLOWED_IN_PLACE.reduce(withoutAllowedInPlace, text);
  return ALLOWED_ANYWHERE.reduce((left, allowed) => left.replaceAll(allowed, ""), inPlace);
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
