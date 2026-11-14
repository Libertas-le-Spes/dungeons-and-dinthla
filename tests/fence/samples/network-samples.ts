export const NETWORK_NAMING_SAMPLES = [
  'import { requestUrl } from "obsidian";\nexport const ask = (url: string) => requestUrl({ url, method: "GET", throw: false });',
  'import { request } from "obsidian";\nexport const ask = (url: string) => request({ url });',
  'import { requestUrl as get } from "obsidian";\nexport const ask = (url: string) => get({ url });',
  'import { requestUrl } from "obsidian";\nexport const get = requestUrl;',
  'import { requestUrl } from "obsidian";\nexport const asked = ["a"].map((url) => url).map(requestUrl);',
  'import { requestUrl } from "obsidian";\nexport const ask = (options: { url: string }) => requestUrl({ ...options });',
  'declare const page: { requestUrl: (options: { url: string }) => void };\nexport const ask = (url: string) => page["requestUrl"]({ url });',
  'declare const page: { requestUrl: (options: { url: string }) => void };\nexport const ask = (url: string) => page[`requestUrl`]({ url });',
  'declare const page: { request: (options: { url: string }) => void };\nexport const ask = (url: string) => page.request({ url });',
  'declare const page: { requestUrl: (options: { url: string }) => void };\nexport const ask = (url: string) => page.requestUrl({ url });',
  'import { requestUrl } from "obsidian";\nexport const { requestUrl: get } = { requestUrl };',
  'export { requestUrl } from "obsidian";',
];
