import { BaseHtmlTokenAPI, HtmlTokenType } from "./types";
import {
  AnyToken,
  AttrNameToken,
  AttrValueToken,
  PunctuatorToken,
  TagNameToken,
  WhiteSpacesToken,
  CharactersToken,
  NullCharacterToken,
} from "../token";

class BaseHtmlToken<T extends HtmlTokenType> implements BaseHtmlTokenAPI<T> {
  constructor(public type: T) {}
  public tokenize() {}
}

export class EofToken extends BaseHtmlToken<HtmlTokenType.EOF> {
  constructor() {
    super(HtmlTokenType.EOF);
  }
}

export class DoctypeToken extends BaseHtmlToken<HtmlTokenType.Doctype> {
  name!: CharactersToken;
  opening!: PunctuatorToken;
  closing!: PunctuatorToken;
  forceQuirks: boolean = true;
  systemId!: CharactersToken;
  publicId!: CharactersToken;
  publicKeyword!: CharactersToken;
  systemKeyword!: CharactersToken;
  constructor() {
    super(HtmlTokenType.Doctype);
  }
  tokenize() {
    const tokens: AnyToken[] = [this.opening];
    this.name && tokens.push(this.name);
    this.publicKeyword && tokens.push(this.publicKeyword);
    this.systemKeyword && tokens.push(this.systemKeyword);
    this.publicId && tokens.push(this.publicId);
    this.systemId && tokens.push(this.systemId);
    tokens.push(this.closing);
    return tokens;
  }
}

export class CommentToken extends BaseHtmlToken<HtmlTokenType.Comment> {
  opening!: PunctuatorToken;
  data!: CharactersToken;
  closing!: PunctuatorToken;
  constructor() {
    super(HtmlTokenType.Comment);
  }

  tokenize() {
    return [this.opening, this.data, this.closing];
  }
}

export class NullToken extends BaseHtmlToken<HtmlTokenType.Null> {
  constructor() {
    super(HtmlTokenType.Null);
  }
}

export class StartTagToken extends BaseHtmlToken<HtmlTokenType.StartTag> {
  opening!: PunctuatorToken;
  tagName!: TagNameToken;
  closing!: PunctuatorToken;
  attrs: AttributeToken[] = [];
  constructor() {
    super(HtmlTokenType.StartTag);
  }

  tokenize(): AnyToken[] {
    const tokens: AnyToken[] = [this.opening, this.tagName];
    if (this.attrs.length) {
      this.attrs.forEach((attr) => {
        tokens.push(...attr.tokenize());
      });
    }
    tokens.push(this.closing);
    return tokens;
  }
}

export class EndTagToken extends BaseHtmlToken<HtmlTokenType.EndTag> {
  opening!: PunctuatorToken;
  tagName!: TagNameToken;
  closing!: PunctuatorToken;
  attrs: AttributeToken[] = [];
  constructor() {
    super(HtmlTokenType.EndTag);
  }
  tokenize(): AnyToken[] {
    return [this.opening, this.tagName, this.closing];
  }
}

export class AttributeToken extends BaseHtmlToken<HtmlTokenType.Attribute> {
  name!: AttrNameToken;
  between?: PunctuatorToken;
  value?: AttrValueToken;
  constructor() {
    super(HtmlTokenType.Attribute);
  }
  tokenize(): AnyToken[] {
    const tokens: AnyToken[] = [this.name];
    this.between && tokens.push(this.between);
    this.value && tokens.push(this.value);
    return tokens;
  }
}

export class CharacterLikeToken extends BaseHtmlToken<HtmlTokenType.CharacterLike> {
  value!: WhiteSpacesToken | CharactersToken | NullCharacterToken;
  constructor() {
    super(HtmlTokenType.CharacterLike);
  }
  tokenize(): AnyToken[] | void {
    if (this.value) {
      return [this.value];
    }
  }
}
