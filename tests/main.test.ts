import { describe, expect, it } from "vitest";
import { Plugin, type App, type PluginManifest } from "obsidian";
import DungeonsAndDinthla from "../src/main";

describe("DungeonsAndDinthla", () => {
  it("loads against the Obsidian stand-in", () => {
    expect(new DungeonsAndDinthla({} as App, {} as PluginManifest)).toBeInstanceOf(Plugin);
  });
});
