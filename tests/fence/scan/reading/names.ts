import { TypeFlags } from "typescript/unstable/sync";
import { SyntaxKind } from "typescript/unstable/ast";

export const VAULT_NAMES = ["vault", "fileManager", "metadataCache", "adapter"];

export const EDITOR_WRITES = [
  "replaceRange",
  "replaceSelection",
  "setValue",
  "setLine",
  "transaction",
  "undo",
  "redo",
  "exec",
  "processLines",
  "setViewData",
  "save",
  "requestSave",
  "data",
  "clear",
  "set",
  "dispatch",
];

export const EDITOR_READS = ["getValue", "getLine", "getRange", "getSelection", "getViewData"];

export const FILE_TREE = ["parent", "children"];

export const NOTE_READS = ["getSectionInfo", "frontmatter", "currentMode", "previewMode", "get", "data", "groupedData", "getValue", "getSummaryValue", "entries"];

export const VIEW_TEXT = ["innerText", "textContent", "outerText"];

export const VIEW_ELEMENTS = ["contentEl", "containerEl"];

export const EDITOR_HOOKS = [
  "updateListener",
  "transactionFilter",
  "changeFilter",
  "inputHandler",
  "editorEditorField",
  "editorViewField",
  "editorInfoField",
  "editorLivePreviewField",
];

export const CODE_MIRROR_MODULE = "@codemirror/";

export const DOCUMENT = "doc";

export const FORBIDDEN_NAMES = ["MarkdownRenderer", "renderMarkdown", "executeCommandById", "commands", "execCommand", "Function", "eval", "openLinkText", "openPopoutLeaf", "activeEditor", "activeLeaf", "getMostRecentLeaf", "duplicateLeaf", "plugins", "getPlugin", "enabledPlugins", "internalPlugins", "__proto__", "FileSystemAdapter", "CapacitorAdapter", "DataAdapter", "readLocalFile", "getBasePath", "getFullPath", "getFullRealPath", "getFilePath", "mkdir", "MarkdownPreviewRenderer", "registerPostProcessor", "changeLayout", "getLayout", "getLastOpenFiles", "registerMarkdownCodeBlockProcessor", "setCssStyles", "setProperty", "cssText", "setAttrs", "setAttributeNS", "setAttributeNode", "setAttributeNodeNS", "setNamedItem", "setNamedItemNS", "createAttribute", "createAttributeNS", "createElementNS", "createSvg", "FunctionConstructor"];

export const GATE_ONLY_NAMES = ["recurseChildren"];

export const EDITOR_OWNERS = [
  "Editor",
  "EditorView",
  "FileView",
  "EditableFileView",
  "TextFileView",
  "MarkdownView",
  "MarkdownEditView",
  "MarkdownPreviewView",
  "MarkdownSubView",
  "MarkdownFileInfo",
];

export const FILE_OWNERS = ["TAbstractFile", "TFile", "TFolder"];

export const NOTE_OWNERS = [
  "MarkdownPostProcessorContext",
  "MarkdownView",
  "MarkdownSubView",
  "MarkdownPreviewView",
  "MarkdownEditView",
  "BasesView",
  "BasesQueryResult",
  "BasesEntry",
  "BasesEntryGroup",
];

export const VIEW_OWNERS = ["View", "ItemView", "BasesView", ...EDITOR_OWNERS];

export const GLOBAL_OWNERS = ["App", "Window", "globalThis"];

export const UNTYPED = TypeFlags.Any | TypeFlags.Unknown | TypeFlags.NonPrimitive;

export const APP = "app";

export const REFLECTION = "Reflect";

export const CONSTRUCTOR = "constructor";

export const KEY_READERS = ["values", "entries", "keys", "getOwnPropertyNames", "getOwnPropertySymbols", "getOwnPropertyDescriptor", "getOwnPropertyDescriptors", "assign"];

export const OBJECT = "Object";

export const WHOLE_COPIERS = [
  { owner: "JSON", name: "stringify" },
  { owner: null, name: "structuredClone" },
];

export const REACHING_HOLDERS = ["app", "workspace"];

export const FILE_OPENER = "openFile";

export const EVENT_TRIGGER = "trigger";

export const HOVER_LINK = "hover-link";

export const ACTIVE_VIEW = "getActiveViewOfType";

export const VIEW_FILE = "file";

export const GATEKEEPER = "Gatekeeper";

export const PROTOTYPE_TAKERS = ["create"];

export const PROTOTYPE_SETTERS = ["setPrototypeOf"];

export const OBJECT_CHANGERS = ["defineProperty", "defineProperties", "assign", "setPrototypeOf"];

export const STEPS = [SyntaxKind.PlusPlusToken, SyntaxKind.MinusMinusToken];

type GuardedAllowance = "fileOpening" | "viewState" | "activeFile" | "activeView";

export const GUARDED_NAMES: { name: string; allowance: GuardedAllowance }[] = [
  { name: FILE_OPENER, allowance: "fileOpening" },
  { name: "setViewState", allowance: "viewState" },
  { name: "getActiveFile", allowance: "activeFile" },
  { name: ACTIVE_VIEW, allowance: "activeView" },
];

export const CALLED_ONLY = [FILE_OPENER, EVENT_TRIGGER];

export const LEAF_OWNERS = ["WorkspaceLeaf"];

export const FILE_VIEW_OWNERS = ["FileView", "EditableFileView", "TextFileView", "MarkdownView", "MarkdownEditView", "MarkdownPreviewView", "MarkdownSubView", "MarkdownFileInfo"];

export const LEAF_OPENER = "open";

export const LEAF_VIEW = "view";

export const EVENT_LISTENER = "on";

export const EVENT_OWNERS = ["Workspace", "Events"];

export const NOTE_EVENTS = ["file-open", "active-leaf-change", "editor-change", "file-menu", "editor-menu", "quick-preview"];

export const BOUND_READS = [LEAF_OPENER, LEAF_VIEW, VIEW_FILE, EVENT_LISTENER];

export const OBSIDIAN_MODULE = "obsidian";

export const ALLOWED_MODULES = [OBSIDIAN_MODULE, "@codemirror/state", "@codemirror/view", "monkey-around"];

export const PLACED_MODULES: Record<string, readonly string[]> = { "monkey-around": ["obsidian/interface/takeover/view-state-patch.ts"] };

export const TIMERS = ["setTimeout", "setInterval"];

export const ATTRIBUTE_SETTERS = ["setAttribute", "setAttr", "toggleAttribute"];

export const ELEMENT_MAKERS = ["createEl", "createElement"];

export const OPTION_TAKERS = [
  { name: "createEl", options: 1 },
  { name: "createDiv", options: 0 },
  { name: "createSpan", options: 0 },
];

export const CSS_PROPERTY_SETTERS = ["setCssProps"];

export const PICTURE_CSS = "PictureCss";

export const PICTURE_VALUE = "value";

export const POST_PROCESSORS = ["registerMarkdownPostProcessor"];

export const PAGE_TEXT = ["textContent", "innerText", "outerText", "nodeValue", "wholeText", "getHTML", "createRange", "createTreeWalker", "createNodeIterator", "XMLSerializer", "serializeToString", "getText"];

export const CHARACTER_DATA = "data";

export const CHARACTER_DATA_OWNERS = ["CharacterData", "Text", "Comment", "ProcessingInstruction", "CDATASection"];

export const ELEMENT_QUERIES = ["querySelector", "querySelectorAll", "getElementsByClassName", "getElementsByTagName", "getElementsByTagNameNS", "getElementsByName", "getElementById", "closest", "elementFromPoint", "elementsFromPoint"];

export const OBSIDIAN_ELEMENT_QUERIES = ["find", "findAll", "findAllSelf", "matchParent"];

export const OBSIDIAN_ELEMENT_LISTENERS = ["on", "off"];

export const ELEMENT_LISTENER_OWNERS = ["HTMLElement", "Document"];

export const PAGE_ESCAPES = [
  "ownerDocument",
  "doc",
  "win",
  "body",
  "documentElement",
  "defaultView",
  "constructorWin",
  "parentElement",
  "parentNode",
  "childNodes",
  "children",
  "firstChild",
  "lastChild",
  "nextSibling",
  "previousSibling",
  "firstElementChild",
  "lastElementChild",
  "nextElementSibling",
  "previousElementSibling",
  "getRootNode",
  "getSelection",
  "data",
  "length",
  "substringData",
  "wholeText",
  "nodeValue",
  "splitText",
  "getAttribute",
  "getAttributeNames",
  "getAttributeNode",
  "getAttributeNS",
  "getAttr",
  "hasAttribute",
  "dataset",
  "attributes",
  "onWindowMigrated",
  "targetNode",
  "activeDocument",
  "activeWindow",
  "_EVENTS",
  "document",
  "target",
  "currentTarget",
  "relatedTarget",
  "view",
  "activeElement",
  "offsetParent",
  "ownerElement",
  "isActiveElement",
];

export const LOADING_MEMBERS = ["href", "src", "srcset", "action", "formAction", "poster", "background", "codebase"];

export const STYLE_OWNERS = ["CSSStyleDeclaration"];

export const NODE_MARK = "ownerDocument";

export const OPTION_ATTRIBUTES = "attr";

export const LINK_OPTION = "href";

export const PAGE_LINK = "#";

export const PAGE_NAMES = [...TIMERS, ...ATTRIBUTE_SETTERS, ...ELEMENT_MAKERS, ...OPTION_TAKERS.map((taker) => taker.name), ...CSS_PROPERTY_SETTERS, ...POST_PROCESSORS, ...PAGE_TEXT, CHARACTER_DATA, ...ELEMENT_QUERIES, ...OBSIDIAN_ELEMENT_QUERIES, ...OBSIDIAN_ELEMENT_LISTENERS];

export const PAGE_LIBRARY = "/lib.dom.d.ts";


export const GLOBAL_BLOCK = "global";

export const UNSAFE_KEYS = ["constructor", "__proto__", "prototype"];

export const NETWORK_CALL = "requestUrl";

export const NETWORK_NAMES = [NETWORK_CALL, "request"];

export const BEYOND_CALLING_NAMES = ["callBeyond", "BeyondCalls", "OBSIDIAN_BEYOND_CALL"];

export const NETWORK_ADDRESS_BUILDER = "beyondAddressOf";

export const NETWORK_ADDRESS_FILE = "online/beyond-address.ts";

export const NETWORK_CHARACTER_ID = "CharacterId";

export const CHARACTER_ID_FILE = "online/character-id.ts";

export const NETWORK_OPTION_NAMES = ["url", "method", "throw"];

export const NETWORK_METHOD = "GET";
