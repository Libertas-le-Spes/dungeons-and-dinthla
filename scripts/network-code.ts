export interface NetworkCode {
  name: string;
  pattern: RegExp;
}

const NODE_NETWORK_MODULES = "fs|fs/promises|net|http|https|http2|tls|dgram|dns|child_process";

export const NETWORK_CODE: NetworkCode[] = [
  { name: "fetch", pattern: /\bfetch\b/ },
  { name: "requestUrl", pattern: /\brequestUrl\b/ },
  { name: "XMLHttpRequest", pattern: /\bXMLHttpRequest\b/ },
  { name: "WebSocket", pattern: /\bWebSocket\b/ },
  { name: "EventSource", pattern: /\bEventSource\b/ },
  { name: "sendBeacon", pattern: /\bsendBeacon\b/ },
  { name: "a Node file, network or process module", pattern: new RegExp(`require\\(\\s*["'\`](node:)?(${NODE_NETWORK_MODULES})["'\`]\\s*\\)`) },
  { name: "electron", pattern: /require\(\s*["'`]electron["'`]\s*\)/ },
  { name: "a module loaded while running", pattern: /\bimport\s*\(/ },
];

function isIn(text: string): (code: NetworkCode) => boolean {
  return (code) => code.pattern.test(text);
}

function nameOf(code: NetworkCode): string {
  return code.name;
}

export function networkCodeIn(text: string): string[] {
  return NETWORK_CODE.filter(isIn(text)).map(nameOf);
}
