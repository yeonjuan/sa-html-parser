import { TagNode } from "../../nodes";
import { Parser } from "../parser";

describe("parse - element", () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
  });

  test.skip("basic", () => {
    const result = parser.parse("<div></div>");
    expect(result.children.length).toBe(1);
    const element = result.children[0] as TagNode;
    expect(element.type).toBe("div");
  });
});
