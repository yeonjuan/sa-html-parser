import type { SourceCodeLocation } from "../common/types";
import type { AnyNode } from "./types";
import { BaseNode } from "./base";
import {
  AnyAtomToken,
  AttributeToken,
  AttrNameToken,
  AttrValueToken,
  CharacterLikeToken,
  CommentToken,
  DoctypeToken,
  EndTagToken,
  StartTagToken,
} from "../tokens";

export class AttributeNameNode extends BaseNode<"AttributeName"> {
  private constructor(
    public value: string,
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("AttributeName", start, end, loc);
  }

  static fromToken(token: AttrNameToken) {
    return new AttributeNameNode(
      token.value,
      token.start,
      token.end,
      token.loc
    );
  }
}

export class AttributeValueNode extends BaseNode<"AttributeValue"> {
  private constructor(
    public value: string,
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("AttributeValue", start, end, loc);
  }

  static fromToken(token: AttrValueToken) {
    return new AttributeValueNode(
      token.value,
      token.start,
      token.end,
      token.loc
    );
  }
}

export class AttributeNode extends BaseNode<"Attribute"> {
  public name!: AttributeNameNode;
  public value?: AttributeValueNode;

  private constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("Attribute", start, end, loc);
  }

  static fromToken(token: AttributeToken) {
    const node = new AttributeNode(token.start, token.end, {
      start: token.loc.start,
      end: token.loc.end,
    });
    node.name = AttributeNameNode.fromToken(token.name);
    if (token.value) {
      node.value = AttributeValueNode.fromToken(token.value);
    }
    return node;
  }
}

export class OpeningElementNode extends BaseNode<"OpeningElement"> {
  public attributes: AttributeNode[] = [];
  private constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("OpeningElement", start, end, loc);
  }

  static fromToken(token: StartTagToken) {
    const element = new OpeningElementNode(token.start, token.end, token.loc);
    element.attributes = token.attrs.map((tkn) => AttributeNode.fromToken(tkn));
    return element;
  }
}

export class ClosingElementNode extends BaseNode<"ClosingElement"> {
  private constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("ClosingElement", start, end, loc);
  }
  static fromToken(token: EndTagToken) {
    return new ClosingElementNode(token.start, token.end, token.loc);
  }
}

export class TextNode extends BaseNode<"Text"> {
  private constructor(
    public value: string,
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("Text", start, end, loc);
  }

  static fromToken(token: CharacterLikeToken) {
    return new TextNode(token.value.value, token.start, token.end, token.loc);
  }
}

export class ElementNode extends BaseNode<"Element"> {
  public children: (TextNode | ElementNode)[] = [];
  public openingElement!: OpeningElementNode;
  public closingElement: ClosingElementNode | null = null;
  public selfClosing: boolean = false;
  private constructor(
    type: string,
    public start: number,
    public end: number,
    public loc: SourceCodeLocation,
    public tagName: string
  ) {
    super("Element", start, end, loc);
  }
  static fromToken(token: StartTagToken): ElementNode {
    const element = new ElementNode(
      token.tagName.value,
      token.opening.start,
      token.closing.end,
      {
        start: token.opening.loc.start,
        end: token.closing.loc.end,
      },
      token.tagName.value
    );
    element.openingElement = OpeningElementNode.fromToken(token);
    return element;
  }
}

export class RootNode extends BaseNode<"Root"> {
  comments: CommentNode[] = [];
  children: AnyNode[] = [];
  tokens: AnyAtomToken[] = [];
  constructor() {
    super("Root", 0, 0, {
      start: { column: 0, line: 1 },
      end: { column: 0, line: 1 },
    });
  }
}

export class CommentNode extends BaseNode<"Comment"> {
  private constructor(
    public value: string,
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("Comment", start, end, loc);
  }

  static fromToken(token: CommentToken) {
    return new CommentNode(
      token.data.value,
      token.opening.start,
      token.closing.end,
      {
        start: token.opening.loc.start,
        end: token.closing.loc.end,
      }
    );
  }
}

export class DoctypeNode extends BaseNode<"DocumentType"> {
  private constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("DocumentType", start, end, loc);
  }
  static fromToken(token: DoctypeToken) {
    return new DoctypeNode(token.opening.start, token.closing.end, {
      start: token.opening.loc.start,
      end: token.closing.loc.end,
    });
  }
}
