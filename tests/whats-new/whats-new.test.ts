import { describe, expect, it } from "vitest";
import type { PluginSettings } from "../../src/settings/saved/plugin-settings";
import { SettingsSaver } from "../../src/settings/saved/settings-saver";
import type { NewsItem } from "../../src/whats-new/news-item";
import { WhatsNew } from "../../src/whats-new/whats-new";

const LANTERNS: NewsItem = { sentence: "Lanterns now light the party funds.", page: "funds" };
const MADE_UP_NEWS = new Map<string, NewsItem>([["2.1.0", LANTERNS]]);

function whatsNewFor(version: string, lastVersionSeen: string | null) {
  const settings: PluginSettings = { campaignsFolder: null, campaignFolder: "Silver Road", welcomeSeen: true, lastVersionSeen, notesMadeFor: [], beyondAgreed: false, charactersBasesSwept: false, carryingNoticeShown: false };
  const saved: PluginSettings[] = [];
  const save = async (changed: PluginSettings) => {
    saved.push({ ...changed });
  };
  return { whatsNew: new WhatsNew(new SettingsSaver(settings, save), version, MADE_UP_NEWS), saved };
}

describe("WhatsNew", () => {
  it("has the news of this version after an update from an earlier one", () => {
    const { whatsNew } = whatsNewFor("2.1.0", "2.0.0");
    expect(whatsNew.latest()).toEqual(LANTERNS);
  });

  it("has the news of this version for a vault upgraded from before versions were kept", () => {
    const { whatsNew } = whatsNewFor("2.1.0", null);
    expect(whatsNew.latest()).toEqual(LANTERNS);
  });

  it("has no news when this version lists nothing new", () => {
    const { whatsNew } = whatsNewFor("2.2.0", "2.1.0");
    expect(whatsNew.latest()).toBeNull();
  });

  it("has no news once this version's news was seen", () => {
    const { whatsNew } = whatsNewFor("2.1.0", "2.1.0");
    expect(whatsNew.latest()).toBeNull();
  });

  it("saves this version as seen, and has no news after", async () => {
    const { whatsNew, saved } = whatsNewFor("2.1.0", "2.0.0");
    await whatsNew.seen();
    expect(saved).toEqual([{ campaignsFolder: null, campaignFolder: "Silver Road", welcomeSeen: true, lastVersionSeen: "2.1.0", notesMadeFor: [], beyondAgreed: false, charactersBasesSwept: false, carryingNoticeShown: false }]);
    expect(whatsNew.latest()).toBeNull();
  });
});
