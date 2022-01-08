import type { Range, SourceCodeLocation } from "../common/types";
import type {
  TagNameToken,
  AttrNameToken,
  AttrValueToken,
  PunctuatorToken,
  CharactersToken,
  WhiteSpacesToken,
  NullCharacterToken,
} from "./token";

export enum TokenType {
  TagName = "TagName",
  AttrName = "AttrName",
  AttrValue = "AttrValue",
  Punctuator = "Punctuator",
  Characters = "Characters",
  WhiteSpaces = "WhiteSpaces",
  NullCharacter = "NullCharacter",
}

export interface TokenAPI<T extends TokenType> {
  type: T;
  loc: SourceCodeLocation;
  range: Range;
  value: string;
}

export type AnyToken =
  | TagNameToken
  | AttrNameToken
  | AttrValueToken
  | PunctuatorToken
  | CharactersToken
  | WhiteSpacesToken
  | NullCharacterToken;
