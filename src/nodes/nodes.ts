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
    const nameToken = token.name;
    const valueToken = token.value || token.name;
    const node = new AttributeNode(nameToken.start, valueToken.end, {
      start: nameToken.loc.start,
      end: valueToken.loc.end,
    });
    node.name = token.name;
    node.value = token.value;
    return node;
  }
}

export class StartTagNode extends BaseNode<"#StartTag"> {
  private constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("#StartTag", start, end, loc);
  }

  static fromToken(token: StartTagToken) {
    return new StartTagNode(token.start, token.end, token.loc);
  }
}

export class EndTagNode extends BaseNode<"#EndTag"> {
  private constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("#EndTag", start, end, loc);
  }
  static fromToken(token: EndTagToken) {
    return new EndTagNode(token.start, token.end, token.loc);
  }
}

export class TagNode extends BaseNode<string> {
  public children: AnyNode[] = [];
  public startTag!: StartTagNode;
  public endTag: EndTagNode | null = null;
  public attrs: AttributeNode[] = [];
  public selfClosing: boolean = false;
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
    element.startTag = StartTagNode.fromToken(token);
    element.attrs = token.attrs.map((tkn) => AttributeNode.fromToken(tkn));
    return element;
  }
}

export class Root extends BaseNode<"#Root"> {
  comments: CommentNode[] = [];
  children: AnyNode[] = [];
  tokens: AnyAtomToken[] = [];
  constructor() {
    super("#Root", 0, 0, {
      start: { column: 0, line: 1 },
      end: { column: 0, line: 1 },
    });
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
