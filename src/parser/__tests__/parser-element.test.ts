import { TagNode } from "../../nodes";
import { Parser } from "../parser";

describe("parser: element", () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
  });

  test("basic", () => {
    const result = parser.parse("<div></div>");

    expect(result.children.length).toBe(1);

    const [div] = result.children as TagNode[];

    expect(div.selfClosing).toBe(false);
    expect(div.type).toBe("div");
    expect(div.startTag.type).toBe("#StartTag");
    expect(div.endTag?.type).toBe("#EndTag");
    expect(div.start).toBe(0);
    expect(div.end).toBe(11);
    expect(div.range).toStrictEqual([0, 11]);
    expect(div.loc.start.column).toBe(0);
    expect(div.loc.start.line).toBe(1);
    expect(div.loc.end.column).toBe(11);
    expect(div.loc.end.line).toBe(1);
  });

  test("self-closing", () => {
    const result = parser.parse("<div/>");

    expect(result.children.length).toBe(1);

    const [div] = result.children as TagNode[];

    expect(div.selfClosing).toBe(true);
    expect(div.type).toBe("div");
    expect(div.tagName).toBe("div");
    expect(div.endTag).toBe(null);
    expect(div.start).toBe(0);
    expect(div.end).toBe(11);
    expect(div.range).toStrictEqual([0, 6]);
    expect(div.loc.start.column).toBe(0);
    expect(div.loc.start.line).toBe(1);
    expect(div.loc.end.column).toBe(6);
    expect(div.loc.end.line).toBe(1);
  });

  test("self-closing - nested", () => {
    const result = parser.parse("<div><input /></div>");

    expect(result.children.length).toBe(1);

    const [outer] = result.children as TagNode[];

    expect(outer.type).toBe("div");
    expect(outer.tagName).toBe("div");
    expect(outer.endTag).toBeTruthy();
    expect(outer.start).toBe(0);
    expect(outer.end).toBe(20);
    expect(outer.range).toStrictEqual([0, 20]);
    expect(outer.loc.start.column).toBe(0);
    expect(outer.loc.start.line).toBe(20);
    expect(outer.loc.end.column).toBe(20);
    expect(outer.loc.end.line).toBe(1);

    const [inner] = outer.children as TagNode[];

    expect(inner.type).toBe("input");
    expect(inner.tagName).toBe("input");
    expect(inner.selfClosing).toBe(true);
    expect(inner.start).toBe(5);
    expect(inner.end).toBe(14);
    expect(inner.range).toStrictEqual([5, 14]);
    expect(inner.loc.start.column).toBe(5);
    expect(inner.loc.start.line).toBe(1);
    expect(inner.loc.end.column).toBe(14);
    expect(inner.loc.end.line).toBe(1);
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

  test("nested 1", () => {
    const result = parser.parse("<div><span></span></div>");

    expect(result.children.length).toBe(1);

    const [div] = result.children as TagNode[];

    expect(div.type).toBe("div");
    expect(div.tagName).toBe("div");

    const [span] = div.children as TagNode[];

    expect(span.type).toBe("span");
    expect(span.tagName).toBe("span");
  });

  test.only("nested 2", () => {
    const result = parser.parse("<div><div></div></div>");

    expect(result.children.length).toBe(1);

    const [outDiv] = result.children as TagNode[];

    expect(outDiv.type).toBe("div");
    expect(outDiv.tagName).toBe("div");

    const [innerDic] = outDiv.children as TagNode[];

    expect(innerDic.type).toBe("div");
    expect(innerDic.tagName).toBe("div");
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
