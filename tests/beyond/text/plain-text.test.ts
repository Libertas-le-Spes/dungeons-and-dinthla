import { describe, expect, it } from "vitest";
import { plainTextOf } from "../../../src/beyond/text/plain-text";

describe("plainTextOf", () => {
  it("leaves text with no tags as it is", () => {
    expect(plainTextOf("Primary Monk, level 4")).toBe("Primary Monk, level 4");
  });

  it("removes a tag and keeps the words inside it", () => {
    expect(plainTextOf("a <b>bold</b> word")).toBe("a bold word");
  });

  it("removes tags nested inside tags", () => {
    expect(plainTextOf("<p><i><b>deep</b></i></p>")).toBe("deep");
  });

  it("removes a tag whose attributes hold another bracket pair", () => {
    expect(plainTextOf('<a title="x">link</a>')).toBe("link");
  });

  it("removes a tag that a removed tag was hiding", () => {
    expect(plainTextOf("<scr<b>ipt>go</scr<b>ipt>")).toBe("go");
  });

  it("removes the tags of a script and keeps what was inside as text", () => {
    expect(plainTextOf("<script>alert(1)</script>")).toBe("alert(1)");
  });

  it("removes the tags of a style and keeps what was inside as text", () => {
    expect(plainTextOf("<style>p { color: red }</style>")).toBe("p { color: red }");
  });

  it("keeps an entity as written, so it can't turn into a tag", () => {
    expect(plainTextOf("&lt;script&gt; and &amp;")).toBe("&lt;script&gt; and &amp;");
  });

  it("keeps an opening bracket that never closes", () => {
    expect(plainTextOf("a <b")).toBe("a <b");
  });

  it("keeps a closing bracket that never opened", () => {
    expect(plainTextOf("b> a")).toBe("b> a");
  });

  it("removes a comment's tag", () => {
    expect(plainTextOf("a<!-- note -->b")).toBe("ab");
  });
});
