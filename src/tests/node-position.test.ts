import { parse } from "../parser";
import { Element } from "../nodes";

describe("Test node's positions", () => {
  test("html 1", () => {
    const root = parse("<html></html>");
    const [html] = root.children;

    expect(root).toBeNode({
      type: "Root",
      range: [0, 13],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 13,
        },
      ],
    });
    expect(html).toBeNode({
      type: "Element",
      range: [0, 13],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 13,
        },
      ],
    });
    expect(html);
  });

  test("html new line", () => {
    const root = parse("<html>\n</html>");
    const [html] = root.children;
    expect(root).toBeNode({
      type: "Root",
      range: [0, 14],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 2,
          column: 7,
        },
      ],
    });
    expect(html).toBeNode({
      type: "Element",
      range: [0, 14],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 2,
          column: 7,
        },
      ],
    });
  });

  test("plain text", () => {
    const root = parse("plain text");
    const [text] = root.children;

    expect(root).toBeNode({
      type: "Root",
      range: [0, 10],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 10,
        },
      ],
    });
    expect(text).toBeNode({
      type: "Text",
      range: [0, 10],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 10,
        },
      ],
    });
  });

  test("plain text new line", () => {
    const root = parse("plain\ntext");
    const [text] = root.children;

    expect(root).toBeNode({
      type: "Root",
      range: [0, 10],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 2,
          column: 4,
        },
      ],
    });
    expect(text).toBeNode({
      type: "Text",
      range: [0, 10],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 2,
          column: 4,
        },
      ],
    });
  });

  test("outer plain text", () => {
    const root = parse("plain text <html></html>");
    const [text, html] = root.children;

    expect(root).toBeNode({
      type: "Root",
      range: [0, 24],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 24,
        },
      ],
    });
    expect(text).toBeNode({
      type: "Text",
      range: [0, 11],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 11,
        },
      ],
    });
    expect(html).toBeNode({
      type: "Element",
      range: [11, 24],
      loc: [
        {
          line: 1,
          column: 11,
        },
        {
          line: 1,
          column: 24,
        },
      ],
    });
  });

  test("normal", () => {
    const root = parse("<div id='foo'>content</div>");
    const [div] = root.children;
    const openingElement = (div as Element).openingElement;
    const closingElement = (div as Element).closingElement;
    const [content] = (div as Element).children;
    const [attr] = openingElement.attributes;
    const attrName = attr.name;
    const attrValue = attr.value;

    expect(root).toBeNode({
      type: "Root",
      range: [0, 27],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 27,
        },
      ],
    });
    expect(div).toBeNode({
      type: "Element",
      range: [0, 27],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 27,
        },
      ],
    });
    expect(openingElement).toBeNode({
      type: "OpeningElement",
      range: [0, 14],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 14,
        },
      ],
    });
    expect(closingElement).toBeNode({
      type: "ClosingElement",
      range: [21, 27],
      loc: [
        {
          line: 1,
          column: 21,
        },
        {
          line: 1,
          column: 27,
        },
      ],
    });
    expect(content).toBeNode({
      type: "Text",
      range: [14, 21],
      loc: [
        {
          line: 1,
          column: 14,
        },
        {
          line: 1,
          column: 21,
        },
      ],
    });
    expect(attr).toBeNode({
      type: "Attribute",
      range: [5, 13],
      loc: [
        {
          line: 1,
          column: 5,
        },
        {
          line: 1,
          column: 13,
        },
      ],
    });
    expect(attrName).toBeNode({
      type: "AttributeName",
      range: [5, 7],
      loc: [
        {
          line: 1,
          column: 5,
        },
        {
          line: 1,
          column: 7,
        },
      ],
    });
    expect(attrValue).toBeNode({
      type: "AttributeValue",
      range: [8, 13],
      loc: [
        {
          line: 1,
          column: 8,
        },
        {
          line: 1,
          column: 13,
        },
      ],
    });
  });

  test("doctype", () => {
    const root = parse("<!DOCTYPE html>\n<html>\n</html>");
    const [doctype, text, html] = root.children;

    expect(root).toBeNode({
      type: "Root",
      range: [0, 30],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 3,
          column: 7,
        },
      ],
    });

    expect(doctype).toBeNode({
      type: "Doctype",
      range: [0, 15],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 15,
        },
      ],
    });
    expect(text).toBeNode({
      type: "Text",
      range: [15, 16],
      loc: [
        {
          line: 1,
          column: 15,
        },
        {
          line: 1,
          column: 16,
        },
      ],
    });
    expect(html).toBeNode({
      type: "Element",
      range: [16, 30],
      loc: [
        {
          line: 2,
          column: 0,
        },
        {
          line: 3,
          column: 7,
        },
      ],
    });
  });

  test("self-closing", () => {
    const root = parse("<img />");
    const [img] = root.children;

    expect(root).toBeNode({
      type: "Root",
      range: [0, 7],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 7,
        },
      ],
    });

    expect(img).toBeNode({
      type: "Element",
      range: [0, 7],
      loc: [
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 7,
        },
      ],
    });
  });
});
