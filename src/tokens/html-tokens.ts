import {
  AttrNameToken,
  AttrValueToken,
  PunctuatorToken,
  TagNameToken,
  WhiteSpacesToken,
  CharactersToken,
  NullCharacterToken,
} from "./atom-tokens";
import { HtmlTokenType, AnyAtomToken } from "./types";
import { BaseHtmlToken } from "./base-tokens";
import { Position } from "../common/types";

export class EofToken extends BaseHtmlToken<HtmlTokenType.EOF> {
  constructor() {
    super(HtmlTokenType.EOF);
  }
  buildLocation() {}
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

  private getEndIndexAndPos(): { index: number; pos: Position } {
    const last = [
      this.closing,
      this.publicId,
      this.systemId,
      this.publicKeyword,
      this.publicId,
      this.name,
      this.opening,
    ].find((token) => !!token)!;
    return {
      index: last.end,
      pos: last.loc.end,
    };
  }
  buildLocation() {
    this.start = this.opening.start;
    const { pos, index } = this.getEndIndexAndPos();
    this.end = index;
    this.range = [this.opening?.range[0], index];

    this.loc = {
      start: this.opening.loc.start,
      end: pos,
    };
  }
  tokenize() {
    const tokens: AnyAtomToken[] = [this.opening];
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
  private getEndIndexAndPos(): { index: number; pos: Position } {
    const last = [this.closing, this.data, this.opening].find(
      (token) => !!token
    )!;
    return {
      index: last.end,
      pos: last.loc.end,
    };
  }
  buildLocation() {
    this.start = this.opening.start;
    const { pos, index } = this.getEndIndexAndPos();
    this.end = index;

    this.range = [this.opening.range[0], index];

    this.loc = { start: this.opening.loc.start, end: pos };
  }
  tokenize() {
    return [this.opening, this.data, this.closing];
  }
}

export class NullToken extends BaseHtmlToken<HtmlTokenType.Null> {
  constructor() {
    super(HtmlTokenType.Null);
  }
  buildLocation() {}
}

export class StartTagToken extends BaseHtmlToken<HtmlTokenType.StartTag> {
  opening!: PunctuatorToken;
  tagName!: TagNameToken;
  closing!: PunctuatorToken;
  selfClosing: boolean = false;
  attrs: AttributeToken[] = [];
  constructor() {
    super(HtmlTokenType.StartTag);
  }
  buildLocation() {
    this.start = this.opening.start;
    this.end = this.closing.end;

    this.range = [this.opening.range[0], this.closing.range[1]];
    this.attrs.forEach((attr) => attr.buildLocation());
    this.loc = { start: this.opening.loc.start, end: this.closing.loc.end };
  }

  tokenize(): AnyAtomToken[] {
    const tokens: AnyAtomToken[] = [this.opening, this.tagName];
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
  buildLocation() {
    this.start = this.opening.start;
    this.end = this.closing?.end;

    this.range = [this.opening.range[0], this.closing?.range[1]];

    this.loc = {
      start: this.opening.loc.start,
      end: this.closing?.loc.end,
    };
  }

  tokenize(): AnyAtomToken[] {
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
  buildLocation() {
    const valueIfExists = this.value || this.name;
    this.start = this.name.start;
    this.end = valueIfExists.end;

    this.range = [this.name.range[0], valueIfExists.range[1]];

    this.loc = {
      start: this.name.loc.start,
      end: valueIfExists.loc.end,
    };
  }

  tokenize(): AnyAtomToken[] {
    const tokens: AnyAtomToken[] = [this.name];
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
  buildLocation() {
    this.start = this.value.start;
    this.end = this.value.end;

    this.range = this.value.range;

    this.loc = this.value.loc;
  }
  tokenize(): AnyAtomToken[] | void {
    if (this.value) {
      return [this.value];
    }
  }
}
