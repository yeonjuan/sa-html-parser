import { CommentToken } from ".";
import type {
  TagNameToken,
  AttrNameToken,
  AttrValueToken,
  PunctuatorToken,
  CharactersToken,
  WhiteSpacesToken,
  NullCharacterToken,
} from "./atom-tokens";

import type {
  EofToken,
  DoctypeToken,
  NullToken,
  StartTagToken,
  EndTagToken,
  AttributeToken,
  CharacterLikeToken,
} from "./html-tokens";

export enum AtomTokenType {
  TagName = "TagName",
  AttrName = "AttrName",
  AttrValue = "AttrValue",
  Punctuator = "Punctuator",
  Characters = "Characters",
  WhiteSpaces = "WhiteSpaces",
  NullCharacter = "NullCharacter",
}

export type AnyAtomToken =
  | TagNameToken
  | AttrNameToken
  | AttrValueToken
  | PunctuatorToken
  | CharactersToken
  | WhiteSpacesToken
  | NullCharacterToken;

export enum HtmlTokenType {
  None = "None",
  StartTag = "StartTag",
  EndTag = "EndTag",
  Comment = "Comment",
  Doctype = "Doctype",
  CharacterLike = "CharacterLike",
  Null = "Null",
  EOF = "EOF",
  Attribute = "Attribute",
}

export type AnyHtmlToken =
  | EofToken
  | DoctypeToken
  | NullToken
  | StartTagToken
  | EndTagToken
  | AttributeToken
  | CharacterLikeToken
  | CommentToken;
