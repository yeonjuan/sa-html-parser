import { Base, Range, SourceCodeLocation } from "../common/types";

export class BaseNode<T extends string> implements Base<T> {
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
