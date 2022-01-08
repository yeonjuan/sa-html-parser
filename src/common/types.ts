export interface SourceCodeLocation {
  source?: string | null;
  start: Position;
  end: Position;
}

export interface Position {
  line: number;
  column: number;
}

export type Range = [number, number];

export interface Base<T extends string> {
  type: T;
  start: number;
  end: number;
  loc: SourceCodeLocation;
  range: Range;
}
