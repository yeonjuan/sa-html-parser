import type {
  Base,
  SourceCodeLocation,
  Range,
  Position,
} from "../common/types";

export class BaseAtomToken<T extends string> implements Base<T> {
  public range: Range;
  public loc: SourceCodeLocation;
  public start: number;
  public end: number;
  constructor(
    public type: T,
    public value: string,
    startRange: number,
    startLoc: Position
  ) {
    const len = value.length;
    this.range = [startRange, startRange + len];
    this.loc = {
      start: startLoc,
      end: {
        column: startLoc.column + len,
        line: startLoc.line,
      },
    };
    this.start = this.range[0];
    this.end = this.range[1];
  }
}

export abstract class BaseHtmlToken<T extends string> implements Base<T> {
  public range!: Range;
  public start!: number;
  public end!: number;
  public loc!: SourceCodeLocation;
  constructor(public type: T) {}
  public tokenize() {}
  abstract buildLocation(): void;
}
