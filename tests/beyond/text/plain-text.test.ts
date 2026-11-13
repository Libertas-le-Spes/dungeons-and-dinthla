import { describe, expect, it, vi } from "vitest";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { NeutralText } from "../../../src/beyond/text/neutral-text";
import { plainTextOf, TAG } from "../../../src/beyond/text/plain-text";

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

  it("removes a tag with attributes", () => {
    expect(plainTextOf('<a title="x">link</a>')).toBe("link");
  });

  it("leaves no tag where a removed tag was hiding one", () => {
    expect(plainTextOf("<scr<b>ipt>go</scr<b>ipt>")).toBe("ipt>goipt>");
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

  it("removes a processing tag", () => {
    expect(plainTextOf("a<?x y?>b")).toBe("ab");
  });

  it("removes a closing tag", () => {
    expect(plainTextOf("a</b>c")).toBe("ac");
  });

  it("keeps a less-than and a greater-than that are not a tag", () => {
    expect(plainTextOf("HP < 10 and AC > 5")).toBe("HP < 10 and AC > 5");
  });

  it("keeps a less-than before a digit and a greater-than after it", () => {
    expect(plainTextOf("a <5 and 6> b")).toBe("a <5 and 6> b");
  });

  it("takes text exactly at the line limit", () => {
    const text = "<b>".repeat(100);
    expect(plainTextOf(text)).toBe("");
  });

  it("refuses text one over the line limit, so a huge nest is never scanned", () => {
    expect(() => plainTextOf("<<".repeat(5000) + ">>".repeat(5000))).toThrow(Refusal);
  });

  it("refuses text one character over the line limit", () => {
    expect(() => plainTextOf("a".repeat(301))).toThrow(new Refusal("A line of text is over the limit of 300 characters."));
  });

  it("refuses 80,000 characters of unclosed tag starts before the pattern reads any", () => {
    const scanning = vi.spyOn(String.prototype, "replace");
    expect(() => plainTextOf("<a".repeat(40000))).toThrow(Refusal);
    expect(scanning).not.toHaveBeenCalled();
    scanning.mockRestore();
  });

  it("matches no tag with more than 300 characters after its first two, so the pattern alone is linear", () => {
    expect(`<a${"x".repeat(301)}>`.match(TAG)).toBeNull();
    expect(`<a${"x".repeat(300)}>`.match(TAG)).not.toBeNull();
  });
});

describe("the output of plainTextOf is not neutral and has to go through NeutralText", () => {
  it.each(["<<b>c>", "<<b>script>x", "<<i><b>img src=x>"])("makes a tag again from %j, which NeutralText.ofLines makes inert", (text) => {
    const plain = plainTextOf(text);
    expect(plain).toMatch(/<[a-z]/);
    expect(NeutralText.ofLines(plain).written).not.toMatch(/(^|[^\\])</);
  });

  it("is made inert by NeutralText.ofOneLine too", () => {
    expect(NeutralText.ofOneLine(plainTextOf("<<b>script>x")).written).toBe("\\<script\\>x");
  });
});
