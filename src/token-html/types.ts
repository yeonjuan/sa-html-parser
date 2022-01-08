import {
  CommentToken,
  DoctypeToken,
  EofToken,
  CharacterLikeToken,
} from "./token-html";
import { AnyToken } from "../token";
import type { NullToken, StartTagToken, EndTagToken } from "./token-html";

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

export interface BaseHtmlTokenAPI<T extends HtmlTokenType> {
  type: T;
  tokenize(): AnyToken[] | void;
}

export type AnyHtmlToken =
  | NullToken
  | StartTagToken
  | EndTagToken
  | EofToken
  | CommentToken
  | DoctypeToken
  | CharacterLikeToken;

export type AnyTagToken = StartTagToken | EndTagToken;
