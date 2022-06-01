import type { SourceCodeLocation } from "../common/types";
import { BaseNode } from "./base";
import {
  AnyAtomToken,
  AttributeToken,
  AttrNameToken,
  AttrValueToken,
  CharacterLikeToken,
  CharactersToken,
  CommentToken,
  DoctypeToken,
  EndTagToken,
  StartTagToken,
  TagNameToken,
} from "../tokens";
import { ParsingError } from "../common/errors";

export class AttributeName extends BaseNode<"AttributeName"> {
  private constructor(
    public value: string,
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("AttributeName", start, end, loc);
  }

  static fromToken(token: AttrNameToken) {
    return new AttributeName(token.value, token.start, token.end, token.loc);
  }
}

export class AttributeValue extends BaseNode<"AttributeValue"> {
  private constructor(
    public value: string,
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("AttributeValue", start, end, loc);
  }

  static fromToken(token: AttrValueToken) {
    return new AttributeValue(token.value, token.start, token.end, token.loc);
  }
}

export class Attribute extends BaseNode<"Attribute"> {
  public name!: AttributeName;
  public value: AttributeValue | null = null;

  private constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("Attribute", start, end, loc);
  }

  static fromToken(token: AttributeToken) {
    const node = new Attribute(token.start, token.end, {
      start: token.loc.start,
      end: token.loc.end,
    });
    node.name = AttributeName.fromToken(token.name);
    if (token.value) {
      node.value = AttributeValue.fromToken(token.value);
    }
    return node;
  }
}

export class ElementName extends BaseNode<"ElementName"> {
  private constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation,
    public value: string
  ) {
    super("ElementName", start, end, loc);
  }

  static fromToken(token: TagNameToken) {
    return new ElementName(token.start, token.end, token.loc, token.value);
  }
}

export class OpeningElement extends BaseNode<"OpeningElement"> {
  public attributes: Attribute[] = [];
  public name!: ElementName;
  public selfClosing: boolean = false;
  private constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("OpeningElement", start, end, loc);
  }

  static fromToken(token: StartTagToken) {
    const element = new OpeningElement(token.start, token.end, {
      ...token.loc,
    });
    element.name = ElementName.fromToken(token.tagName);
    element.attributes = token.attrs.map((tkn) => Attribute.fromToken(tkn));
    return element;
  }
}

export class ClosingElement extends BaseNode<"ClosingElement"> {
  public name!: ElementName;
  private constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("ClosingElement", start, end, loc);
  }
  static fromToken(token: EndTagToken) {
    const element = new ClosingElement(token.start, token.end, {
      ...token.loc,
    });
    element.name = ElementName.fromToken(token.tagName);
    return element;
  }
}

export class Text extends BaseNode<"Text"> {
  private constructor(
    public value: string,
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("Text", start, end, loc);
  }

  static fromToken(token: CharacterLikeToken) {
    return new Text(token.value.value, token.start, token.end, token.loc);
  }
}

export class Element extends BaseNode<"Element"> {
  public children: (Text | Element | Comment)[] = [];
  public openingElement!: OpeningElement;
  public closingElement: ClosingElement | null = null;
  private constructor(
    type: string,
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("Element", start, end, loc);
  }
  static fromToken(token: StartTagToken): Element {
    const element = new Element(
      token.tagName.value,
      token.start,
      token.end,
      token.loc
    );
    element.openingElement = OpeningElement.fromToken(token);
    return element;
  }
}

export class Root extends BaseNode<"Root"> {
  comments: Comment[] = [];
  children: (Element | Text | Comment | Doctype)[] = [];
  tokens: AnyAtomToken[] = [];
  errors: ParsingError[] = [];
  constructor() {
    super("Root", 0, 0, {
      start: { column: 0, line: 1 },
      end: { column: 0, line: 1 },
    });
  }
}

export class Comment extends BaseNode<"Comment"> {
  private constructor(
    public value: string,
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("Comment", start, end, loc);
  }

  static fromToken(token: CommentToken) {
    return new Comment(token.data.value, token.start, token.end, token.loc);
  }
}

export class Doctype extends BaseNode<"Doctype"> {
  public publicId: DoctypeId | null = null;
  public systemId: DoctypeId | null = null;
  public name!: DoctypeName;
  private constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("Doctype", start, end, loc);
  }
  static fromToken(token: DoctypeToken) {
    const element = new Doctype(token.start, token.end, token.loc);
    element.name = DoctypeName.fromToken(token.name);
    element.publicId = token.publicId
      ? DoctypeId.fromToken(token.publicId)
      : null;
    element.systemId = token.systemId
      ? DoctypeId.fromToken(token.systemId)
      : null;
    return element;
  }
}

export class DoctypeName extends BaseNode<"DoctypeName"> {
  private constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation,
    public value: string
  ) {
    super("DoctypeName", start, end, loc);
  }
  static fromToken(token: CharactersToken) {
    return new DoctypeName(token.start, token.end, token.loc, token.value);
  }
}

export class DoctypeId extends BaseNode<"DoctypeId"> {
  private constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation,
    public value: string
  ) {
    super("DoctypeId", start, end, loc);
  }
  static fromToken(token: CharactersToken) {
    return new DoctypeId(token.start, token.end, token.loc, token.value);
  }
}
