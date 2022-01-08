import type { Position } from "../common/types";

export interface PositionTrackerActionAPI {
  track(index: number, char: string): void;
}

export interface PositionTrackerGetAPI {
  getStartPosition(): Position;
  getStartRange(): number;
}
