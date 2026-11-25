import type { ShownDialog, Dialogs, DialogView, Focusable } from "../../src/views/dialogs/dialog-view";
import type { ViewElement } from "../../src/views/elements/view-element";
import type { PageView } from "../../src/views/pages/page-view";
import { startPlugin, type StartedPlugin } from "../../src/plugin/start-plugin";
import type { PluginDrafts } from "../../src/plugin/plugin-drafts";
import { InMemoryNotes } from "../host/in-memory-notes";
import { RecordedTelling } from "../host/showing/recorded-telling";
import { STUB_SPELLING } from "../host/stub-spelling";
import { STUB_SYNTAX } from "../host/stub-syntax";
import { Recorded } from "./recorded-mounter";

function nothing(): void {}

export class RecordedView implements PageView, DialogView {
  readonly root = new Recorded("root", {});
  closed = false;

  constructor(private readonly shownDialog: ShownDialog | null = null) {}

  show(trees: readonly ViewElement[]): void {
    this.root.showInside(trees);
  }

  focusOnceOpen(target: Focusable): void {
    target.focus();
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    if (this.shownDialog !== null) this.shownDialog.closed();
  }
}

export class RecordedDialogs implements Dialogs {
  readonly opened: { dialog: ShownDialog; view: RecordedView }[] = [];

  open(dialog: ShownDialog): void {
    const view = new RecordedView(dialog);
    this.opened.push({ dialog, view });
    dialog.opened(view);
  }

  last(): RecordedView {
    const shown = this.opened[this.opened.length - 1];
    if (shown === undefined) throw new Error("No dialog was opened.");
    return shown.view;
  }
}

class SavedData {
  written: unknown = {};

  constructor(private readonly saved: unknown) {}

  async load(): Promise<unknown> {
    return this.saved;
  }

  async save(data: unknown): Promise<void> {
    this.written = data;
  }
}

class DeviceKept {
  private readonly kept = new Map<string, unknown>();

  load(key: string): unknown {
    return this.kept.get(key);
  }

  save(key: string, value: unknown): void {
    this.kept.set(key, value);
  }
}

export interface Playing {
  readonly plugin: StartedPlugin;
  readonly drafts: PluginDrafts;
  readonly notes: InMemoryNotes;
  readonly telling: RecordedTelling;
  readonly dialogs: RecordedDialogs;
  readonly data: SavedData;
}

export async function playing(saved: unknown, setUp: (notes: InMemoryNotes) => void): Promise<Playing> {
  const notes = new InMemoryNotes();
  setUp(notes);
  const telling = new RecordedTelling();
  const dialogs = new RecordedDialogs();
  const data = new SavedData(saved);
  const plugin = startPlugin(
    {
      notes,
      written: { listen: () => nothing },
      report: { textSaved: nothing, trashed: nothing, renamed: nothing },
      spelling: STUB_SPELLING,
      syntax: STUB_SYNTAX,
      settingsFolder: ".obsidian",
      data,
      device: new DeviceKept(),
      clock: { now: () => 1_000 },
      timer: { start: () => 1, stop: nothing },
      closing: { onUnload: nothing, onQuit: nothing, onVisibilityChange: nothing, onPageHide: nothing, pageHidden: () => false },
      telling,
      dialogs,
    },
    { activePath: () => null, showBackgrounds: nothing, showCampaignTabsAgain: nothing },
  );
  await plugin.load();
  const drafts = plugin.keepDrafts();
  await plugin.startCampaign();
  return { plugin, drafts, notes, telling, dialogs, data };
}

export function settled(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
