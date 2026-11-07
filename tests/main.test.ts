import { describe, expect, it } from "vitest";
import { Plugin, type App, type PluginManifest } from "obsidian";
import DungeonsAndDinthla from "../src/main";

describe("DungeonsAndDinthla", () => {
  it("is an Obsidian plugin", () => {
    expect(new DungeonsAndDinthla({} as App, {} as PluginManifest)).toBeInstanceOf(Plugin);
  });
});
