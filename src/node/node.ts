import { Base, Range, SourceCodeLocation } from "../common/types";
import { AnyNode } from "./types";

class BaseNode<T extends string> implements Base<T> {
  public range: Range;
  constructor(
    public type: T,
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    this.range = [start, end];
  }
}

export class TagNode extends BaseNode<string> {
  public children: AnyNode[] = [];
}

export class CommentNode extends BaseNode<"#Comment"> {
  public children: AnyNode[] = [];
  constructor(
    public start: number,
    public end: number,
    public loc: SourceCodeLocation
  ) {
    super("#Comment", start, end, loc);
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
