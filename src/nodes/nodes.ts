import type { SourceCodeLocation } from "../common/types";
import type { AnyNode } from "./types";
import { BaseNode } from "./base";
import {
  AnyAtomToken,
  AttributeToken,
  AttrNameToken,
  AttrValueToken,
  CommentToken,
  DoctypeToken,
  EndTagToken,
  StartTagToken,
} from "../tokens";

export class AttributeNode extends BaseNode<"#Attribute"> {
  public name!: AttrNameToken;
  public value?: AttrValueToken;

  private constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("#Attribute", start, end, loc);
  }

  static fromToken(token: AttributeToken) {
    const node = new AttributeNode(token.start, token.end, {
      start: token.loc.start,
      end: token.loc.end,
    });
    node.name = token.name;
    node.value = token.value;
    return node;
  }
}

export class TagNode extends BaseNode<string> {
  public children: AnyNode[] = [];
  public closing!: EndTagToken;
  public attrs: AttributeNode[] = [];
  private constructor(
    type: string,
    public start: number,
    public end: number,
    public loc: SourceCodeLocation,
    public tagName: string
  ) {
    super(type, start, end, loc);
  }
  static fromToken(token: StartTagToken): TagNode {
    const element = new TagNode(
      token.tagName.value,
      token.opening.start,
      token.closing.end,
      {
        start: token.opening.loc.start,
        end: token.closing.loc.end,
      },
      token.tagName.value
    );
    element.attrs = token.attrs.map((tkn) => AttributeNode.fromToken(tkn));
    return element;
  }
}

export class Root extends BaseNode<"#Root"> {
  comments: CommentNode[] = [];
  children: AnyNode[] = [];
  tokens: AnyAtomToken[] = [];
  constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("#Root", start, end, loc);
  }
}

export class CommentNode extends BaseNode<"Block"> {
  private constructor(
    public value: string,
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("Block", start, end, loc);
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

export class TextNode extends BaseNode<"#Text"> {
  constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("#Text", start, end, loc);
  }
}

export class DoctypeNode extends BaseNode<"#DocumentType"> {
  private constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("#DocumentType", start, end, loc);
  }
  static fromToken(token: DoctypeToken) {
    return new DoctypeNode(token.opening.start, token.closing.end, {
      start: token.opening.loc.start,
      end: token.closing.loc.end,
    });
  }
}
