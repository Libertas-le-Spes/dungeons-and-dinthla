import { describe, expect, it } from "vitest";
import { classesOf } from "../../../../src/beyond/reply/parts/read-classes";
import { MadeUpReply } from "../../builders/made-up-reply";
import { firstOf } from "../../builders/first-of";

function classAt(level: unknown, name = "Monk"): object {
  return { level, definition: { name } };
}

function levelsOf(reply: MadeUpReply): number[] {
  return classesOf(reply.reader()).map((imported) => imported.level.valueOr(-1));
}

describe("classesOf", () => {
  it("reads a class and its level with the working", () => {
    const monk = firstOf(classesOf(MadeUpReply.levelOneMonk().reader()));
    expect(monk?.name.text).toBe("Monk");
    expect(monk?.level.valueOr(0)).toBe(1);
    expect(monk?.level.explanation).toBe("Level: 1");
    expect(monk?.level.route.name).toBe("online");
  });

  it("reads each class of a multiclass character", () => {
    const reply = MadeUpReply.levelOneMonk().with(["classes"], [classAt(3), classAt(2, "Secondary")]);
    expect(classesOf(reply.reader()).map((imported) => imported.name.text)).toEqual(["Monk", "Secondary"]);
    expect(levelsOf(reply)).toEqual([3, 2]);
  });

  it("refuses a missing list of classes", () => {
    expect(() => classesOf(MadeUpReply.levelOneMonk().without(["classes"]).reader())).toThrow('"classes" is missing or is not a list');
  });

  it("refuses an empty list of classes", () => {
    expect(() => classesOf(MadeUpReply.levelOneMonk().with(["classes"], []).reader())).toThrow("lists no class");
  });

  it("takes twenty classes and refuses twenty-one", () => {
    const twenty = Array.from({ length: 20 }, () => classAt(1));
    expect(classesOf(MadeUpReply.levelOneMonk().with(["classes"], twenty).reader())).toHaveLength(20);
    expect(() => classesOf(MadeUpReply.levelOneMonk().with(["classes"], [...twenty, classAt(1)]).reader())).toThrow("The list of classes is over the limit of 20 classes.");
  });

  it("refuses a class with no definition", () => {
    expect(() => classesOf(MadeUpReply.levelOneMonk().with(["classes"], [{ level: 1 }]).reader())).toThrow('"definition" is missing');
  });

  it("refuses a class with no name", () => {
    expect(() => classesOf(MadeUpReply.levelOneMonk().without(["classes", 0, "definition", "name"]).reader())).toThrow('"name" is missing or is not text');
  });

  it("refuses a class given as a number", () => {
    expect(() => classesOf(MadeUpReply.levelOneMonk().with(["classes"], [5]).reader())).toThrow("is missing");
  });

  it("keeps the characters a note would escape in a class name, for the file name", () => {
    const reply = MadeUpReply.levelOneMonk().with(["classes", 0, "definition", "name"], "#Monk");
    expect(classesOf(reply.reader()).map((imported) => imported.name.text)).toEqual(["#Monk"]);
  });

  it("marks only the level not known when it is missing, and says why", () => {
    const monk = firstOf(classesOf(MadeUpReply.levelOneMonk().without(["classes", 0, "level"]).reader()));
    expect(monk?.name.text).toBe("Monk");
    expect(monk?.level.isKnown).toBe(false);
    expect(monk?.level.explanation).toBe("A class level is missing or is not a number.");
  });

  it.each(["1", null, true, [1], { level: 1 }, 1.5, 0, 21, -1])("marks the level %j not known", (level) => {
    const monk = firstOf(classesOf(MadeUpReply.levelOneMonk().with(["classes", 0, "level"], level).reader()));
    expect(monk?.level.isKnown).toBe(false);
  });

  it("takes the level 1 and the level 20", () => {
    expect(levelsOf(MadeUpReply.levelOneMonk().with(["classes", 0, "level"], 1))).toEqual([1]);
    expect(levelsOf(MadeUpReply.levelOneMonk().with(["classes", 0, "level"], 20))).toEqual([20]);
  });

  it("takes classes adding up to exactly 40 levels", () => {
    expect(levelsOf(MadeUpReply.levelOneMonk().with(["classes"], [classAt(20), classAt(20)]))).toEqual([20, 20]);
  });

  it("marks every level not known when the classes add up to 41", () => {
    const reply = MadeUpReply.levelOneMonk().with(["classes"], [classAt(20), classAt(20), classAt(1)]);
    const found = classesOf(reply.reader());
    expect(found.map((imported) => imported.name.text)).toEqual(["Monk", "Monk", "Monk"]);
    expect(found.map((imported) => imported.level.isKnown)).toEqual([false, false, false]);
    expect(found.map((imported) => imported.level.explanation)).toEqual(Array(3).fill("The total level has to be at most 40."));
  });

  it("does not count a level that is not known toward the total", () => {
    const reply = MadeUpReply.levelOneMonk().with(["classes"], [classAt(20), classAt(20), classAt("1")]);
    expect(levelsOf(reply)).toEqual([20, 20, -1]);
  });
});
