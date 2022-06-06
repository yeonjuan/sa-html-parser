import {
  CODE_POINTS,
  CODE_POINT_SEQUENCES,
  REPLACEMENT_CHARACTER,
  C1_CONTROLS_REFERENCE_REPLACEMENTS,
} from "../common/constants";
import { TokenizerState } from "./tokenizer-state";
import { PositionTracker } from "./position-tracker";
import * as utils from "../common/utils";
import { ParsingError, TokenizingErrors } from "../common/errors";
import {
  AttributeToken,
  CommentToken,
  DoctypeToken,
  EndTagToken,
  EofToken,
  StartTagToken,
  CharacterLikeToken,
  AnyHtmlToken,
  HtmlTokenType,
} from "../tokens";
import {
  AttrNameToken,
  AttrValueToken,
  CharactersToken,
  NullCharacterToken,
  PunctuatorToken,
  TagNameToken,
  AtomTokenType,
  WhiteSpacesToken,
} from "../tokens";
import { Position } from "../common/types";

export class Tokenizer {
  private posTracker = new PositionTracker();
  private state: TokenizerState = TokenizerState.DataState;
  private index: number = -1;
  private returnState: TokenizerState | null = null;
  private tokens: AnyHtmlToken[] = [];
  private punctuatorTokens: PunctuatorToken[] = [];

  private currentToken: AnyHtmlToken | null = null;
  private currentCharacterData: CharacterLikeToken | null = null;
  private currentAttributeToken: AttributeToken | null = null;

  private temporaryBuffer: (number | string)[] = [];
  private charRefCode: number = 0;

  private constructor(private input: string) {}
  public errors: ParsingError[] = [];

  private lastStartTagName = "";

  /**
   * Create Tokenizer
   * @param {string} input HTML string.
   * @returns Tokenizer instance.
   */
  public static create(input: string) {
    return new Tokenizer(input);
  }

  public hasError(): boolean {
    return this.errors.length > 0;
  }

  public flushErrors(): ParsingError[] {
    const errors = this.errors;
    this.errors = [];
    return errors;
  }

  private switchStateTo(state: TokenizerState) {
    this.state = state;
  }

  private setReturnState(state: TokenizerState) {
    this.returnState = state;
  }

  private reconsumeInState(state: TokenizerState) {
    this.unconsume();
    this.state = state;
  }

  public getNextToken() {
    while (!this.tokens.length) {
      const codePoint = this.consume();
      this[this.state](codePoint);
    }
    const token = this.tokens.shift();
    token?.buildLocation();
    return token;
  }

  private consume(): number {
    this.index++;
    this.posTracker.track(this.index, this.input[this.index]);
    if (this.index >= this.input.length) {
      return CODE_POINTS.EOF;
    }
    return this.input.charCodeAt(this.index);
  }

  private unconsume() {
    this.index--;
    this.posTracker.back();
  }

  private leaveAttributeName(state: TokenizerState) {
    (this.currentToken as StartTagToken).attrs.push(
      this.currentAttributeToken!
    );
    this.state = state;
  }

  private parseError(
    error: typeof TokenizingErrors[keyof typeof TokenizingErrors]
  ) {
    const index = this.posTracker.getStartRange();
    const pos = this.posTracker.getStartPosition();
    this.errors.push(new ParsingError(pos, index, error));
  }

  // ===================================================================
  // Create tokens
  // ===================================================================

  private createStartTagToken() {
    const position = this.posTracker.getStartPosition();
    const index = this.posTracker.getStartRange();
    this.currentToken = new StartTagToken();
    this.currentToken.tagName = new TagNameToken("", index, position);

    const opening = this.punctuatorTokens.pop();
    // if (!opening) {
    //   throw new Error("TODO");
    // }
    this.currentToken.opening = opening!;
  }

  private createEndTagToken() {
    const position = this.posTracker.getStartPosition();
    const index = this.posTracker.getStartRange();
    this.currentToken = new EndTagToken();
    this.currentToken.tagName = new TagNameToken("", index, position);
    const opening = this.punctuatorTokens.pop();
    // if (!opening) {
    //   throw new Error("TODO :" + this.state);
    // }
    this.currentToken.opening = opening!;
  }

  private createCommentToken(start?: {
    value: string;
    pos: Position;
    index: number;
  }) {
    const position = start?.pos ?? this.posTracker.getStartPosition();
    const index = start?.index ?? this.posTracker.getStartRange();
    this.currentToken = new CommentToken();
    this.currentToken.data = new CharactersToken(
      start?.value ?? "",
      index,
      position
    );

    const opening = this.punctuatorTokens.pop();
    // if (!opening) {
    //   throw new Error("TODO");
    // }
    this.currentToken.opening = opening!;
  }

  private createDoctypeToken(value: string = "") {
    const loc = this.posTracker.getStartPosition();
    const range = this.posTracker.getRange();
    this.currentToken = new DoctypeToken();
    this.currentToken.name = new CharactersToken(value, range[0], loc);
    const opening = this.punctuatorTokens.pop();
    // if (!opening) {
    //   throw new Error("TODO");
    // }
    this.currentToken.opening = opening!;
  }

  private createAttributeToken(nameValue: string) {
    const position = this.posTracker.getStartPosition();
    const index = this.posTracker.getStartRange();
    this.currentAttributeToken = new AttributeToken();
    this.currentAttributeToken.name = new AttrNameToken(
      nameValue,
      index,
      position
    );
  }

  // ===================================================================
  // Emit tokens
  // ===================================================================
  private emitCurrentToken(): void {
    this.emitCurrentCharacterToken();
    const token = this.currentToken;
    if (
      token?.type === HtmlTokenType.StartTag ||
      token?.type === HtmlTokenType.EndTag ||
      token?.type === HtmlTokenType.Doctype ||
      token?.type === HtmlTokenType.Comment
    ) {
      const closing = this.punctuatorTokens.pop();
      // if (!closing) {
      //   throw new Error("TODO:" + this.state);
      // }
      token.closing = closing!;
    }
    this.currentToken = null;
    this.tokens.push(token!);
  }

  private emitEofToken() {
    this.currentToken = new EofToken();
    this.emitCurrentToken();
  }

  private emitCodePoint(codePoint: number): void {
    let type = AtomTokenType.Characters;
    if (utils.isWhitespace(codePoint)) {
      type = AtomTokenType.WhiteSpaces;
    } else if (codePoint === CODE_POINTS.NULL) {
      type = AtomTokenType.NullCharacter;
    }
    this.appendCharToCurrentCharacterToken(type, utils.toCharacter(codePoint));
  }

  private emitReplacementCharacter() {
    this.appendCharToCurrentCharacterToken(
      AtomTokenType.Characters,
      REPLACEMENT_CHARACTER
    );
  }

  private pushToPunctuatorTokens(char: string) {
    const pos = this.posTracker.getStartPosition();
    const index = this.posTracker.getStartRange();
    this.punctuatorTokens.push(new PunctuatorToken(char, index, pos));
  }

  // ===================================================================
  // Append character
  // ===================================================================

  private appendCharToCurrentTagTokenName(char: string) {
    const tagToken = this.currentToken as StartTagToken | EndTagToken;
    if (!tagToken.tagName.value.length) {
      tagToken.tagName.loc = this.posTracker.getLocation();
      tagToken.tagName.range = this.posTracker.getRange();
    }
    tagToken.tagName.value += char;
    tagToken.tagName.loc.end = this.posTracker.getEndPosition();
    const endRange = this.posTracker.getEndRange();
    tagToken.tagName.range[1] = endRange;
    tagToken.tagName.end = endRange;
  }

  private appendCharToCurrentAttributeTokenName(char: string) {
    const attrToken = this.currentAttributeToken as AttributeToken;
    if (!attrToken.name.value.length) {
      attrToken.name.loc = this.posTracker.getLocation();
      attrToken.name.range = this.posTracker.getRange();
    }
    attrToken.name.value += char;
    attrToken.name.loc.end = this.posTracker.getEndPosition();
    const endRange = this.posTracker.getEndRange();
    attrToken.name.range[1] = endRange;
    attrToken.name.end = endRange;
  }

  private appendValueToCurrentAttributeToken(value: string) {
    if (!this.currentAttributeToken!.value) {
      const position = this.posTracker.getStartPosition();
      const index = this.posTracker.getStartRange();
      this.currentAttributeToken!.value = new AttrValueToken(
        "",
        index,
        position
      );
    }

    this.currentAttributeToken!.value.value += value;
    this.currentAttributeToken!.value.loc.end =
      this.posTracker.getEndPosition();

    const endRange = this.posTracker.getEndRange();
    this.currentAttributeToken!.value.range[1] = endRange;
    this.currentAttributeToken!.value.end = endRange;
  }

  private appendToLastPunctuatorTokens(char: string) {
    const pos = this.posTracker.getStartPosition();
    const index = this.posTracker.getStartRange();
    const last = this.punctuatorTokens[this.punctuatorTokens.length - 1];
    if (last) {
      last.value += char;
      last.range[1] = last.range[0] + last.value.length;
      last.loc.end = {
        line: pos.line,
        column: pos.column + 1,
      };
      last.end = last.range[1];
    } else {
      this.punctuatorTokens.push(new PunctuatorToken(char, index, pos));
    }
  }

  private appendCharToCurrentCommentTokenData(char: string) {
    if (!this.currentToken) {
      this.createCommentToken();
    }
    const commentToken = this.currentToken as CommentToken;
    if (!commentToken.data.value.length) {
      commentToken.data.loc = this.posTracker.getLocation();
      const range = this.posTracker.getRange();
      commentToken.data.range = this.posTracker.getRange();
      commentToken.data.start = range[0];
      commentToken.data.end = range[1];
    }
    commentToken.data.value += char;
    const range = this.posTracker.getRange();
    commentToken.data.loc.end = this.posTracker.getEndPosition();
    commentToken.data.range[1] = range[1];
    commentToken.data.end = range[1];
  }

  private appendCharToDoctypeTokenName(char: string) {
    const end = this.posTracker.getEndPosition();
    const doctypeToken = this.currentToken as DoctypeToken;
    doctypeToken.name.value += char;
    doctypeToken.name.loc.end = end;
    const endRange = this.posTracker.getEndRange();
    doctypeToken.name.range[1] = endRange;
    doctypeToken.name.end = endRange;
  }

  private appendCharToDoctypePublicId(char: string) {
    const doctypeToken = this.currentToken as DoctypeToken;
    const loc = this.posTracker.getLocation();
    const range = this.posTracker.getRange();
    if (!doctypeToken.publicId) {
      doctypeToken.publicId = new CharactersToken("", range[0], loc.start);
    }
    doctypeToken.publicId.value += char;
    doctypeToken.publicId.range[1] = range[1];
    doctypeToken.publicId.end = range[1];
    doctypeToken.publicId.loc.end = loc.end;
  }

  private appendCharToDoctypeSystemId(char: string) {
    const doctypeToken = this.currentToken as DoctypeToken;
    const loc = this.posTracker.getLocation();
    const range = this.posTracker.getRange();
    if (!doctypeToken.systemId) {
      doctypeToken.systemId = new CharactersToken("", range[0], loc.start);
    }
    doctypeToken.systemId.value += char;
    doctypeToken.systemId.range[1] = range[1];
    doctypeToken.systemId.end = range[1];
    doctypeToken.systemId.loc.end = loc.end;
  }

  private appendCharToCurrentCharacterToken(
    type: CharacterLikeToken["value"]["type"],
    char: string
  ) {
    if (
      this.currentCharacterData &&
      this.currentCharacterData.value?.type !== type
    ) {
      this.emitCurrentCharacterToken();
    }
    if (this.currentCharacterData?.value) {
      this.currentCharacterData.value.value += char;

      const endRange = this.posTracker.getEndRange();
      this.currentCharacterData.value.range[1] = endRange;
      this.currentCharacterData.value.end = endRange;

      this.currentCharacterData.value.loc.end =
        this.posTracker.getEndPosition();
    } else {
      this.currentCharacterData = new CharacterLikeToken();
      const startRange = this.posTracker.getStartRange();
      const pos = this.posTracker.getStartPosition();
      switch (type) {
        case AtomTokenType.WhiteSpaces:
          this.currentCharacterData.value = new WhiteSpacesToken(
            char,
            startRange,
            pos
          );
          break;
        case AtomTokenType.NullCharacter:
          this.currentCharacterData.value = new NullCharacterToken(
            char,
            startRange,
            pos
          );
          break;
        case AtomTokenType.Characters:
          this.currentCharacterData.value = new CharactersToken(
            char,
            startRange,
            pos
          );
          break;
      }
    }
  }

  private emitCurrentCharacterToken() {
    if (this.currentCharacterData) {
      this.tokens.push(this.currentCharacterData);
      this.currentCharacterData = null;
    }
  }

  private consumeSequenceIfMatch(
    pattern: number[],
    startCodePoint: number,
    caseSensitive: boolean,
    onMatch?: (pattern: number[], loc: { pos: Position; index: number }) => void
  ) {
    let consumedCount = 0;
    let isMatch = true;
    const patternLength = pattern.length;
    let patternPos = 0;
    let cp = startCodePoint;
    let patternCp: number | string;

    const pos = this.posTracker.getStartPosition();
    const index = this.posTracker.getStartRange();
    for (; patternPos < patternLength; patternPos++) {
      if (patternPos > 0) {
        cp = this.consume();
        consumedCount++;
      }

      if (cp === CODE_POINTS.EOF) {
        isMatch = false;
        break;
      }

      patternCp = pattern[patternPos];

      if (
        cp !== patternCp &&
        (caseSensitive || cp !== utils.toAsciiLowerCodePoint(patternCp))
      ) {
        isMatch = false;
        break;
      }
    }
    if (!isMatch) {
      while (consumedCount--) {
        this.unconsume();
      }
    }
    if (isMatch && onMatch) {
      onMatch(pattern, { pos, index });
    }

    return isMatch;
  }

  private isCharacterReferenceInAttribute(): boolean {
    return (
      this.returnState === TokenizerState.AttributeValueDoubleQuotedState ||
      this.returnState === TokenizerState.AttributeValueSingleQuotedState ||
      this.returnState === TokenizerState.AttributeValueUnquotedState
    );
  }

  private flushCodePointConsumedAsCharacterReference(codePoint: number) {
    if (this.isCharacterReferenceInAttribute()) {
      this.appendValueToCurrentAttributeToken(String.fromCodePoint(codePoint));
    } else {
      this.emitCodePoint(codePoint);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#data-state
   */
  private [TokenizerState.DataState](codePoint: number) {
    if (codePoint === CODE_POINTS.AMPERSAND) {
      this.setReturnState(TokenizerState.DataState);
      this.switchStateTo(TokenizerState.CharacterReferenceState);
    } else if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.pushToPunctuatorTokens("<");
      this.switchStateTo(TokenizerState.TagOpenState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.emitCodePoint(codePoint);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.emitEofToken();
    } else {
      this.emitCodePoint(codePoint);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#rcdata-state
   */
  private [TokenizerState.RCDATAState](codePoint: number) {
    if (codePoint === CODE_POINTS.AMPERSAND) {
      this.setReturnState(TokenizerState.RCDATAState);
      this.switchStateTo(TokenizerState.CharacterReferenceState);
    } else if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.switchStateTo(TokenizerState.RCDATALessThanSignState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.emitReplacementCharacter();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.emitEofToken();
    } else {
      this.emitCodePoint(codePoint);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#rawtext-state
   */
  private [TokenizerState.RawTextState](codePoint: number) {
    if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.switchStateTo(TokenizerState.RawTextLessThanSignState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.emitReplacementCharacter();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.emitEofToken();
    } else {
      this.emitCodePoint(codePoint);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-state
   */
  private [TokenizerState.ScriptDataState](codePoint: number) {
    if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.switchStateTo(TokenizerState.ScriptDataLessThanSignState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.emitReplacementCharacter();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.emitEofToken();
    } else {
      this.emitCodePoint(codePoint);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#plaintext-state
   */
  private [TokenizerState.PlainTextState](codePoint: number) {
    if (codePoint === CODE_POINTS.NULL) {
      this.emitReplacementCharacter();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.emitEofToken();
    } else {
      this.emitCodePoint(codePoint);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
   */
  private [TokenizerState.TagOpenState](codePoint: number) {
    if (codePoint === CODE_POINTS.EXCLAMATION_MARK) {
      this.appendToLastPunctuatorTokens("!");
      this.switchStateTo(TokenizerState.MarkupDeclarationOpenState);
    } else if (codePoint === CODE_POINTS.SOLIDUS) {
      this.appendToLastPunctuatorTokens("/");
      this.switchStateTo(TokenizerState.EndTagOpenState);
    } else if (utils.isAsciiAlpha(codePoint)) {
      this.createStartTagToken();
      this.reconsumeInState(TokenizerState.TagNameState);
    } else if (codePoint === CODE_POINTS.QUESTION_MARK) {
      this.parseError(TokenizingErrors.UnexpectedQuestionMarkInsteadOfTagName);
      this.createCommentToken();
      this.reconsumeInState(TokenizerState.BogusCommentState);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofBeforeTagName);
      this.emitEofToken();
    } else {
      const token = this.punctuatorTokens.pop();
      if (token) {
        this.appendCharToCurrentCharacterToken(
          AtomTokenType.Characters,
          token.value
        );
      }
      this.parseError(TokenizingErrors.InvalidFirstCharacterOfTagName);
      this.reconsumeInState(TokenizerState.DataState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#end-tag-open-state
   */
  private [TokenizerState.EndTagOpenState](codePoint: number) {
    if (utils.isAsciiAlpha(codePoint)) {
      this.createEndTagToken();
      this.reconsumeInState(TokenizerState.TagNameState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.parseError(TokenizingErrors.MissingEndTagName);
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofBeforeTagName);
      this.emitEofToken();
    } else {
      this.createCommentToken();
      this.reconsumeInState(TokenizerState.BogusCommentState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#tag-name-state
   */
  private [TokenizerState.TagNameState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      this.switchStateTo(TokenizerState.BeforeAttributeNameState);
    } else if (codePoint === CODE_POINTS.SOLIDUS) {
      this.pushToPunctuatorTokens("/");
      this.switchStateTo(TokenizerState.SelfClosingStartTagState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.pushToPunctuatorTokens(">");
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (utils.isAsciiUpperAlpha(codePoint)) {
      this.appendCharToCurrentTagTokenName(
        utils.toAsciiLowerCharacter(codePoint)
      );
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      (this.currentToken as StartTagToken).tagName.value +=
        REPLACEMENT_CHARACTER;
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInTag);
      this.emitEofToken();
    } else {
      this.appendCharToCurrentTagTokenName(utils.toCharacter(codePoint));
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#rcdata-less-than-sign-state
   */
  private [TokenizerState.RCDATALessThanSignState](codePoint: number) {
    if (codePoint === CODE_POINTS.SOLIDUS) {
      this.temporaryBuffer = [];
      this.switchStateTo(TokenizerState.RCDATAEndTagOpenState);
    } else {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "<");
      this.reconsumeInState(TokenizerState.RCDATAState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#rcdata-end-tag-open-state
   */
  private [TokenizerState.RCDATAEndTagOpenState](codePoint: number) {
    if (utils.isAsciiAlpha(codePoint)) {
      this.createEndTagToken();
      this.reconsumeInState(TokenizerState.RCDATAEndTagNameState);
    } else {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "</");
      this.reconsumeInState(TokenizerState.RCDATAState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#rcdata-end-tag-name-state
   */
  private [TokenizerState.RCDATAEndTagNameState](codePoint: number) {
    if (codePoint === CODE_POINTS.SOLIDUS) {
    } else if (utils.isAsciiUpperAlpha(codePoint)) {
      this.appendCharToCurrentTagTokenName(
        utils.toAsciiLowerCharacter(codePoint)
      );
      this.temporaryBuffer.push(codePoint);
    } else if (utils.isAsciiLowerAlpha(codePoint)) {
      this.appendCharToCurrentTagTokenName(utils.toCharacter(codePoint));
      this.temporaryBuffer.push(codePoint);
    } else {
      if (
        this.lastStartTagName ===
        (this.currentToken as StartTagToken).tagName?.value
      ) {
        if (utils.isWhitespace(codePoint)) {
          this.switchStateTo(TokenizerState.BeforeAttributeNameState);
          return;
        } else if (codePoint === CODE_POINTS.SOLIDUS) {
          this.switchStateTo(TokenizerState.SelfClosingStartTagState);
          return;
        } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
          this.switchStateTo(TokenizerState.DataState);
          this.emitCurrentToken();
          return;
        }
      }
      // this._emitChars("</");
      // this._emitSeveralCodePoints(this.tempBuff);
      this.reconsumeInState(TokenizerState.RCDATAState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#rawtext-less-than-sign-state
   */
  private [TokenizerState.RawTextLessThanSignState](codePoint: number) {
    if (codePoint === CODE_POINTS.SOLIDUS) {
      this.temporaryBuffer = [];
      this.switchStateTo(TokenizerState.RawTextEndTagOpenState);
    } else {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "<");
      this.reconsumeInState(TokenizerState.RawTextState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#rawtext-end-tag-open-state
   */
  private [TokenizerState.RawTextEndTagOpenState](codePoint: number) {
    if (utils.isAsciiAlpha(codePoint)) {
      this.createEndTagToken();
      this.reconsumeInState(TokenizerState.RawTextEndTagNameState);
    } else {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "</");
      this.reconsumeInState(TokenizerState.RawTextState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#rawtext-end-tag-name-state
   */
  private [TokenizerState.RawTextEndTagNameState](codePoint: number) {
    if (utils.isAsciiUpperAlpha(codePoint)) {
      this.appendCharToCurrentTagTokenName(
        utils.toAsciiLowerCharacter(codePoint)
      );
      this.temporaryBuffer.push(codePoint);
    } else if (utils.isAsciiLowerAlpha(codePoint)) {
      this.appendCharToCurrentTagTokenName(utils.toCharacter(codePoint));
      this.temporaryBuffer.push(codePoint);
    } else {
      if (
        this.lastStartTagName ===
        (this.currentToken as StartTagToken)?.tagName?.value
      ) {
        if (utils.isWhitespace(codePoint)) {
          this.switchStateTo(TokenizerState.BeforeAttributeNameState);
          return;
        } else if (codePoint === CODE_POINTS.SOLIDUS) {
          this.switchStateTo(TokenizerState.SelfClosingStartTagState);
          return;
        } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
          this.emitCurrentToken();
          this.switchStateTo(TokenizerState.DataState);
          return;
        }
        // this._emitChars("</");
        // this._emitSeveralCodePoints(this.tempBuff);
        this.reconsumeInState(TokenizerState.RawTextState);
      }
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-less-than-sign-state
   */
  private [TokenizerState.ScriptDataLessThanSignState](codePoint: number) {
    if (codePoint === CODE_POINTS.SOLIDUS) {
      this.temporaryBuffer = [];
      this.switchStateTo(TokenizerState.ScriptDataEndTagOpenState);
    } else if (codePoint === CODE_POINTS.EXCLAMATION_MARK) {
      this.switchStateTo(TokenizerState.ScriptDataEscapeStartState);
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "<!");
    } else {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "<");
      this.reconsumeInState(TokenizerState.ScriptDataState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-end-tag-open-state
   */
  private [TokenizerState.ScriptDataEndTagOpenState](codePoint: number) {
    if (utils.isAsciiAlpha(codePoint)) {
      this.createEndTagToken();
      this.reconsumeInState(TokenizerState.ScriptDataEndTagNameState);
    } else {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "</");
      this.reconsumeInState(TokenizerState.ScriptDataState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-end-tag-name-state
   */
  private [TokenizerState.ScriptDataEndTagNameState](codePoint: number) {
    if (utils.isAsciiUpperAlpha(codePoint)) {
      this.appendCharToCurrentTagTokenName(
        utils.toAsciiLowerCharacter(codePoint)
      );
      this.temporaryBuffer.push(codePoint);
    } else if (utils.isAsciiLowerAlpha(codePoint)) {
      this.appendCharToCurrentTagTokenName(utils.toCharacter(codePoint));
      this.temporaryBuffer.push(codePoint);
    } else {
      if (
        this.lastStartTagName ===
        (this.currentToken as StartTagToken).tagName?.value
      ) {
        if (utils.isWhitespace(codePoint)) {
          this.switchStateTo(TokenizerState.BeforeAttributeNameState);
          return;
        } else if (codePoint === CODE_POINTS.SOLIDUS) {
          this.switchStateTo(TokenizerState.SelfClosingStartTagState);
          return;
        } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
          this.emitCurrentToken();
          this.switchStateTo(TokenizerState.DataState);
          return;
        }
      }
      // this._emitChars("</");
      // this._emitSeveralCodePoints(this.tempBuff);
      this.reconsumeInState(TokenizerState.ScriptDataState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-escape-start-state
   */
  private [TokenizerState.ScriptDataEscapeStartState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.switchStateTo(TokenizerState.ScriptDataEscapeStartDashState);
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "-");
    } else {
      this.reconsumeInState(TokenizerState.ScriptDataState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-escape-start-dash-state
   */
  private [TokenizerState.ScriptDataEscapeStartDashState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.switchStateTo(TokenizerState.ScriptDataEscapedDashDashState);
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "-");
    } else {
      this.reconsumeInState(TokenizerState.ScriptDataState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-escaped-state
   */
  private [TokenizerState.ScriptDataEscapedState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.switchStateTo(TokenizerState.ScriptDataEscapedDashState);
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "-");
    } else if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.switchStateTo(TokenizerState.ScriptDataEscapedLessThanSignState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.appendCharToCurrentCharacterToken(
        AtomTokenType.Characters,
        REPLACEMENT_CHARACTER
      );
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInScriptHtmlCommentLikeText);
      this.emitEofToken();
    } else {
      this.emitCodePoint(codePoint);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-escaped-dash-state
   */
  private [TokenizerState.ScriptDataEscapedDashState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.switchStateTo(TokenizerState.ScriptDataEscapedDashDashState);
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "-");
    } else if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.switchStateTo(TokenizerState.ScriptDataEscapedLessThanSignState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.appendCharToCurrentCharacterToken(
        AtomTokenType.Characters,
        REPLACEMENT_CHARACTER
      );
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInScriptHtmlCommentLikeText);
      this.emitEofToken();
    } else {
      this.switchStateTo(TokenizerState.ScriptDataEscapedState);
      this.emitCodePoint(codePoint);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-escaped-dash-dash-state
   */
  private [TokenizerState.ScriptDataEscapedDashDashState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "-");
    } else if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.switchStateTo(TokenizerState.ScriptDataEscapedLessThanSignState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.switchStateTo(TokenizerState.ScriptDataState);
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, ">");
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.switchStateTo(TokenizerState.ScriptDataEscapedState);
      this.appendCharToCurrentCharacterToken(
        AtomTokenType.Characters,
        REPLACEMENT_CHARACTER
      );
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInScriptHtmlCommentLikeText);
      this.emitEofToken();
    } else {
      this.switchStateTo(TokenizerState.ScriptDataEscapedState);
      this.emitCodePoint(codePoint);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-escaped-less-than-sign-state
   */
  private [TokenizerState.ScriptDataEscapedLessThanSignState](
    codePoint: number
  ) {
    if (codePoint === CODE_POINTS.SOLIDUS) {
      this.temporaryBuffer = [];
      this.switchStateTo(TokenizerState.ScriptDataEscapedEndTagOpenState);
    } else if (utils.isAsciiAlpha(codePoint)) {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "<");
      this.reconsumeInState(TokenizerState.ScriptDataDoubleEscapeStartState);
    } else {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "<");
      this.reconsumeInState(TokenizerState.ScriptDataEscapedState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-escaped-end-tag-open-state
   */
  private [TokenizerState.ScriptDataEscapedEndTagOpenState](codePoint: number) {
    if (utils.isAsciiAlpha(codePoint)) {
      this.createEndTagToken();
      this.reconsumeInState(TokenizerState.ScriptDataEscapedEndTagNameState);
    } else {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "</");
      this.reconsumeInState(TokenizerState.ScriptDataEscapedState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-escaped-end-tag-name-state
   */
  private [TokenizerState.ScriptDataEscapedEndTagNameState](codePoint: number) {
    if (utils.isAsciiUpperAlpha(codePoint)) {
      this.appendCharToCurrentTagTokenName(
        utils.toAsciiLowerCharacter(codePoint)
      );
      this.temporaryBuffer.push(codePoint);
    } else if (utils.isAsciiLowerAlpha(codePoint)) {
      this.appendCharToCurrentTagTokenName(utils.toCharacter(codePoint));
      this.temporaryBuffer.push(codePoint);
    } else {
      if (
        this.lastStartTagName ===
        (this.currentToken as StartTagToken)?.tagName?.value
      ) {
        if (utils.isWhitespace(codePoint)) {
          this.switchStateTo(TokenizerState.BeforeAttributeNameState);
          return;
        }
        if (codePoint === CODE_POINTS.SOLIDUS) {
          this.switchStateTo(TokenizerState.SelfClosingStartTagState);
          return;
        }
        if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
          this.emitCurrentToken();
          this.switchStateTo(TokenizerState.DataState);
          return;
        }
      }

      // this._emitChars("</");
      // this._emitSeveralCodePoints(this.tempBuff);
      this.reconsumeInState(TokenizerState.ScriptDataEscapedState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-double-escape-start-state
   */
  private [TokenizerState.ScriptDataDoubleEscapeStartState](codePoint: number) {
    if (
      utils.isWhitespace(codePoint) ||
      codePoint === CODE_POINTS.SOLIDUS ||
      codePoint === CODE_POINTS.GREATER_THAN_SIGN
    ) {
      //    this.state = this._isTempBufferEqualToScriptString()
      //  ? SCRIPT_DATA_DOUBLE_ESCAPED_STATE
      // : SCRIPT_DATA_ESCAPED_STATE;
    } else if (utils.isAsciiUpperAlpha(codePoint)) {
      this.temporaryBuffer.push(utils.toAsciiLowerCharacter(codePoint));
      this.emitCodePoint(codePoint);
    } else if (utils.isAsciiLowerAlpha(codePoint)) {
      this.temporaryBuffer.push(codePoint);
      this.emitCodePoint(codePoint);
    } else {
      this.reconsumeInState(TokenizerState.ScriptDataEscapedState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-double-escaped-state
   */
  private [TokenizerState.ScriptDataDoubleEscapedState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.switchStateTo(TokenizerState.ScriptDataDoubleEscapedDashState);
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "-");
    } else if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.switchStateTo(
        TokenizerState.ScriptDataDoubleEscapedLessThanSignState
      );
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "<");
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.appendCharToCurrentCharacterToken(
        AtomTokenType.Characters,
        REPLACEMENT_CHARACTER
      );
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInScriptHtmlCommentLikeText);
      this.emitEofToken();
    } else {
      this.emitCodePoint(codePoint);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-double-escaped-dash-state
   */
  private [TokenizerState.ScriptDataDoubleEscapedDashState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.switchStateTo(TokenizerState.ScriptDataDoubleEscapedDashDashState);
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "-");
    } else if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.switchStateTo(
        TokenizerState.ScriptDataDoubleEscapedLessThanSignState
      );
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "<");
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.switchStateTo(TokenizerState.ScriptDataDoubleEscapedState);
      this.appendCharToCurrentCharacterToken(
        AtomTokenType.Characters,
        REPLACEMENT_CHARACTER
      );
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInScriptHtmlCommentLikeText);
      this.emitEofToken();
    } else {
      this.switchStateTo(TokenizerState.ScriptDataDoubleEscapedState);
      this.emitCodePoint(codePoint);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-double-escaped-dash-dash-state
   */
  private [TokenizerState.ScriptDataDoubleEscapedDashDashState](
    codePoint: number
  ) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "-");
    } else if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.switchStateTo(
        TokenizerState.ScriptDataDoubleEscapedLessThanSignState
      );
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "<");
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.switchStateTo(TokenizerState.ScriptDataDoubleEscapedState);
      this.appendCharToCurrentCharacterToken(
        AtomTokenType.Characters,
        REPLACEMENT_CHARACTER
      );
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInScriptHtmlCommentLikeText);
      this.emitEofToken();
    } else {
      this.switchStateTo(TokenizerState.ScriptDataDoubleEscapedState);
      this.emitCodePoint(codePoint);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-double-escaped-less-than-sign-state
   */
  private [TokenizerState.ScriptDataDoubleEscapedLessThanSignState](
    codePoint: number
  ) {
    if (codePoint === CODE_POINTS.SOLIDUS) {
      this.temporaryBuffer = [];
      this.switchStateTo(TokenizerState.ScriptDataDoubleEscapeEndState);
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "/");
    } else {
      this.reconsumeInState(TokenizerState.ScriptDataDoubleEscapedState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#script-data-double-escape-end-state
   */
  private [TokenizerState.ScriptDataDoubleEscapeEndState](codePoint: number) {
    if (
      utils.isWhitespace(codePoint) ||
      codePoint === CODE_POINTS.SOLIDUS ||
      codePoint === CODE_POINTS.GREATER_THAN_SIGN
    ) {
      // this.state = this._isTempBufferEqualToScriptString()
      //   ? SCRIPT_DATA_ESCAPED_STATE
      //   : SCRIPT_DATA_DOUBLE_ESCAPED_STATE;

      this.emitCodePoint(codePoint);
    } else if (utils.isAsciiUpperAlpha(codePoint)) {
      this.temporaryBuffer.push(utils.toAsciiLowerCharacter(codePoint));
      this.emitCodePoint(codePoint);
    } else if (utils.isAsciiLowerAlpha(codePoint)) {
      this.temporaryBuffer.push(codePoint);
      this.emitCodePoint(codePoint);
    } else {
      this.reconsumeInState(TokenizerState.ScriptDataDoubleEscapedState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#before-attribute-name-state
   */
  private [TokenizerState.BeforeAttributeNameState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      return;
    } else if (
      codePoint === CODE_POINTS.SOLIDUS ||
      codePoint === CODE_POINTS.GREATER_THAN_SIGN ||
      codePoint === CODE_POINTS.EOF
    ) {
      this.reconsumeInState(TokenizerState.AfterAttributeNameState);
    } else if (codePoint === CODE_POINTS.EQUALS_SIGN) {
      this.parseError(TokenizingErrors.UnexpectedEqualsSignBeforeAttributeName);
      this.createAttributeToken("=");
      this.switchStateTo(TokenizerState.AttributeNameState);
    } else {
      this.createAttributeToken("");
      this.reconsumeInState(TokenizerState.AttributeNameState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#attribute-name-state
   */
  private [TokenizerState.AttributeNameState](codePoint: number) {
    if (
      utils.isWhitespace(codePoint) ||
      codePoint === CODE_POINTS.SOLIDUS ||
      codePoint === CODE_POINTS.GREATER_THAN_SIGN ||
      codePoint === CODE_POINTS.EOF
    ) {
      this.leaveAttributeName(TokenizerState.AfterAttributeNameState);
      this.unconsume();
    } else if (codePoint === CODE_POINTS.EQUALS_SIGN) {
      const position = this.posTracker.getStartPosition();
      const index = this.posTracker.getStartRange();
      this.currentAttributeToken!.between = new PunctuatorToken(
        "=",
        index,
        position
      );
      this.leaveAttributeName(TokenizerState.BeforeAttributeValueState);
    } else if (utils.isAsciiUpperAlpha(codePoint)) {
      this.currentAttributeToken!.name!.value +=
        utils.toAsciiLowerCharacter(codePoint);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedCharacterInAttributeName);
      this.currentAttributeToken!.name!.value += REPLACEMENT_CHARACTER;
    } else if (
      codePoint === CODE_POINTS.QUOTATION_MARK ||
      codePoint === CODE_POINTS.APOSTROPHE ||
      codePoint === CODE_POINTS.LESS_THAN_SIGN
    ) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.currentAttributeToken!.name!.value += utils.toCharacter(codePoint);
    } else {
      this.appendCharToCurrentAttributeTokenName(utils.toCharacter(codePoint));
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#after-attribute-name-state
   */
  private [TokenizerState.AfterAttributeNameState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      return;
    } else if (codePoint === CODE_POINTS.SOLIDUS) {
      this.pushToPunctuatorTokens("/");
      this.switchStateTo(TokenizerState.SelfClosingStartTagState);
    } else if (codePoint === CODE_POINTS.EQUALS_SIGN) {
      this.switchStateTo(TokenizerState.BeforeAttributeValueState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.switchStateTo(TokenizerState.DataState);
      this.pushToPunctuatorTokens(">");
      this.emitCurrentToken();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInTag);
      this.emitEofToken();
    } else {
      this.createAttributeToken("");
      this.reconsumeInState(TokenizerState.AttributeNameState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#before-attribute-value-state
   */
  private [TokenizerState.BeforeAttributeValueState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      return;
    } else if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      this.appendValueToCurrentAttributeToken('"');
      this.switchStateTo(TokenizerState.AttributeValueDoubleQuotedState);
    } else if (codePoint === CODE_POINTS.APOSTROPHE) {
      this.appendValueToCurrentAttributeToken("'");
      this.switchStateTo(TokenizerState.AttributeValueSingleQuotedState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.parseError(TokenizingErrors.MissingAttributeValue);
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
    } else {
      this.reconsumeInState(TokenizerState.AttributeValueUnquotedState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#attribute-value-(double-quoted)-state
   */
  private [TokenizerState.AttributeValueDoubleQuotedState](codePoint: number) {
    if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      this.appendValueToCurrentAttributeToken('"');
      this.switchStateTo(TokenizerState.AfterAttributeValueQuotedState);
    } else if (codePoint === CODE_POINTS.AMPERSAND) {
      this.setReturnState(TokenizerState.AttributeValueDoubleQuotedState);
      this.switchStateTo(TokenizerState.CharacterReferenceState);
    } else if (codePoint === CODE_POINTS.NULL) {
      // TODO: error
      this.appendValueToCurrentAttributeToken(REPLACEMENT_CHARACTER);
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitEofToken();
    } else {
      this.appendValueToCurrentAttributeToken(utils.toCharacter(codePoint));
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#attribute-value-(single-quoted)-state
   */
  private [TokenizerState.AttributeValueSingleQuotedState](codePoint: number) {
    if (codePoint === CODE_POINTS.APOSTROPHE) {
      this.appendValueToCurrentAttributeToken("'");
      this.switchStateTo(TokenizerState.AfterAttributeValueQuotedState);
    } else if (codePoint === CODE_POINTS.AMPERSAND) {
      this.setReturnState(TokenizerState.AttributeValueSingleQuotedState);
      this.switchStateTo(TokenizerState.CharacterReferenceState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.appendValueToCurrentAttributeToken(REPLACEMENT_CHARACTER);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInTag);
      this.emitEofToken();
    } else {
      this.appendValueToCurrentAttributeToken(utils.toCharacter(codePoint));
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#attribute-value-(unquoted)-state
   */
  private [TokenizerState.AttributeValueUnquotedState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      this.switchStateTo(TokenizerState.BeforeAttributeNameState);
    } else if (codePoint === CODE_POINTS.AMPERSAND) {
      this.setReturnState(TokenizerState.AttributeValueUnquotedState);
      this.switchStateTo(TokenizerState.CharacterReferenceState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.pushToPunctuatorTokens(">");
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.appendValueToCurrentAttributeToken(REPLACEMENT_CHARACTER);
    } else if (
      codePoint === CODE_POINTS.QUOTATION_MARK ||
      codePoint === CODE_POINTS.APOSTROPHE ||
      codePoint === CODE_POINTS.LESS_THAN_SIGN ||
      codePoint === CODE_POINTS.EQUALS_SIGN ||
      codePoint === CODE_POINTS.GRAVE_ACCENT
    ) {
      this.parseError(
        TokenizingErrors.UnexpectedCharacterInUnquotedAttributeValue
      );
      this.appendValueToCurrentAttributeToken(utils.toCharacter(codePoint));
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInTag);
      this.emitEofToken();
    } else {
      this.appendValueToCurrentAttributeToken(utils.toCharacter(codePoint));
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#after-attribute-value-(quoted)-state
   */
  private [TokenizerState.AfterAttributeValueQuotedState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      this.switchStateTo(TokenizerState.BeforeAttributeNameState);
    } else if (codePoint === CODE_POINTS.SOLIDUS) {
      this.pushToPunctuatorTokens("/");
      this.switchStateTo(TokenizerState.SelfClosingStartTagState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.switchStateTo(TokenizerState.DataState);
      this.pushToPunctuatorTokens(">");
      this.emitCurrentToken();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInTag);
      this.emitEofToken();
    } else {
      this.parseError(TokenizingErrors.MissingWhitespaceBetweenAttributes);
      this.reconsumeInState(TokenizerState.BeforeAttributeNameState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#self-closing-start-tag-state
   */
  private [TokenizerState.SelfClosingStartTagState](codePoint: number) {
    if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      (this.currentToken as StartTagToken).selfClosing = true;
      this.appendToLastPunctuatorTokens(">");
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInTag);
      this.emitEofToken();
    } else {
      this.parseError(TokenizingErrors.UnexpectedSolidusInTag);
      this.reconsumeInState(TokenizerState.BeforeAttributeNameState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#bogus-comment-state
   */
  private [TokenizerState.BogusCommentState](codePoint: number) {
    if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.appendToLastPunctuatorTokens(">");
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.emitCurrentToken();
      this.emitEofToken();
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.appendCharToCurrentCommentTokenData(REPLACEMENT_CHARACTER);
    } else {
      this.appendCharToCurrentCommentTokenData(utils.toCharacter(codePoint));
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#markup-declaration-open-state
   */
  private [TokenizerState.MarkupDeclarationOpenState](codePoint: number) {
    if (
      this.consumeSequenceIfMatch(
        CODE_POINT_SEQUENCES.DASH_DASH_STRING,
        codePoint,
        true,
        (pattern) => {
          this.appendToLastPunctuatorTokens(
            pattern.map((p) => utils.toCharacter(p)).join("")
          );
        }
      )
    ) {
      this.createCommentToken();
      this.switchStateTo(TokenizerState.CommentStartState);
    } else if (
      this.consumeSequenceIfMatch(
        CODE_POINT_SEQUENCES.DOCTYPE_STRING,
        codePoint,
        false,
        (pattern) => {
          this.appendToLastPunctuatorTokens(
            pattern.map((p) => utils.toCharacter(p)).join("")
          );
        }
      )
    ) {
      this.switchStateTo(TokenizerState.DoctypeState);
    } else if (
      this.consumeSequenceIfMatch(
        CODE_POINT_SEQUENCES.CDATA_START_STRING,
        codePoint,
        true,
        (_, { pos, index }) => {
          this.createCommentToken({ pos, index, value: "[CDATA[" });
        }
      )
    ) {
      this.switchStateTo(TokenizerState.BogusCommentState);
    } else {
      this.switchStateTo(TokenizerState.BogusCommentState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#comment-start-state
   */
  private [TokenizerState.CommentStartState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.pushToPunctuatorTokens("-");
      this.switchStateTo(TokenizerState.CommentStartDashState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.parseError(TokenizingErrors.AbruptClosingOfEmptyComment);
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
    } else {
      this.reconsumeInState(TokenizerState.CommentState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#comment-start-dash-state
   */
  private [TokenizerState.CommentStartDashState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.appendToLastPunctuatorTokens("-");
      this.switchStateTo(TokenizerState.CommentEndState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.parseError(TokenizingErrors.AbruptClosingOfEmptyComment);
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInComment);
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.appendCharToCurrentCommentTokenData("-");
      this.reconsumeInState(TokenizerState.CommentState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#comment-state
   */
  private [TokenizerState.CommentState](codePoint: number) {
    if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.appendCharToCurrentCommentTokenData("<");
      this.switchStateTo(TokenizerState.CommentLessThanSignState);
    } else if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.pushToPunctuatorTokens("-");
      this.switchStateTo(TokenizerState.CommentEndDashState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      (this.currentToken as CommentToken).data.value +=
        CODE_POINTS.REPLACEMENT_CHARACTER;
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInComment);
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.appendCharToCurrentCommentTokenData(utils.toCharacter(codePoint));
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#comment-less-than-sign-state
   */
  private [TokenizerState.CommentLessThanSignState](codePoint: number) {
    if (codePoint === CODE_POINTS.EXCLAMATION_MARK) {
      this.appendCharToCurrentCommentTokenData("!");
      this.switchStateTo(TokenizerState.CommentLessThanSignBangState);
    } else if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.appendCharToCurrentCommentTokenData("<");
    } else {
      this.reconsumeInState(TokenizerState.CommentState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#comment-less-than-sign-bang-state
   */
  private [TokenizerState.CommentLessThanSignBangState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.switchStateTo(TokenizerState.CommentLessThanSignBangDashDashState);
    } else {
      this.reconsumeInState(TokenizerState.CommentEndDashState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#comment-less-than-sign-bang-dash-state
   */
  private [TokenizerState.CommentLessThanSignBangDashState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.switchStateTo(TokenizerState.CommentLessThanSignBangDashDashState);
    } else {
      this.reconsumeInState(TokenizerState.CommentEndDashState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#comment-less-than-sign-bang-dash-dash-state
   */
  private [TokenizerState.CommentLessThanSignBangDashDashState](
    codePoint: number
  ) {
    if (
      codePoint === CODE_POINTS.GREATER_THAN_SIGN ||
      codePoint === CODE_POINTS.EOF
    ) {
      this.reconsumeInState(TokenizerState.CommentEndState);
    } else {
      this.parseError(TokenizingErrors.NestedComment);
      this.reconsumeInState(TokenizerState.CommentEndState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#comment-end-dash-state
   */
  private [TokenizerState.CommentEndDashState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.appendToLastPunctuatorTokens("-");
      this.switchStateTo(TokenizerState.CommentEndState);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInComment);
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.appendCharToCurrentCommentTokenData("-");
      this.reconsumeInState(TokenizerState.CommentState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#comment-end-state
   */
  private [TokenizerState.CommentEndState](codePoint: number) {
    if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.appendToLastPunctuatorTokens(">");
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
    } else if (codePoint === CODE_POINTS.EXCLAMATION_MARK) {
      this.switchStateTo(TokenizerState.CommentEndBangState);
    } else if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.appendCharToCurrentCommentTokenData("-");
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInComment);
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      (this.currentToken as CommentToken).data.value += "--";
      this.reconsumeInState(TokenizerState.CommentState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#comment-end-bang-state
   */
  private [TokenizerState.CommentEndBangState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      (this.currentToken as CommentToken).data.value += "--!";
      this.switchStateTo(TokenizerState.CommentEndDashState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.parseError(TokenizingErrors.IncorrectlyClosedComment);
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
      this.emitEofToken();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInComment);
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      (this.currentToken as CommentToken).data.value += "--!";
      this.reconsumeInState(TokenizerState.CommentState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#doctype-state
   */
  private [TokenizerState.DoctypeState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      this.switchStateTo(TokenizerState.BeforeDoctypeNameState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.reconsumeInState(TokenizerState.BeforeDoctypeNameState);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInDoctype);
      this.createDoctypeToken("");
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.parseError(TokenizingErrors.MissingWhitespaceBeforeDoctypeName);
      this.reconsumeInState(TokenizerState.BeforeDoctypeNameState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#before-doctype-name-state
   */
  private [TokenizerState.BeforeDoctypeNameState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      return;
    } else if (utils.isAsciiUpperAlpha(codePoint)) {
      this.createDoctypeToken(utils.toAsciiLowerCharacter(codePoint));
      this.switchStateTo(TokenizerState.DoctypeNameState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.createDoctypeToken(REPLACEMENT_CHARACTER);
      this.switchStateTo(TokenizerState.DoctypeNameState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.parseError(TokenizingErrors.MissingDoctypeName);
      this.createDoctypeToken("");
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInDoctype);
      this.createDoctypeToken("");
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.createDoctypeToken(utils.toCharacter(codePoint));
      this.switchStateTo(TokenizerState.DoctypeNameState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#before-doctype-name-state
   */
  private [TokenizerState.DoctypeNameState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      this.switchStateTo(TokenizerState.AfterDoctypeNameState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.switchStateTo(TokenizerState.DataState);
      this.pushToPunctuatorTokens(">");
      this.emitCurrentToken();
    } else if (utils.isAsciiUpperAlpha(codePoint)) {
      this.appendCharToDoctypeTokenName(utils.toAsciiLowerCharacter(codePoint));
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      (this.currentToken as DoctypeToken).name.value += REPLACEMENT_CHARACTER;
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInDoctype);
      (this.currentToken as DoctypeToken).forceQuirks = true;
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.appendCharToDoctypeTokenName(utils.toCharacter(codePoint));
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#after-doctype-name-state
   */
  private [TokenizerState.AfterDoctypeNameState](codePoint: number) {
    const pos = this.posTracker.getStartPosition();
    const index = this.posTracker.getStartRange();
    if (utils.isWhitespace(codePoint)) {
      return;
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.pushToPunctuatorTokens(">");
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInDoctype);
      (this.currentToken as DoctypeToken).forceQuirks = true;
      this.emitCurrentToken();
      this.emitEofToken();
    } else if (
      this.consumeSequenceIfMatch(
        CODE_POINT_SEQUENCES.PUBLIC_STRING,
        codePoint,
        false,
        (pattern) => {
          const chars = pattern.map((p) => utils.toCharacter(p)).join("");
          const doctypeToken = this.currentToken as DoctypeToken;
          doctypeToken.publicKeyword = new CharactersToken(chars, index, pos);
          const endPos = this.posTracker.getEndPosition();
          const endRange = this.posTracker.getEndRange();
          doctypeToken.publicKeyword.loc.end = endPos;
          doctypeToken.publicKeyword.range[1] = endRange;
        }
      )
    ) {
      this.switchStateTo(TokenizerState.AfterDoctypePublicKeywordState);
    } else if (
      this.consumeSequenceIfMatch(
        CODE_POINT_SEQUENCES.SYSTEM_STRING,
        codePoint,
        false,
        (pattern) => {
          const chars = pattern.map((p) => utils.toCharacter(p)).join("");
          const doctypeToken = this.currentToken as DoctypeToken;
          doctypeToken.systemKeyword = new CharactersToken(chars, index, pos);
          const endPos = this.posTracker.getEndPosition();
          const endRange = this.posTracker.getEndRange();
          doctypeToken.systemKeyword.loc.end = endPos;
          doctypeToken.systemKeyword.range[1] = endRange;
        }
      )
    ) {
      this.switchStateTo(TokenizerState.AfterDoctypeSystemKeywordState);
    } else {
      this.parseError(
        TokenizingErrors.InvalidCharacterSequenceAfterDoctypeName
      );
      this.reconsumeInState(TokenizerState.BogusDoctypeState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#after-doctype-public-keyword-state
   */
  private [TokenizerState.AfterDoctypePublicKeywordState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      this.switchStateTo(TokenizerState.BeforeDoctypePublicIdentifierState);
    } else if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      this.parseError(
        TokenizingErrors.MissingWhitespaceAfterDoctypePublicKeyword
      );
      this.switchStateTo(
        TokenizerState.DoctypePublicIdentifierDoubleQuotedState
      );
    } else if (codePoint === CODE_POINTS.APOSTROPHE) {
      this.parseError(
        TokenizingErrors.MissingWhitespaceAfterDoctypePublicKeyword
      );
      this.switchStateTo(
        TokenizerState.DoctypePublicIdentifierSingleQuotedState
      );
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.parseError(TokenizingErrors.MissingDoctypePublicIdentifier);
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInDoctype);
      (this.currentToken as DoctypeToken).forceQuirks = true;
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.parseError(
        TokenizingErrors.MissingQuoteBeforeDoctypePublicIdentifier
      );
      (this.currentToken as DoctypeToken).forceQuirks = true;
      this.reconsumeInState(TokenizerState.BogusCommentState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#before-doctype-public-identifier-state
   */
  private [TokenizerState.BeforeDoctypePublicIdentifierState](
    codePoint: number
  ) {
    if (utils.isWhitespace(codePoint)) {
      return;
    } else if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      this.appendCharToDoctypePublicId('"');
      this.switchStateTo(
        TokenizerState.DoctypePublicIdentifierDoubleQuotedState
      );
    } else if (codePoint === CODE_POINTS.APOSTROPHE) {
      this.appendCharToDoctypePublicId("'");
      this.switchStateTo(
        TokenizerState.DoctypePublicIdentifierSingleQuotedState
      );
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.parseError(TokenizingErrors.MissingDoctypePublicIdentifier);
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInDoctype);
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.parseError(
        TokenizingErrors.MissingQuoteBeforeDoctypePublicIdentifier
      );
      this.reconsumeInState(TokenizerState.BogusDoctypeState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#doctype-public-identifier-(double-quoted)-state
   */
  private [TokenizerState.DoctypePublicIdentifierDoubleQuotedState](
    codePoint: number
  ) {
    if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      this.appendCharToDoctypePublicId('"');
      this.switchStateTo(TokenizerState.AfterDoctypePublicIdentifierState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.appendCharToDoctypePublicId(REPLACEMENT_CHARACTER);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.parseError(TokenizingErrors.AbruptDoctypePublicIdentifier);
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
      (this.currentToken as DoctypeToken).forceQuirks = true;
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInDoctype);
      (this.currentToken as DoctypeToken).forceQuirks = true;
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.appendCharToDoctypePublicId(utils.toCharacter(codePoint));
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#doctype-public-identifier-(single-quoted)-state
   */
  private [TokenizerState.DoctypePublicIdentifierSingleQuotedState](
    codePoint: number
  ) {
    if (codePoint === CODE_POINTS.APOSTROPHE) {
      this.appendCharToDoctypePublicId("'");
      this.switchStateTo(TokenizerState.AfterDoctypePublicIdentifierState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      this.appendCharToDoctypePublicId(REPLACEMENT_CHARACTER);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.parseError(TokenizingErrors.AbruptDoctypePublicIdentifier);
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInDoctype);
      (this.currentToken as DoctypeToken).forceQuirks = true;
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.appendCharToDoctypePublicId(utils.toCharacter(codePoint));
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#after-doctype-public-identifier-state
   */
  private [TokenizerState.AfterDoctypePublicIdentifierState](
    codePoint: number
  ) {
    if (utils.isWhitespace(codePoint)) {
      this.switchStateTo(
        TokenizerState.BetweenDoctypePublicAndSystemIdentifiersState
      );
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      this.parseError(
        TokenizingErrors.MissingWhitespaceBetweenDoctypePublicAndSystemIdentifiers
      );
      (this.currentToken as DoctypeToken).systemId.value = "";
      this.switchStateTo(
        TokenizerState.DoctypeSystemIdentifierDoubleQuotedState
      );
    } else if (codePoint === CODE_POINTS.APOSTROPHE) {
      this.parseError(
        TokenizingErrors.MissingWhitespaceBetweenDoctypePublicAndSystemIdentifiers
      );
      (this.currentToken as DoctypeToken).systemId.value = "";
      this.switchStateTo(
        TokenizerState.DoctypeSystemIdentifierSingleQuotedState
      );
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInDoctype);
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.parseError(
        TokenizingErrors.MissingQuoteBeforeDoctypeSystemIdentifier
      );
      this.reconsumeInState(TokenizerState.BogusDoctypeState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#between-doctype-public-and-system-identifiers-state
   */
  private [TokenizerState.BetweenDoctypePublicAndSystemIdentifiersState](
    codePoint: number
  ) {
    if (utils.isWhitespace(codePoint)) {
      return;
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      this.appendCharToDoctypeSystemId('"');
      this.switchStateTo(
        TokenizerState.DoctypeSystemIdentifierDoubleQuotedState
      );
    } else if (codePoint === CODE_POINTS.APOSTROPHE) {
      this.appendCharToDoctypeSystemId("'");
      this.switchStateTo(
        TokenizerState.DoctypeSystemIdentifierSingleQuotedState
      );
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInDoctype);
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.parseError(
        TokenizingErrors.MissingQuoteBeforeDoctypeSystemIdentifier
      );
      (this.currentToken as DoctypeToken).forceQuirks = true;
      this.reconsumeInState(TokenizerState.BogusDoctypeState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#after-doctype-system-keyword-state
   */
  private [TokenizerState.AfterDoctypeSystemKeywordState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      this.switchStateTo(TokenizerState.BeforeDoctypeSystemIdentifierState);
    } else if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      this.parseError(
        TokenizingErrors.MissingWhitespaceAfterDoctypeSystemKeyword
      );
      this.switchStateTo(
        TokenizerState.DoctypeSystemIdentifierDoubleQuotedState
      );
    } else if (codePoint === CODE_POINTS.APOSTROPHE) {
      this.parseError(TokenizingErrors.MissingDoctypeSystemIdentifier);
      this.switchStateTo(
        TokenizerState.DoctypeSystemIdentifierSingleQuotedState
      );
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.parseError(TokenizingErrors.MissingDoctypeSystemIdentifier);
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInDoctype);
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.parseError(
        TokenizingErrors.MissingQuoteBeforeDoctypeSystemIdentifier
      );
      (this.currentToken as DoctypeToken).forceQuirks = true;
      this.reconsumeInState(TokenizerState.BogusDoctypeState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#before-doctype-system-identifier-state
   */
  private [TokenizerState.BeforeDoctypeSystemIdentifierState](
    codePoint: number
  ) {
    if (utils.isWhitespace(codePoint)) {
      return;
    } else if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      this.appendCharToDoctypeSystemId('"');
      this.switchStateTo(
        TokenizerState.DoctypeSystemIdentifierDoubleQuotedState
      );
    } else if (codePoint === CODE_POINTS.APOSTROPHE) {
      this.appendCharToDoctypeSystemId("");
      this.switchStateTo(
        TokenizerState.DoctypeSystemIdentifierSingleQuotedState
      );
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.parseError(TokenizingErrors.MissingDoctypeSystemIdentifier);
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInDoctype);
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.parseError(
        TokenizingErrors.MissingQuoteBeforeDoctypeSystemIdentifier
      );
      this.reconsumeInState(TokenizerState.BogusDoctypeState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#doctype-system-identifier-(double-quoted)-state
   */
  private [TokenizerState.DoctypeSystemIdentifierDoubleQuotedState](
    codePoint: number
  ) {
    if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      this.appendCharToDoctypeSystemId('"');
      this.switchStateTo(TokenizerState.AfterDoctypeSystemIdentifierState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      (this.currentToken as DoctypeToken).systemId.value +=
        REPLACEMENT_CHARACTER;
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.parseError(TokenizingErrors.AbruptDoctypeSystemIdentifier);
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInDoctype);
      (this.currentToken as DoctypeToken).forceQuirks = true;
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.appendCharToDoctypeSystemId(utils.toCharacter(codePoint));
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#doctype-system-identifier-(single-quoted)-state
   */
  private [TokenizerState.DoctypeSystemIdentifierSingleQuotedState](
    codePoint: number
  ) {
    if (codePoint === CODE_POINTS.APOSTROPHE) {
      this.appendCharToDoctypeSystemId("'");
      this.switchStateTo(TokenizerState.AfterDoctypeSystemIdentifierState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
      (this.currentToken as DoctypeToken).systemId.value +=
        REPLACEMENT_CHARACTER;
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.parseError(TokenizingErrors.AbruptDoctypeSystemIdentifier);
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInDoctype);
      (this.currentToken as DoctypeToken).forceQuirks = true;
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.appendCharToDoctypeSystemId(utils.toCharacter(codePoint));
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#after-doctype-system-identifier-state
   */
  private [TokenizerState.AfterDoctypeSystemIdentifierState](
    codePoint: number
  ) {
    if (utils.isWhitespace(codePoint)) {
      return;
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.pushToPunctuatorTokens(">");
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInDoctype);
      (this.currentToken as DoctypeToken).forceQuirks = true;
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.parseError(
        TokenizingErrors.UnexpectedCharacterAfterDoctypeSystemIdentifier
      );
      this.reconsumeInState(TokenizerState.BogusDoctypeState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#bogus-doctype-state
   */
  private [TokenizerState.BogusDoctypeState](codePoint: number) {
    if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.pushToPunctuatorTokens(">");
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.UnexpectedNullCharacter);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.emitCurrentToken();
      this.emitEofToken();
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#cdata-section-state
   */
  private [TokenizerState.CdataSectionState](codePoint: number) {
    if (codePoint === CODE_POINTS.RIGHT_SQUARE_BRACKET) {
      this.switchStateTo(TokenizerState.CdataSectionBracketState);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.parseError(TokenizingErrors.EofInCdata);
      this.emitEofToken();
    } else {
      this.emitCodePoint(codePoint);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#cdata-section-bracket-state
   */
  private [TokenizerState.CdataSectionBracketState](codePoint: number) {
    if (codePoint === CODE_POINTS.RIGHT_SQUARE_BRACKET) {
      this.switchStateTo(TokenizerState.CdataSectionEndState);
    } else {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "]");
      this.reconsumeInState(TokenizerState.CdataSectionState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#cdata-section-end-state
   */
  private [TokenizerState.CdataSectionEndState](codePoint: number) {
    if (codePoint === CODE_POINTS.RIGHT_SQUARE_BRACKET) {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "]");
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.switchStateTo(TokenizerState.DataState);
    } else {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "]]");
      this.reconsumeInState(TokenizerState.CdataSectionState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#character-reference-state
   */
  private [TokenizerState.CharacterReferenceState](codePoint: number) {
    // this.temporaryBuffer = [CODE_POINTS.AMPERSAND];

    if (utils.isAsciiAlphaNumeric(codePoint)) {
      this.reconsumeInState(TokenizerState.NamedCharacterReferenceState);
    } else if (codePoint === CODE_POINTS.NUMBER_SIGN) {
      this.temporaryBuffer.push(codePoint);
    } else {
      this.reconsumeInState(this.returnState!);
      this.flushCodePointConsumedAsCharacterReference(CODE_POINTS.AMPERSAND);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state
   */
  private [TokenizerState.NamedCharacterReferenceState](codePoint: number) {
    // TODO
    this.charRefCode = 0;
    if (
      codePoint === CODE_POINTS.LATIN_SMALL_X ||
      codePoint === CODE_POINTS.LATIN_CAPITAL_X
    ) {
      this.temporaryBuffer.push(codePoint);
      this.switchStateTo(
        TokenizerState.HexademicalCharacterReferenceStartState
      );
    } else {
      this.reconsumeInState(
        TokenizerState.HexademicalCharacterReferenceStartState
      );
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#numeric-character-reference-state
   */
  private [TokenizerState.AmbiguousAmpersandState](codePoint: number) {
    if (utils.isAsciiAlphaNumeric(codePoint)) {
      // TODO
      // if (this._isCharacterReferenceInAttribute()) {
      //   this.currentAttr.value += toChar(cp);
      // } else {
      //   this._emitCodePoint(cp);
      // }
    } else {
      if (codePoint === CODE_POINTS.SEMICOLON) {
        this.parseError(TokenizingErrors.UnknownNamedCharacterReference);
      }
      this.reconsumeInState(this.returnState!);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#numeric-character-reference-state
   */
  private [TokenizerState.NumericCharacterReferenceState](codePoint: number) {
    this.charRefCode = 0;
    if (
      codePoint === CODE_POINTS.LATIN_SMALL_X ||
      codePoint === CODE_POINTS.LATIN_CAPITAL_X
    ) {
      this.temporaryBuffer.push(codePoint);
      this.switchStateTo(
        TokenizerState.HexademicalCharacterReferenceStartState
      );
    } else {
      this.reconsumeInState(TokenizerState.DecimalCharacterReferenceStartState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#hexadecimal-character-reference-start-state
   */
  private [TokenizerState.HexademicalCharacterReferenceStartState](
    codePoint: number
  ) {
    if (utils.isAsciiDigit(codePoint)) {
      this.reconsumeInState(TokenizerState.DecimalCharacterReferenceState);
    } else {
      this.parseError(
        TokenizingErrors.AbsenceOfDigitsInNumericCharacterReference
      );
      // TODO
      // this._flushCodePointsConsumedAsCharacterReference();
      this.reconsumeInState(this.returnState!);
    }
  }

  private [TokenizerState.DecimalCharacterReferenceStartState](
    codePoint: number
  ) {
    // TODO
    if (utils.isAsciiDigit(codePoint)) {
      this.reconsumeInState(TokenizerState.DecimalCharacterReferenceState);
    } else {
      // TODO: error
      this.reconsumeInState(this.returnState!);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#hexadecimal-character-reference-state
   */
  private [TokenizerState.HexademicalCharacterReferenceState](
    codePoint: number
  ) {
    if (utils.isAsciiUpperHexDigit(codePoint)) {
      this.charRefCode = this.charRefCode * 16 + codePoint - 0x37;
    } else if (utils.isAsciiLowerHexDigit(codePoint)) {
      this.charRefCode = this.charRefCode * 16 + codePoint - 0x57;
    } else if (utils.isAsciiDigit(codePoint)) {
      this.charRefCode = this.charRefCode * 16 + codePoint - 0x30;
    } else if (codePoint === CODE_POINTS.SEMICOLON) {
      this.state = TokenizerState.NumericCharacterReferenceEndState;
    } else {
      this.parseError(TokenizingErrors.MissingSemicolonAfterCharacterReference);
      this.reconsumeInState(TokenizerState.NumericCharacterReferenceEndState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#decimal-character-reference-state
   */
  private [TokenizerState.DecimalCharacterReferenceState](codePoint: number) {
    if (utils.isAsciiDigit(codePoint)) {
      this.charRefCode = this.charRefCode * 10 + codePoint - 0x30;
    } else if (codePoint === CODE_POINTS.SEMICOLON) {
      this.switchStateTo(TokenizerState.NumericCharacterReferenceEndState);
    } else {
      this.parseError(TokenizingErrors.MissingSemicolonAfterCharacterReference);
      this.reconsumeInState(TokenizerState.NumericCharacterReferenceEndState);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/parsing.html#numeric-character-reference-state
   */
  private [TokenizerState.NumericCharacterReferenceEndState](
    codePoint: number
  ) {
    if (codePoint === CODE_POINTS.NULL) {
      this.parseError(TokenizingErrors.NullCharacterReference);
      this.charRefCode = CODE_POINTS.REPLACEMENT_CHARACTER;
    } else if (this.charRefCode > 0x10ffff) {
      this.parseError(TokenizingErrors.CharacterReferenceOutsideUnicodeRange);
      this.charRefCode = CODE_POINTS.REPLACEMENT_CHARACTER;
    } else if (utils.isSurrogate(this.charRefCode)) {
      this.parseError(TokenizingErrors.SurrogateCharacterReference);
      this.charRefCode = CODE_POINTS.REPLACEMENT_CHARACTER;
    } else if (
      utils.isUndefinedCodePoint(codePoint) ||
      this.charRefCode === CODE_POINTS.CARRIAGE_RETURN
    ) {
      this.parseError(TokenizingErrors.ControlCharacterReference);
      const replacement = (C1_CONTROLS_REFERENCE_REPLACEMENTS as any)[
        this.charRefCode
      ];
      if (replacement) {
        this.charRefCode = replacement;
      }
    }
    this.temporaryBuffer = [this.charRefCode];
    //  this._flushCodePointsConsumedAsCharacterReference();
    this.reconsumeInState(this.returnState!);
  }
}
