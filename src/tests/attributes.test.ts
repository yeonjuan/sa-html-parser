import { parse } from "../parser";
import { Element } from "../nodes";

describe("attributes", () => {
  test("boolean", () => {
    const root = parse("<div foo>");
    const [div] = root.children;
    const attrs = (div as Element).openingElement.attributes;
    const [attrFoo] = attrs;

    expect(attrs.length).toBe(1);
    expect(attrFoo).toBeNode({
      type: "Attribute",
      range: [5, 8],
      loc: [
        { line: 1, column: 5 },
        { line: 1, column: 8 },
      ],
    });
    expect(attrFoo.name).toBeNode({
      type: "AttributeName",
      range: [5, 8],
      loc: [
        { line: 1, column: 5 },
        { line: 1, column: 8 },
      ],
    });
    expect(attrFoo.name.value).toBe("foo");
    expect(attrFoo.value).toBe(null);
  });

  test("unquoted", () => {
    const root = parse("<div foo=a>");
    const [div] = root.children;
    const attrs = (div as Element).openingElement.attributes;
    const [attrFoo] = attrs;

    expect(attrs.length).toBe(1);
    expect(attrFoo).toBeNode({
      type: "Attribute",
      range: [5, 10],
      loc: [
        { line: 1, column: 5 },
        { line: 1, column: 10 },
      ],
    });
    expect(attrFoo.name.value).toBe("foo");
    expect(attrFoo.value).toBeNode({
      type: "AttributeValue",
      range: [9, 10],
      loc: [
        { line: 1, column: 9 },
        { line: 1, column: 10 },
      ],
    });
    expect(attrFoo.value?.value).toBe("a");
  });

  test("unquoted ampersand", () => {
    const root = parse("<div foo=&>");
    const [div] = root.children;
    const attrs = (div as Element).openingElement.attributes;
    const [attrFoo] = attrs;

    expect(attrs.length).toBe(1);
    expect(attrFoo).toBeNode({
      type: "Attribute",
      range: [5, 10],
      loc: [
        { line: 1, column: 5 },
        { line: 1, column: 10 },
      ],
    });
    expect(attrFoo.name.value).toBe("foo");
    expect(attrFoo.value).toBeNode({
      type: "AttributeValue",
      range: [9, 10],
      loc: [
        { line: 1, column: 9 },
        { line: 1, column: 10 },
      ],
    });
    expect(attrFoo.value?.value).toBe("&");
  });

  test("double quoted ampersand", () => {
    const root = parse('<div foo="&">');
    const [div] = root.children;
    const attrs = (div as Element).openingElement.attributes;
    const [attrFoo] = attrs;

    expect(attrs.length).toBe(1);
    expect(attrFoo).toBeNode({
      type: "Attribute",
      range: [5, 12],
      loc: [
        { line: 1, column: 5 },
        { line: 1, column: 12 },
      ],
    });
    expect(attrFoo.name.value).toBe("foo");
    expect(attrFoo.value).toBeNode({
      type: "AttributeValue",
      range: [9, 12],
      loc: [
        { line: 1, column: 9 },
        { line: 1, column: 12 },
      ],
    });
    expect(attrFoo.value?.value).toBe('"&"');
  });

  test("single quoted ampersand", () => {
    const root = parse("<div foo='&'>");
    const [div] = root.children;
    const attrs = (div as Element).openingElement.attributes;
    const [attrFoo] = attrs;

    expect(attrs.length).toBe(1);
    expect(attrFoo).toBeNode({
      type: "Attribute",
      range: [5, 12],
      loc: [
        { line: 1, column: 5 },
        { line: 1, column: 12 },
      ],
    });
    expect(attrFoo.name.value).toBe("foo");
    expect(attrFoo.value).toBeNode({
      type: "AttributeValue",
      range: [9, 12],
      loc: [
        { line: 1, column: 9 },
        { line: 1, column: 12 },
      ],
    });
    expect(attrFoo.value?.value).toBe("'&'");
  });

  test("no space between", () => {
    const root = parse("<div foo='foo'bar='bar'>");
    const [div] = root.children;
    const attrs = (div as Element).openingElement.attributes;
    const [attrFoo, attrBar] = attrs;

    expect(attrs.length).toBe(2);
    expect(attrFoo).toBeNode({
      type: "Attribute",
      range: [5, 14],
      loc: [
        { line: 1, column: 5 },
        { line: 1, column: 14 },
      ],
    });
    expect(attrFoo.name).toBeNode({
      type: "AttributeName",
      range: [5, 8],
      loc: [
        { line: 1, column: 5 },
        { line: 1, column: 8 },
      ],
    });
    expect(attrFoo.value).toBeNode({
      type: "AttributeValue",
      range: [9, 14],
      loc: [
        { line: 1, column: 9 },
        { line: 1, column: 14 },
      ],
    });
    expect(attrFoo.value?.value).toBe("'foo'");
    expect(attrBar).toBeNode({
      type: "Attribute",
      range: [14, 23],
      loc: [
        { line: 1, column: 14 },
        { line: 1, column: 23 },
      ],
    });
    expect(attrBar.value).toBeNode({
      type: "AttributeValue",
      range: [18, 23],
      loc: [
        { line: 1, column: 18 },
        { line: 1, column: 23 },
      ],
    });
    expect(attrBar.value?.value).toBe("'bar'");
  });
});
