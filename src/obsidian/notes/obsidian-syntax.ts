import { getFrontMatterInfo, getLinkpath, parseYaml } from "obsidian";
import type { NoteSyntax, PropertiesSpan } from "../../host/rules/note-syntax";

class ObsidianSyntax implements NoteSyntax {
  propertiesIn(text: string): PropertiesSpan {
    const info = getFrontMatterInfo(text);
    return { exists: info.exists, from: info.from, to: info.to, contentStart: info.contentStart, text: info.frontmatter };
  }

  readProperties(text: string): unknown {
    return parseYaml(text);
  }

  linkPathOf(linkText: string): string {
    return getLinkpath(linkText);
  }
}

export const OBSIDIAN_SYNTAX: NoteSyntax = new ObsidianSyntax();
