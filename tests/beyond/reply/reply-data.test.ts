import { describe, expect, it } from "vitest";
import { JsonReader } from "../../../src/beyond/reply/json/json-reader";
import { replyDataOf } from "../../../src/beyond/reply/reply-data";

describe("replyDataOf", () => {
  it("takes the data of a reply that says it worked", () => {
    const root = JsonReader.of({ success: true, data: { name: "Primary" } });
    expect(replyDataOf(root).textAt("name")).toBe("Primary");
  });

  it("takes bare data as it is", () => {
    expect(replyDataOf(JsonReader.of({ name: "Primary" })).textAt("name")).toBe("Primary");
  });

  it.each([false, "true", 1, null, "yes"])("refuses a reply whose success is %j, in plain words", (success) => {
    expect(() => replyDataOf(JsonReader.of({ success, data: { name: "Primary" } }))).toThrow("D&D Beyond says it could not give this character.");
  });

  it("refuses a reply that says it failed even when it carries data", () => {
    expect(() => replyDataOf(JsonReader.of({ id: 0, success: false, message: "Not found", data: { name: "Primary" } }))).toThrow("could not give this character");
  });

  it("refuses a reply that says it worked and holds no data", () => {
    expect(() => replyDataOf(JsonReader.of({ success: true }))).toThrow('"data" is missing or is not an object');
  });

  it.each([null, [], "Primary", 5])("refuses data given as %j", (data) => {
    expect(() => replyDataOf(JsonReader.of({ success: true, data }))).toThrow("not an object");
  });

  it("does not take the data of a bare character that has a data key but no success", () => {
    expect(replyDataOf(JsonReader.of({ name: "Primary", data: { name: "Secondary" } })).textAt("name")).toBe("Primary");
  });
});
