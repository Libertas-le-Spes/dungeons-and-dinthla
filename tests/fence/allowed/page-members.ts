import { PAGE_ESCAPES } from "../scan/reading/names";

export const PAGE_MEMBERS: Record<string, string[]> = {
  "beyond/shape/byte-count.ts": ["encode"],
  "obsidian/campaign/background/picture-css.ts": ["encode"],
  "interface/tabs/seen-tab.ts": ["isShown"],
  "interface/view/campaign-view.ts": ["addClass", "createDiv", "createEl", "createSpan", "empty", "removeAttribute", "setAttribute", "setText", "toggleClass"],
  "interface/view/campaign-switcher.ts": ["bottom", "createEl", "focus", "getBoundingClientRect", "left"],
  "interface/view/tab-picture.ts": ["addClass", "removeClass", "removeProperty", "setCssProps", "style"],
  "main.ts": ["clearTimeout", "setTimeout", "visibilityState"],
  "names/file-name.ts": ["encode"],
  "obsidian/views/frames/modal-frame.ts": ["addClass", "empty"],
  "obsidian/views/frames/obsidian-telling.ts": ["createSpan"],
  "obsidian/settings/settings-frame.ts": ["empty"],
  "obsidian/views/frames/page-frame.ts": ["addClass", "empty"],
  "obsidian/views/mount/element-parts-on.ts": ["addClass", "setAttr", "setText", "toggle"],
  "obsidian/views/mount/field-element.ts": ["tagName"],
  "obsidian/views/mount/name-suggest.ts": ["dispatchEvent", "setText"],
  "obsidian/views/mount/obsidian-handle.ts": ["disabled", "empty", "focus", "isShown", "open", "readOnly", "scrollIntoView", "setAttr", "setSelectionRange", "setText", "tagName", "toggle", "toggleClass", "value"],
  "obsidian/views/mount/file-pick.ts": ["addEventListener", "arrayBuffer", "files", "item", "size"],
  "obsidian/views/mount/obsidian-mounter.ts": ["appendText", "createDiv", "createEl", "createSpan", "placeholder", "selected", "setAttr", "setText", "spellcheck", "value"],
  "obsidian/views/mount/obsidian-wiring.ts": ["AT_TARGET", "addEventListener", "altKey", "button", "ctrlKey", "defaultPrevented", "eventPhase", "key", "metaKey", "preventDefault", "selectionStart", "shiftKey", "stopPropagation", "value"],
  "pdf/streams/inflate/platform-inflating.ts": ["getReader", "pipeThrough", "stream"],
  "pdf/work/clock.ts": ["now"],
  "reading/colour-markers.ts": ["ELEMENT_NODE", "TEXT_NODE", "append", "childNodes", "classList", "className", "closest", "contains", "createElement", "data", "matches", "nodeName", "nodeType", "ownerDocument", "parentElement", "querySelectorAll", "replaceWith", "splitText", "tagName", "textContent"],
  "obsidian/reading/note-background.ts": ["addClass", "className", "createDiv", "remove", "removeClass", "setCssProps"],
  "obsidian/reading/plain-dollars.ts": ["className", "createEl", "empty", "getText", "querySelectorAll", "setText"],
  "views/dialogs/keys.ts": ["ctrlKey", "isComposing", "key", "metaKey"],
  "views/lists/row-focus.ts": ["closest", "focus", "open", "querySelectorAll"],
};

export const PAGE_ESCAPE_READERS: Record<string, string[]> = {
  "reading/colour-markers.ts": PAGE_ESCAPES,
};
