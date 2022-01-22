import { ElementNode } from "../../nodes";
import { parse } from "../parser";

describe("parser: element", () => {
  test("basic", () => {
    const result = parse("<div></div>");

    expect(result.children.length).toBe(1);

    const [div] = result.children as ElementNode[];

    expect(div.openingElement.selfClosing).toBe(false);
    expect(div.type).toBe("Element");
    expect(div.openingElement.type).toBe("OpeningElement");
    expect(div.closingElement?.type).toBe("ClosingElement");
    expect(div.start).toBe(0);
    expect(div.end).toBe(11);
    expect(div.range).toStrictEqual([0, 11]);
    expect(div.loc.start.column).toBe(0);
    expect(div.loc.start.line).toBe(1);
    expect(div.loc.end.column).toBe(11);
    expect(div.loc.end.line).toBe(1);
  });

  test("uppercase", () => {
    const result = parse("<DIV></DIV>");

    expect(result.children.length).toBe(1);

    const [div] = result.children as ElementNode[];

    expect(div.openingElement.selfClosing).toBe(false);
    expect(div.type).toBe("Element");
    expect(div.openingElement.name.value).toBe("div");
    expect(div.openingElement.type).toBe("OpeningElement");
    expect(div.closingElement?.type).toBe("ClosingElement");
    expect(div.start).toBe(0);
    expect(div.end).toBe(11);
    expect(div.range).toStrictEqual([0, 11]);
    expect(div.loc.start.column).toBe(0);
    expect(div.loc.start.line).toBe(1);
    expect(div.loc.end.column).toBe(11);
    expect(div.loc.end.line).toBe(1);
  });

  test("self-closing", () => {
    const result = parse("<div/>");

    expect(result.children.length).toBe(1);

    const [div] = result.children as ElementNode[];

    expect(div.openingElement.selfClosing).toBe(true);
    expect(div.type).toBe("Element");
    expect(div.openingElement.name.value).toBe("div");
    expect(div.closingElement).toBe(null);
    expect(div.start).toBe(0);
    expect(div.end).toBe(6);
    expect(div.range).toStrictEqual([0, 6]);
    expect(div.loc.start.column).toBe(0);
    expect(div.loc.start.line).toBe(1);
    expect(div.loc.end.column).toBe(6);
    expect(div.loc.end.line).toBe(1);
  });

  test("self-closing - nested", () => {
    const result = parse("<div><input /></div>");

    expect(result.children.length).toBe(1);

    const [outer] = result.children as ElementNode[];

    expect(outer.type).toBe("Element");
    expect(outer.openingElement.name.value).toBe("div");
    expect(outer.closingElement).toBeTruthy();
    expect(outer.start).toBe(0);
    expect(outer.end).toBe(20);
    expect(outer.range).toStrictEqual([0, 20]);
    expect(outer.loc.start.column).toBe(0);
    expect(outer.loc.start.line).toBe(1);
    expect(outer.loc.end.column).toBe(20);
    expect(outer.loc.end.line).toBe(1);

    const [inner] = outer.children as ElementNode[];

    expect(inner.type).toBe("Element");
    expect(inner.openingElement.name.value).toBe("input");
    expect(inner.openingElement.selfClosing).toBe(true);
    expect(inner.start).toBe(5);
    expect(inner.end).toBe(14);
    expect(inner.range).toStrictEqual([5, 14]);
    expect(inner.loc.start.column).toBe(5);
    expect(inner.loc.start.line).toBe(1);
    expect(inner.loc.end.column).toBe(14);
    expect(inner.loc.end.line).toBe(1);
  });

  test("multiples", () => {
    const result = parse("<div></div><span></span>");

    expect(result.children.length).toBe(2);

    const [first, second] = result.children as ElementNode[];

    expect(first.type).toBe("Element");
    expect(first.openingElement.name.value).toBe("div");

    expect(second.type).toBe("Element");
    expect(second.openingElement.name.value).toBe("span");
  });

  test("nested 1", () => {
    const result = parse("<div><span></span></div>");

    expect(result.children.length).toBe(1);

    const [div] = result.children as ElementNode[];

    expect(div.type).toBe("Element");
    expect(div.openingElement.name.value).toBe("div");

    const [span] = div.children as ElementNode[];

    expect(span.type).toBe("Element");
    expect(span.openingElement.name.value).toBe("span");
  });

  test("nested 2", () => {
    const result = parse("<div><div></div></div>");

    expect(result.children.length).toBe(1);

    const [outDiv] = result.children as ElementNode[];

    expect(outDiv.type).toBe("Element");
    expect(outDiv.openingElement.name.value).toBe("div");

    const [innerDic] = outDiv.children as ElementNode[];

    expect(innerDic.type).toBe("Element");
    expect(innerDic.openingElement.name.value).toBe("div");
  });

  test("unclosed", () => {
    const result = parse("<div>");
    expect(result.children.length).toBe(1);

    const [div] = result.children as ElementNode[];

    expect(div.type).toBe("Element");
    expect(div.openingElement.name.value).toBe("div");
    expect(div.closingElement).toBeFalsy();
  });

  test("unclosed - multiple", () => {
    const result = parse("<div><span>");

    expect(result.children.length).toBe(2);
    const [first, second] = result.children as ElementNode[];

    expect(first.type).toBe("Element");
    expect(first.openingElement.name.value).toBe("div");
    expect(first.closingElement).toBeFalsy();

    expect(second.type).toBe("Element");
    expect(second.openingElement.name.value).toBe("span");
    expect(second.closingElement).toBeFalsy();
  });

  test("unclosed - nested", () => {
    const result = parse("<div><input></div>");

    expect(result.children.length).toBe(1);

    const div = result.children[0] as ElementNode;
    expect(div.type).toBe("Element");
    expect(div.openingElement.name.value).toBe("div");

    const input = div.children[0] as ElementNode;
    expect(input.type).toBe("Element");
    expect(input.openingElement.name.value).toBe("input");
  });

  test("content", () => {
    const result = parse("<div>text</div>");

    expect(result.children.length).toBe(1);

    const div = result.children[0] as ElementNode;
    expect(div.type).toBe("Element");

    const [text] = div.children;
    expect(text.type).toBe("Text");
  });

  test("attrs", () => {
    const result = parse(`<div foo="foo" bar='bar'>text</div>`);

    expect(result.children.length).toBe(1);

    const div = result.children[0] as ElementNode;
    expect(div.type).toBe("Element");
    expect(div.openingElement.name.value).toBe("div");
    expect(div.openingElement.attributes.length).toBe(2);
    expect(div.openingElement.attributes[0].type).toBe("Attribute");
    expect(div.openingElement.attributes[0].name.type).toBe("AttributeName");
    expect(div.openingElement.attributes[0].name.value).toBe(`foo`);
    expect(div.openingElement.attributes[0].type).toBe("Attribute");
    expect(div.openingElement.attributes[0].value?.type).toBe("AttributeValue");
    expect(div.openingElement.attributes[0].value?.value).toBe(`"foo"`);
    expect(div.openingElement.attributes[1].type).toBe("Attribute");
    expect(div.openingElement.attributes[1].name.type).toBe("AttributeName");
    expect(div.openingElement.attributes[1].name.value).toBe(`bar`);
    expect(div.openingElement.attributes[1].type).toBe("Attribute");
    expect(div.openingElement.attributes[1].value?.type).toBe("AttributeValue");
    expect(div.openingElement.attributes[1].value?.value).toBe(`'bar'`);
    expect(div.children[0].type).toBe("Text");
    expect((div.children[0] as any).value).toBe("text");
  });
});
