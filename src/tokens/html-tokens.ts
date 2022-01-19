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

  private getLastToken(): AnyAtomToken {
    const last = [
      this.closing,
      this.publicId,
      this.systemId,
      this.publicKeyword,
      this.publicId,
      this.name,
      this.opening,
    ].find((token) => !!token)!;
    return last;
  }
  buildLocation() {
    const tkn = this.getLastToken();
    this.start = this.opening.start;
    this.end = tkn.end;
    this.range = [this.opening?.range[0], tkn.range[1]];

    this.loc = {
      start: this.opening.loc.start,
      end: tkn.loc.end,
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
  private getLastToken(): AnyAtomToken {
    if (this.closing) {
      return this.closing;
    } else if (this.data) {
      return this.data;
    } else {
      return this.opening;
    }
  }
  buildLocation() {
    const tkn = this.getLastToken();
    this.start = this.opening.start;
    this.end = tkn.end;
    this.range = [this.opening.range[0], tkn.range[1]];
    this.loc = { start: this.opening.loc.start, end: tkn.loc.end };
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

  private getLastToken(): AnyAtomToken {
    let last: AnyAtomToken;
    if (this.closing) {
      last = this.closing;
    } else if (this.attrs.length) {
      const lastAttr = this.attrs[this.attrs.length - 1];
      last = lastAttr?.value ?? lastAttr.name;
    } else if (this.tagName) {
      last = this.tagName;
    } else {
      last = this.opening;
    }
    return last;
  }

  buildLocation() {
    const tkn = this.getLastToken();
    this.start = this.opening.start;
    this.end = tkn.end;

    this.range = [this.opening.range[0], tkn.range[1]];
    this.attrs.forEach((attr) => attr.buildLocation());
    this.loc = { start: this.opening.loc.start, end: tkn.loc.end };
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

  private getLastToken(): AnyAtomToken {
    if (this.value) {
      return this.value;
    } else if (this.between) {
      return this.between;
    } else {
      return this.name;
    }
  }

  buildLocation() {
    const tkn = this.getLastToken();
    this.start = this.name.start;
    this.end = tkn.end;
    this.range = [this.name.range[0], tkn.range[1]];
    this.loc = {
      start: this.name.loc.start,
      end: tkn.loc.end,
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
