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

export const CODE_MIRROR_FOLDER = "/node_modules/@codemirror/";

export const CODE_MIRROR_MODULE = "@codemirror/";

export const DOCUMENT = "doc";

export const FORBIDDEN_NAMES = ["MarkdownRenderer", "renderMarkdown", "executeCommandById", "commands", "execCommand", "Function", "eval", "openLinkText", "openPopoutLeaf", "activeEditor", "activeLeaf", "getMostRecentLeaf", "duplicateLeaf", "plugins", "getPlugin", "enabledPlugins", "internalPlugins", "__proto__"];

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

export const KEY_READERS = ["values", "entries", "getOwnPropertyDescriptor", "getOwnPropertyDescriptors", "assign"];

export const LIBRARY_FOLDER = "/node_modules/";

export const OBSIDIAN_FOLDER = "/node_modules/obsidian/";

export const FILE_OPENER = "openFile";

export const EVENT_TRIGGER = "trigger";

export const HOVER_LINK = "hover-link";

export const ACTIVE_VIEW = "getActiveViewOfType";

export const VIEW_FILE = "file";

export const GATE_SOURCES = ["/src/fence/fenced-files.ts", "/src/fence/fenced-metadata.ts"];

export const GATE_FOLDER = "/src/fence/";

export const GATE_BUILT_SOURCES = [...GATE_SOURCES, "/src/fence/fenced-file-actions.ts", "/src/fence/gatekeeper.ts", "/src/fence/held-files.ts"];

export const GATE_TYPE_SOURCES = [...GATE_BUILT_SOURCES, "/src/fence/fence.ts"];

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
