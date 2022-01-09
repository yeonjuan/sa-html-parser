import type { Position } from "../common/types";
import { AtomTokenType } from "./types";
import { BaseAtomToken } from "./base-tokens";

export class TagNameToken extends BaseAtomToken<AtomTokenType.TagName> {
  constructor(value: string, startRange: number, startLoc: Position) {
    super(AtomTokenType.TagName, value, startRange, startLoc);
  }
}

export class AttrNameToken extends BaseAtomToken<AtomTokenType.AttrName> {
  constructor(value: string, startRange: number, startLoc: Position) {
    super(AtomTokenType.AttrName, value, startRange, startLoc);
  }
}

export class AttrValueToken extends BaseAtomToken<AtomTokenType.AttrValue> {
  constructor(value: string, startRange: number, startLoc: Position) {
    super(AtomTokenType.AttrValue, value, startRange, startLoc);
  }
}

export class PunctuatorToken extends BaseAtomToken<AtomTokenType.Punctuator> {
  constructor(value: string, startRange: number, startLoc: Position) {
    super(AtomTokenType.Punctuator, value, startRange, startLoc);
  }
}

export class CharactersToken extends BaseAtomToken<AtomTokenType.Characters> {
  constructor(value: string, startRange: number, startLoc: Position) {
    super(AtomTokenType.Characters, value, startRange, startLoc);
  }
}

export class WhiteSpacesToken extends BaseAtomToken<AtomTokenType.WhiteSpaces> {
  constructor(value: string, startRange: number, startLoc: Position) {
    super(AtomTokenType.WhiteSpaces, value, startRange, startLoc);
  }
}

export class NullCharacterToken extends BaseAtomToken<AtomTokenType.NullCharacter> {
  constructor(value: string, startRange: number, startLoc: Position) {
    super(AtomTokenType.NullCharacter, value, startRange, startLoc);
  }
}
