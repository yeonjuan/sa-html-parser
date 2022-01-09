import type { SourceCodeLocation } from "../common/types";
import type { AnyNode } from "./types";
import { BaseNode } from "./base";
import { AnyAtomToken, CommentToken } from "../tokens";

export class TagNode extends BaseNode<string> {
  public children: AnyNode[] = [];
}

export class Program extends BaseNode<"Program"> {
  comments: CommentNode[] = [];
  tokens: AnyAtomToken[] = [];
  constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("Program", start, end, loc);
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
  constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("#DocumentType", start, end, loc);
  }
}
