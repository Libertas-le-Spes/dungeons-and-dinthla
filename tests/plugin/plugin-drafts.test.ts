import { describe, expect, it, vi } from "vitest";
import { Fence } from "../../src/fence/paths/fence";
import { PluginDrafts } from "../../src/plugin/plugin-drafts";
import { SavedSettings } from "../../src/plugin/saved-settings";
import { DRAFTS_KEY, NOT_KEPT } from "../../src/settings/drafts/local-drafts";
import { MISSING } from "../../src/session-notes/kept/kinds/kept-kinds";
import { InMemoryNotes } from "../host/in-memory-notes";
import { RecordedTelling } from "../host/showing/recorded-telling";
import { STUB_SPELLING } from "../host/stub-spelling";

const ONE = "D&D/Pale Moon/Sessions/Session 1.md";
const TWO = "D&D/Pale Moon/Sessions/Session 2.md";

class MadeUpDevice {
  readonly kept = new Map<string, unknown>();
  refuses = false;

  load(key: string): unknown {
    return this.kept.get(key);
  }

  save(key: string, value: unknown): void {
    if (this.refuses) throw new Error("The storage is full.");
    this.kept.set(key, value);
  }
}

class HeldTimer {
  private waiting: (() => void) | null = null;

  start(run: () => void): number {
    this.waiting = run;
    return 1;
  }

  stop(): void {
    this.waiting = null;
  }

  run(): void {
    const run = this.waiting;
    this.waiting = null;
    if (run !== null) run();
  }
}

class HeldClosing {
  private readonly unloads: (() => void)[] = [];

  onUnload(run: () => void): void {
    this.unloads.push(run);
  }

  onQuit(): void {}

  onVisibilityChange(): void {}

  onPageHide(): void {}

  pageHidden(): boolean {
    return false;
  }

  unload(): void {
    for (const run of this.unloads) run();
  }
}

async function started(onDevice: Record<string, string>, inFile: unknown = {}, paths: string[] = [ONE]) {
  const device = new MadeUpDevice();
  device.kept.set(DRAFTS_KEY, onDevice);
  const timer = new HeldTimer();
  const closing = new HeldClosing();
  const notes = new InMemoryNotes();
  for (const path of paths) notes.put(path, "");
  const telling = new RecordedTelling();
  const data = { load: async () => inFile, save: vi.fn(async () => {}) };
  const saved = new SavedSettings({ data, device, settingsFolder: ".obsidian", telling }, { campaignFolder: null, open: vi.fn(async () => {}) }, async () => {});
  await saved.load();
  await saved.campaignsFolder.choose("D&D").catch(() => {});
  const fence = new Fence(() => "D&D", ".obsidian", STUB_SPELLING);
  const plugin = new PluginDrafts({ device, timer, closing, clock: { now: () => 1_000 }, telling, changes: notes, store: notes, fence }, saved);
  plugin.start();
  return { plugin, device, timer, closing, notes, telling };
}

describe("PluginDrafts", () => {
  it("starts with the lines this device kept", async () => {
    const { plugin } = await started({ [ONE]: "? Who" });
    expect(plugin.drafts.textOf(ONE)).toBe("? Who");
  });

  it("keeps typed lines on the device once typing pauses", async () => {
    const { plugin, device, timer } = await started({});
    plugin.drafts.keep(ONE, "! Ride");
    expect(device.kept.get(DRAFTS_KEY)).toEqual({});
    timer.run();
    expect(device.kept.get(DRAFTS_KEY)).toEqual({ [ONE]: "! Ride" });
  });

  it("keeps typed lines on the device at once when the plugin closes", async () => {
    const { plugin, device, closing } = await started({});
    plugin.drafts.keep(ONE, "! Ride");
    closing.unload();
    expect(device.kept.get(DRAFTS_KEY)).toEqual({ [ONE]: "! Ride" });
  });

  it("says so when the device can't keep the lines", async () => {
    const { plugin, device, timer, telling } = await started({});
    device.refuses = true;
    plugin.drafts.keep(ONE, "! Ride");
    timer.run();
    expect(telling.said).toEqual(["Couldn't keep the text typed in the campaign tab: The storage is full."]);
    expect(NOT_KEPT).toBe("this device's storage didn't keep them");
  });

  it("sets aside the lines older versions left in the settings file", async () => {
    const { plugin } = await started({}, { drafts: { [TWO]: "? Where" } });
    expect(plugin.keeping.keptDrafts.kept().map((draft) => [draft.path, draft.text])).toEqual([[TWO, "? Where"]]);
  });

  it("moves a session's lines with its note, and stops once stopped", async () => {
    const { plugin, notes } = await started({ [ONE]: "? Who" }, {}, [ONE, TWO]);
    await notes.move(notes.note(ONE)!, "D&D/Pale Moon/Sessions/Session 3.md");
    expect(plugin.drafts.textOf("D&D/Pale Moon/Sessions/Session 3.md")).toBe("? Who");
    plugin.stop();
    plugin.drafts.keep(TWO, "! Ride");
    await notes.move(notes.note(TWO)!, "D&D/Pale Moon/Sessions/Session 4.md");
    expect(plugin.drafts.textOf(TWO)).toBe("! Ride");
  });

  it("sets aside the lines of a session note that is gone", async () => {
    const { plugin } = await started({ [TWO]: "? Where" }, {}, [ONE]);
    plugin.setAsideGoneNotes();
    expect(plugin.keeping.keptDrafts.kept().map((draft) => [draft.kind, draft.path])).toEqual([[MISSING, TWO]]);
  });
});
