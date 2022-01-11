import { TagNode } from "../../nodes";
import { Parser } from "../parser";

describe("parse - element", () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
  });

  test("basic", () => {
    const result = parser.parse("<div></div>");

    expect(result.children.length).toBe(1);

    const element = result.children[0] as TagNode;

    expect(element.selfClosing).toBe(false);
    expect(element.type).toBe("div");
    expect(element.startTag.type).toBe("#StartTag");
    expect(element.endTag?.type).toBe("#EndTag");
  });

  test("self-closing", () => {
    const result = parser.parse("<div/>");

    expect(result.children.length).toBe(1);

    const element = result.children[0] as TagNode;

    expect(element.selfClosing).toBe(true);
    expect(element.type).toBe("div");
    expect(element.tagName).toBe("div");
    expect(element.endTag).toBe(null);
  });

  test("self-closing - nested", () => {
    const result = parser.parse("<div><input /></div>");

    expect(result.children.length).toBe(1);

    const element = result.children[0] as TagNode;

    expect(element.type).toBe("div");
    expect(element.tagName).toBe("div");
    expect(element.endTag).toBeTruthy();

    const nested = element.children[0] as TagNode;

    expect(nested.type).toBe("input");
    expect(nested.selfClosing).toBe(true);
  });

  test("multiples", () => {
    const result = parser.parse("<div></div><span></span>");

    expect(result.children.length).toBe(2);

    const [first, second] = result.children as TagNode[];

    expect(first.type).toBe("div");
    expect(first.tagName).toBe("div");

    expect(second.type).toBe("span");
    expect(second.tagName).toBe("span");
  });

  test("nested", () => {
    const result = parser.parse("<div><span></span></div>");

    expect(result.children.length).toBe(1);

    const [div] = result.children as TagNode[];

    expect(div.type).toBe("div");
    expect(div.tagName).toBe("div");

    const [span] = div.children as TagNode[];

    expect(span.type).toBe("span");
    expect(span.tagName).toBe("span");
  });

  test("unclosed", () => {
    const result = parser.parse("<div>");

    expect(result.children.length).toBe(1);

    const [div] = result.children as TagNode[];

    expect(div.type).toBe("div");
    expect(div.tagName).toBe("div");
    expect(div.endTag).toBeFalsy();
  });

  test("unclosed - multiple", () => {
    const result = parser.parse("<div><span>");

    expect(result.children.length).toBe(2);

    const [first, second] = result.children as TagNode[];

    expect(first.type).toBe("div");
    expect(first.tagName).toBe("div");
    expect(first.endTag).toBeFalsy();

    expect(second.type).toBe("span");
    expect(second.tagName).toBe("span");
    expect(second.endTag).toBeFalsy();
  });

  test("unclosed - nested", () => {
    const result = parser.parse("<div><input></div>");

    expect(result.children.length).toBe(1);

    const div = result.children[0] as TagNode;
    expect(div.type).toBe("div");

    const input = div.children[0] as TagNode;
    expect(input.type).toBe("input");
  });
});
