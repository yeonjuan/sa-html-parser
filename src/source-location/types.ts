export interface ISourceCodeLocation {
  readonly source: string | null;
  readonly start: IPosition;
  readonly end: IPosition;
}

export interface IPosition {
  readonly line: number;
  readonly column: number;
}
