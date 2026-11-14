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

const CALL_IMPORTS = 'import { requestUrl } from "obsidian";\nimport { beyondAddressOf } from "../../../../src/online/beyond-address";\nimport type { CharacterId } from "../../../../src/online/character-id";\n';

const EXACT_CALL = 'requestUrl({ url: beyondAddressOf(id), method: "GET", throw: false })';

export const ALLOWED_NETWORK_SAMPLES = [
  `${CALL_IMPORTS}export const ask = (id: CharacterId) => ${EXACT_CALL};`,
  `${CALL_IMPORTS}export async function ask(id: CharacterId) {\n  const reply = await ${EXACT_CALL};\n  return reply.status;\n}`,
  `${CALL_IMPORTS}export const ask = (id: CharacterId) => requestUrl({ throw: false, method: "GET", url: beyondAddressOf(id) });`,
];

export interface NetworkDefect {
  sample: string;
  breach: RegExp;
}

function defect(body: string, breach: RegExp): NetworkDefect {
  return { sample: `${CALL_IMPORTS}${body}`, breach };
}

const SECOND_CALL = /calls requestUrl 2 times, not exactly once/;
const NOT_CALLED_IN_PLACE = /uses requestUrl other than by calling it in place/;
const NOT_ONE_OBJECT = /calls requestUrl with something but one object written in place/;
const OTHER_OPTIONS = /gives requestUrl options other than exactly url, method, throw/;
const NOT_WRITTEN_PLAIN = /gives requestUrl an option that isn't written as name: value/;
const NOT_THE_BUILDER = /gives requestUrl a url that isn't (a call of|built by) beyondAddressOf/;
const NOT_AN_ID = /gives beyondAddressOf something that isn't a CharacterId/;
const NOT_GET = /sets the method to something but GET/;
const THROWS = /sets throw to something but false/;

export const NETWORK_DEFECT_SAMPLES: NetworkDefect[] = [
  defect(`export const ask = (id: CharacterId) => [${EXACT_CALL}, ${EXACT_CALL}];`, SECOND_CALL),
  defect(`const get = requestUrl;\nexport const ask = (id: CharacterId) => ${EXACT_CALL};`, NOT_CALLED_IN_PLACE),
  defect(`export const ask = (ids: CharacterId[]) => ids.map(requestUrl);`, NOT_CALLED_IN_PLACE),
  defect(`export const ask = (id: CharacterId) => ${EXACT_CALL}.then(() => requestUrl);`, NOT_CALLED_IN_PLACE),
  defect(`export const ask = (id: CharacterId) => requestUrl?.({ url: beyondAddressOf(id), method: "GET", throw: false });`, NOT_CALLED_IN_PLACE),
  defect(`export const ask = (id: CharacterId, options: { throw: false }) => requestUrl({ url: beyondAddressOf(id), method: "GET", ...options });`, NOT_WRITTEN_PLAIN),
  defect(`export const ask = (id: CharacterId) => requestUrl({ url: beyondAddressOf(id), method: "GET", throw: false, headers: {} });`, OTHER_OPTIONS),
  defect(`export const ask = (id: CharacterId) => requestUrl({ url: beyondAddressOf(id), method: "GET", throw: false, body: "" });`, OTHER_OPTIONS),
  defect(`export const ask = (id: CharacterId) => requestUrl({ url: beyondAddressOf(id), method: "GET", throw: false, contentType: "" });`, OTHER_OPTIONS),
  defect(`export const ask = (id: CharacterId) => requestUrl({ url: beyondAddressOf(id), method: "GET" });`, OTHER_OPTIONS),
  defect(`export const ask = (id: CharacterId) => requestUrl({ url: beyondAddressOf(id), url: beyondAddressOf(id), method: "GET", throw: false });`, OTHER_OPTIONS),
  defect(`const url = "u";\nexport const ask = (id: CharacterId) => requestUrl({ url, method: "GET", throw: false });`, NOT_WRITTEN_PLAIN),
  defect(`export const ask = (id: CharacterId) => requestUrl({ ["url"]: beyondAddressOf(id), method: "GET", throw: false });`, NOT_WRITTEN_PLAIN),
  defect(`const options = { url: "u", method: "GET", throw: false };\nexport const ask = () => requestUrl(options);`, NOT_ONE_OBJECT),
  defect(`export const ask = (id: CharacterId) => requestUrl({ url: beyondAddressOf(id), method: "GET", throw: false }, {});`, NOT_ONE_OBJECT),
  defect(`export const ask = () => requestUrl("https://example.invalid/a");`, NOT_ONE_OBJECT),
  defect(`export const ask = () => requestUrl({ url: "https://example.invalid/a", method: "GET", throw: false });`, NOT_THE_BUILDER),
  defect("export const ask = (id: CharacterId) => requestUrl({ url: `${beyondAddressOf(id)}?more`, method: \"GET\", throw: false });", NOT_THE_BUILDER),
  defect(`export const ask = (id: CharacterId) => requestUrl({ url: beyondAddressOf(id) + "?more", method: "GET", throw: false });`, NOT_THE_BUILDER),
  defect(`const addressOf = (id: CharacterId) => String(id);\nexport const ask = (id: CharacterId) => requestUrl({ url: addressOf(id), method: "GET", throw: false });`, NOT_THE_BUILDER),
  defect(`export const ask = () => requestUrl({ url: beyondAddressOf("12" as never), method: "GET", throw: false });`, NOT_AN_ID),
  defect(`export const ask = (id: string) => requestUrl({ url: beyondAddressOf(id as never), method: "GET", throw: false });`, NOT_AN_ID),
  defect(`export const ask = (id: CharacterId) => requestUrl({ url: beyondAddressOf(id, id), method: "GET", throw: false });`, /gives beyondAddressOf more or less than one value/),
  defect(`export const ask = (id: CharacterId) => requestUrl({ url: beyondAddressOf(id), method: "POST", throw: false });`, NOT_GET),
  defect(`export const ask = (id: CharacterId, verb: "GET") => requestUrl({ url: beyondAddressOf(id), method: verb, throw: false });`, NOT_GET),
  defect(`export const ask = (id: CharacterId) => requestUrl({ url: beyondAddressOf(id), method: "get", throw: false });`, NOT_GET),
  defect(`export const ask = (id: CharacterId) => requestUrl({ url: beyondAddressOf(id), method: "GET", throw: true });`, THROWS),
  defect(`export const ask = (id: CharacterId, ok: boolean) => requestUrl({ url: beyondAddressOf(id), method: "GET", throw: ok });`, THROWS),
  { sample: 'import { requestUrl } from "obsidian";\nexport const unused = 1;', breach: /calls requestUrl 0 times, not exactly once/ },
  { sample: `import { request } from "obsidian";\n${CALL_IMPORTS}export const ask = (id: CharacterId) => ${EXACT_CALL};`, breach: /names request, which not even the file allowed the network may/ },
  { sample: `import { requestUrl } from "../../../../src/online/beyond-address";\nimport { beyondAddressOf } from "../../../../src/online/beyond-address";\nimport type { CharacterId } from "../../../../src/online/character-id";\nexport const ask = (id: CharacterId) => ${EXACT_CALL};`, breach: NOT_CALLED_IN_PLACE },
  defect(`declare const page: { requestUrl: (options: object) => void };\nexport const ask = (id: CharacterId) => [${EXACT_CALL}, page.requestUrl({})];`, NOT_CALLED_IN_PLACE),
];

export const BEYOND_CALLING_SAMPLES = [
  'import { callBeyond } from "../../../../src/online/beyond-call";\nexport const ask = callBeyond;',
  'import { BeyondCalls } from "../../../../src/online/call-rules";\nexport const calls = new BeyondCalls(async () => ({ status: 200, contentType: "", text: "" }), () => 0);',
  'import type { BeyondCalls } from "../../../../src/online/call-rules";\nexport const held = (calls: BeyondCalls) => calls;',
  'declare const page: { callBeyond: () => void };\nexport const ask = () => page["callBeyond"]();',
  'export const callBeyond = () => 1;',
];

export const BEYOND_CALLING_KEEPING_SAMPLES = ['export const ask = (calls: { characterFor: () => void }) => calls.characterFor();'];

export const CHARACTER_ID_FORGING_SAMPLES = [
  'import type { CharacterId } from "../../../../src/online/character-id";\nexport const id = (fake: object) => fake as CharacterId;',
  'import type { CharacterId } from "../../../../src/online/character-id";\nexport const id = (fake: object) => <CharacterId>fake;',
  'import type { CharacterId } from "../../../../src/online/character-id";\nexport const id = (fake: unknown) => fake as CharacterId;',
  'import type { CharacterId } from "../../../../src/online/character-id";\nexport const id = (fake: object) => fake as Pick<CharacterId, "appendedTo">;',
  'import type { CharacterId } from "../../../../src/online/character-id";\nexport const id = () => ({ appendedTo: (address: string) => address, isNumber: () => true }) satisfies Pick<CharacterId, "appendedTo">;',
  'import { CharacterId } from "../../../../src/online/character-id";\nexport class Forged extends CharacterId {}',
  'import { CharacterId } from "../../../../src/online/character-id";\nexport const id = () => new CharacterId("1");',
  'import { CharacterId } from "../../../../src/online/character-id";\nexport const id = (text: string) => new CharacterId(text);',
];

export const CHARACTER_ID_KEEPING_SAMPLES = [
  'import { CharacterId } from "../../../../src/online/character-id";\nexport const id = (text: string) => CharacterId.of(text);',
  'import type { CharacterId } from "../../../../src/online/character-id";\nexport const same = (one: CharacterId, other: CharacterId) => one === other;',
];
