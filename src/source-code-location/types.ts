export interface SourceCodeLocation {
  source?: string | null;
  start: Position;
  end: Position;
}

export interface Position {
  line: number;
  column: number;
}
