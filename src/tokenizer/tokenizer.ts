import {
  CODE_POINTS,
  CODE_POINT_SEQUENCES,
  REPLACEMENT_CHARACTER,
  C1_CONTROLS_REFERENCE_REPLACEMENTS,
} from "../common/constants";
import { TokenizerState } from "./tokenizer-state";
import { PositionTracker } from "./position-tracker";
import * as utils from "../common/utils";
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

  /**
   * Create Tokenizer
   * @param {string} input HTML string.
   * @returns Tokenizer instance.
   */
  public static create(input: string) {
    return new Tokenizer(input);
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

  // ===================================================================
  // Create tokens
  // ===================================================================

  private createStartTagToken() {
    const position = this.posTracker.getStartPosition();
    const index = this.posTracker.getStartRange();
    this.currentToken = new StartTagToken();
    this.currentToken.tagName = new TagNameToken("", index, position);

    const opening = this.punctuatorTokens.pop();
    if (!opening) {
      throw new Error("TODO");
    }
    this.currentToken.opening = opening;
  }

  private createEndTagToken() {
    const position = this.posTracker.getStartPosition();
    const index = this.posTracker.getStartRange();
    this.currentToken = new EndTagToken();
    this.currentToken.tagName = new TagNameToken("", index, position);
    const opening = this.punctuatorTokens.pop();
    if (!opening) {
      throw new Error("TODO :" + this.state);
    }
    this.currentToken.opening = opening;
  }

  private createCommentToken() {
    const position = this.posTracker.getStartPosition();
    const index = this.posTracker.getStartRange();
    this.currentToken = new CommentToken();
    this.currentToken.data = new CharactersToken("", index, position);
    const opening = this.punctuatorTokens.pop();
    if (!opening) {
      throw new Error("TODO");
    }
    this.currentToken.opening = opening;
  }

  private createDoctypeToken(value: string = "") {
    const loc = this.posTracker.getStartPosition();
    const range = this.posTracker.getRange();
    this.currentToken = new DoctypeToken();
    this.currentToken.name = new CharactersToken(value, range[0], loc);
    const opening = this.punctuatorTokens.pop();
    if (!opening) {
      throw new Error("TODO");
    }
    this.currentToken.opening = opening;
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
      if (!closing) {
        throw new Error("TODO:" + this.state);
      }
      token.closing = closing;
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
    // options?: {
    //   appendToPunctuators: boolean;
    // }
    onMatch: (pattern: number[]) => void
  ) {
    let consumedCount = 0;
    let isMatch = true;
    const patternLength = pattern.length;
    let patternPos = 0;
    let cp = startCodePoint;
    let patternCp: number | string;

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
      onMatch(pattern);
    }

    return isMatch;
  }

  private [TokenizerState.DataState](codePoint: number) {
    if (codePoint === CODE_POINTS.AMPERSAND) {
      this.setReturnState(TokenizerState.DataState);
      this.switchStateTo(TokenizerState.CharacterReferenceState);
    } else if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.pushToPunctuatorTokens("<");
      this.switchStateTo(TokenizerState.TagOpenState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.emitCodePoint(codePoint);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.emitEofToken();
    } else {
      this.emitCodePoint(codePoint);
    }
  }

  private [TokenizerState.RCDATAState](codePoint: number) {
    if (codePoint === CODE_POINTS.AMPERSAND) {
      this.setReturnState(TokenizerState.RCDATAState);
      this.switchStateTo(TokenizerState.CharacterReferenceState);
    } else if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.switchStateTo(TokenizerState.RCDATALessThanSignState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.emitReplacementCharacter();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.emitEofToken();
    } else {
      this.emitCodePoint(codePoint);
    }
  }

  private [TokenizerState.RawTextState](codePoint: number) {
    if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.switchStateTo(TokenizerState.RawTextLessThanSignState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.emitReplacementCharacter();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.emitEofToken();
    } else {
      this.emitCodePoint(codePoint);
    }
  }

  private [TokenizerState.ScriptDataState](codePoint: number) {
    if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.switchStateTo(TokenizerState.ScriptDataLessThanSignState);
    } else if (codePoint === CODE_POINTS.NULL) {
      this.emitReplacementCharacter();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.emitEofToken();
    } else {
      this.emitCodePoint(codePoint);
    }
  }

  private [TokenizerState.PlainTextState](codePoint: number) {
    if (codePoint === CODE_POINTS.NULL) {
      this.emitReplacementCharacter();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.emitEofToken();
    } else {
      this.emitCodePoint(codePoint);
    }
  }

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
      // TODO: error
      this.reconsumeInState(TokenizerState.BogusCommentState);
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
    } else {
      // TODO: error
      this.reconsumeInState(TokenizerState.DataState);
    }
  }

  private [TokenizerState.EndTagOpenState](codePoint: number) {
    if (utils.isAsciiAlpha(codePoint)) {
      this.createEndTagToken();
      this.reconsumeInState(TokenizerState.TagNameState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      // TODO: error
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitEofToken();
    } else {
      this.createCommentToken();
      this.reconsumeInState(TokenizerState.BogusCommentState);
    }
  }

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
      // TODO: error
      (this.currentToken as StartTagToken).tagName.value +=
        REPLACEMENT_CHARACTER;
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitEofToken();
    } else {
      this.appendCharToCurrentTagTokenName(utils.toCharacter(codePoint));
    }
  }

  private [TokenizerState.RCDATALessThanSignState](codePoint: number) {
    if (codePoint === CODE_POINTS.SOLIDUS) {
      this.temporaryBuffer = [];
      this.switchStateTo(TokenizerState.RCDATAEndTagOpenState);
    } else {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "<");
      this.reconsumeInState(TokenizerState.RCDATAState);
    }
  }

  private [TokenizerState.RCDATAEndTagOpenState](codePoint: number) {
    if (utils.isAsciiAlpha(codePoint)) {
      this.createEndTagToken();
      this.reconsumeInState(TokenizerState.RCDATAEndTagNameState);
    } else {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "</");
      this.reconsumeInState(TokenizerState.RCDATAState);
    }
  }

  private [TokenizerState.RCDATAEndTagNameState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      // this.appendToCurrentToken(utils.toAsciiLowerCharacter(codePoint));
      this.temporaryBuffer.push(codePoint);
    } else if (codePoint === CODE_POINTS.SOLIDUS) {
      // TODO: If the current end tag token is an appropriate end tag token, then switch to the self-closing start tag state. Otherwise, treat it as per the "anything else" entry below.
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      // TODO: If the current end tag token is an appropriate end tag token, then switch to the data state and emit the current tag token. Otherwise, treat it as per the "anything else" entry below.
    } else if (utils.isAsciiUpperAlpha(codePoint)) {
      // TODO: Append the lowercase version of the current input character (add 0x0020 to the character's code point) to the current tag token's tag name. Append the current input character to the temporary buffer.
    } else if (utils.isAsciiLowerAlpha(codePoint)) {
      // TODO: Append the current input character to the current tag token's tag name. Append the current input character to the temporary buffer.
    } else {
      // TODO: Emit a U+003C LESS-THAN SIGN character token, a U+002F SOLIDUS character token, and a character token for each of the characters in the temporary buffer (in the order they were added to the buffer). Reconsume in the RCDATA state.
    }
  }

  private [TokenizerState.RawTextLessThanSignState](codePoint: number) {
    if (codePoint === CODE_POINTS.SOLIDUS) {
      this.temporaryBuffer = [];
      this.switchStateTo(TokenizerState.RawTextEndTagOpenState);
    } else {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "<");
      this.reconsumeInState(TokenizerState.RawTextState);
    }
  }

  private [TokenizerState.RawTextEndTagOpenState](codePoint: number) {
    if (utils.isAsciiAlpha(codePoint)) {
      this.createEndTagToken();
      this.reconsumeInState(TokenizerState.RawTextEndTagNameState);
    } else {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "</");
      this.reconsumeInState(TokenizerState.RawTextState);
    }
  }

  private [TokenizerState.RawTextEndTagNameState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      // TODO: If the current end tag token is an appropriate end tag token, then switch to the before attribute name state. Otherwise, treat it as per the "anything else" entry below.
    } else if (codePoint === CODE_POINTS.SOLIDUS) {
      // TODO: If the current end tag token is an appropriate end tag token, then switch to the self-closing start tag state. Otherwise, treat it as per the "anything else" entry below.
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      // TODO: If the current end tag token is an appropriate end tag token, then switch to the data state and emit the current tag token. Otherwise, treat it as per the "anything else" entry below.
    } else if (utils.isAsciiUpperAlpha(codePoint)) {
      // TODO: Append the lowercase version of the current input character (add 0x0020 to the character's code point) to the current tag token's tag name. Append the current input character to the temporary buffer.
    } else if (utils.isAsciiLowerAlpha(codePoint)) {
      // TODO: Append the current input character to the current tag token's tag name. Append the current input character to the temporary buffer.
    } else {
      // TODO: Emit a U+003C LESS-THAN SIGN character token, a U+002F SOLIDUS character token, and a character token for each of the characters in the temporary buffer (in the order they were added to the buffer). Reconsume in the RAWTEXT state.
    }
  }

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

  private [TokenizerState.ScriptDataEndTagOpenState](codePoint: number) {
    if (utils.isAsciiAlpha(codePoint)) {
      this.createEndTagToken();
      this.reconsumeInState(TokenizerState.ScriptDataEndTagNameState);
    } else {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "</");
      this.reconsumeInState(TokenizerState.ScriptDataState);
    }
  }

  private [TokenizerState.ScriptDataEndTagNameState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      // TODO: If the current end tag token is an appropriate end tag token, then switch to the before attribute name state. Otherwise, treat it as per the "anything else" entry below.
    } else if (codePoint === CODE_POINTS.SOLIDUS) {
      // TODO: If the current end tag token is an appropriate end tag token, then switch to the self-closing start tag state. Otherwise, treat it as per the "anything else" entry below.
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      // TODO: If the current end tag token is an appropriate end tag token, then switch to the data state and emit the current tag token. Otherwise, treat it as per the "anything else" entry below.
    } else if (utils.isAsciiUpperAlpha(codePoint)) {
      // TODO: Append the lowercase version of the current input character (add 0x0020 to the character's code point) to the current tag token's tag name. Append the current input character to the temporary buffer.
    } else if (utils.isAsciiLowerAlpha(codePoint)) {
      // TODO: Append the current input character to the current tag token's tag name. Append the current input character to the temporary buffer.
    } else {
      // TODO: Emit a U+003C LESS-THAN SIGN character token, a U+002F SOLIDUS character token, and a character token for each of the characters in the temporary buffer (in the order they were added to the buffer)
      this.reconsumeInState(TokenizerState.ScriptDataState);
    }
  }

  private [TokenizerState.ScriptDataEscapeStartState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.switchStateTo(TokenizerState.ScriptDataEscapeStartDashState);
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "-");
    } else {
      this.reconsumeInState(TokenizerState.ScriptDataState);
    }
  }

  private [TokenizerState.ScriptDataEscapeStartDashState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.switchStateTo(TokenizerState.ScriptDataEscapedDashDashState);
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "-");
    } else {
      this.reconsumeInState(TokenizerState.ScriptDataState);
    }
  }

  private [TokenizerState.ScriptDataEscapedState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.switchStateTo(TokenizerState.ScriptDataEscapedDashState);
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "-");
    } else if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.switchStateTo(TokenizerState.ScriptDataEscapedLessThanSignState);
    } else if (codePoint === CODE_POINTS.NULL) {
      // TODO: error
      this.appendCharToCurrentCharacterToken(
        AtomTokenType.Characters,
        REPLACEMENT_CHARACTER
      );
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitEofToken();
    } else {
      this.emitCodePoint(codePoint);
    }
  }

  private [TokenizerState.ScriptDataEscapedDashState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.switchStateTo(TokenizerState.ScriptDataEscapedDashDashState);
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "-");
    } else if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.switchStateTo(TokenizerState.ScriptDataEscapedLessThanSignState);
    } else if (codePoint === CODE_POINTS.NULL) {
      // TODO: error
      this.appendCharToCurrentCharacterToken(
        AtomTokenType.Characters,
        REPLACEMENT_CHARACTER
      );
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitEofToken();
    } else {
      this.switchStateTo(TokenizerState.ScriptDataEscapedState);
      this.emitCodePoint(codePoint);
    }
  }

  private [TokenizerState.ScriptDataEscapedDashDashState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "-");
    } else if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.switchStateTo(TokenizerState.ScriptDataEscapedLessThanSignState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.switchStateTo(TokenizerState.ScriptDataState);
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, ">");
    } else if (codePoint === CODE_POINTS.NULL) {
      // TODO: error
      this.switchStateTo(TokenizerState.ScriptDataEscapedState);
      this.appendCharToCurrentCharacterToken(
        AtomTokenType.Characters,
        REPLACEMENT_CHARACTER
      );
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitEofToken();
    } else {
      this.switchStateTo(TokenizerState.ScriptDataEscapedState);
      this.emitCodePoint(codePoint);
    }
  }

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

  private [TokenizerState.ScriptDataEscapedEndTagOpenState](codePoint: number) {
    if (utils.isAsciiAlpha(codePoint)) {
      this.createEndTagToken();
      this.reconsumeInState(TokenizerState.ScriptDataEscapedEndTagNameState);
    } else {
      this.appendCharToCurrentCharacterToken(AtomTokenType.Characters, "</");
      this.reconsumeInState(TokenizerState.ScriptDataEscapedState);
    }
  }

  private [TokenizerState.ScriptDataEscapedEndTagNameState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      // TODO: If the current end tag token is an appropriate end tag token, then switch to the before attribute name state. Otherwise, treat it as per the "anything else" entry below.
    } else if (codePoint === CODE_POINTS.SOLIDUS) {
      // TODO: If the current end tag token is an appropriate end tag token, then switch to the self-closing start tag state. Otherwise, treat it as per the "anything else" entry below.
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      // TODO: If the current end tag token is an appropriate end tag token, then switch to the data state and emit the current tag token. Otherwise, treat it as per the "anything else" entry below.
    } else if (utils.isAsciiUpperAlpha(codePoint)) {
      // TODO: Append the lowercase version of the current input character (add 0x0020 to the character's code point) to the current tag token's tag name. Append the current input character to the temporary buffer.
    } else if (utils.isAsciiLowerAlpha(codePoint)) {
      // TODO: Append the current input character to the current tag token's tag name. Append the current input character to the temporary buffer.
    } else {
      // TODO: Emit a U+003C LESS-THAN SIGN character token, a U+002F SOLIDUS character token, and a character token for each of the characters in the temporary buffer (in the order they were added to the buffer). Reconsume in the script data escaped state.
    }
  }

  private [TokenizerState.ScriptDataDoubleEscapeStartState](codePoint: number) {
    if (
      utils.isWhitespace(codePoint) ||
      codePoint === CODE_POINTS.SOLIDUS ||
      codePoint === CODE_POINTS.GREATER_THAN_SIGN
    ) {
      // TODO: If the temporary buffer is the string "script", then switch to the script data double escaped state. Otherwise, switch to the script data escaped state. Emit the current input character as a character token.
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
      // TODO: error
      this.appendCharToCurrentCharacterToken(
        AtomTokenType.Characters,
        REPLACEMENT_CHARACTER
      );
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitEofToken();
    } else {
      this.emitCodePoint(codePoint);
    }
  }

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
      // TODO: error
      this.switchStateTo(TokenizerState.ScriptDataDoubleEscapedState);
      this.appendCharToCurrentCharacterToken(
        AtomTokenType.Characters,
        REPLACEMENT_CHARACTER
      );
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitEofToken();
    } else {
      this.switchStateTo(TokenizerState.ScriptDataDoubleEscapedState);
      this.emitCodePoint(codePoint);
    }
  }

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
      // TODO: error
      this.switchStateTo(TokenizerState.ScriptDataDoubleEscapedState);
      this.appendCharToCurrentCharacterToken(
        AtomTokenType.Characters,
        REPLACEMENT_CHARACTER
      );
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitEofToken();
    } else {
      this.switchStateTo(TokenizerState.ScriptDataDoubleEscapedState);
      this.emitCodePoint(codePoint);
    }
  }

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

  private [TokenizerState.ScriptDataDoubleEscapeEndState](codePoint: number) {
    if (
      utils.isWhitespace(codePoint) ||
      codePoint === CODE_POINTS.SOLIDUS ||
      codePoint === CODE_POINTS.GREATER_THAN_SIGN
    ) {
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
      // TODO: error
      this.createAttributeToken("=");
      this.switchStateTo(TokenizerState.AttributeNameState);
    } else {
      this.createAttributeToken("");
      this.reconsumeInState(TokenizerState.AttributeNameState);
    }
  }

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
      // this.switchStateTo(TokenizerState.BeforeAttributeValueState);
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
      // TODO: error
      this.currentAttributeToken!.name!.value += REPLACEMENT_CHARACTER;
    } else if (
      codePoint === CODE_POINTS.QUOTATION_MARK ||
      codePoint === CODE_POINTS.APOSTROPHE ||
      codePoint === CODE_POINTS.LESS_THAN_SIGN
    ) {
      // TODO: error
      this.currentAttributeToken!.name!.value += utils.toCharacter(codePoint);
    } else {
      this.appendCharToCurrentAttributeTokenName(utils.toCharacter(codePoint));
    }
  }

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
      // TODO: error
      this.emitEofToken();
    } else {
      this.createAttributeToken("");
      this.reconsumeInState(TokenizerState.AttributeNameState);
    }
  }

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
      // TODO: error
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
    } else {
      this.reconsumeInState(TokenizerState.AttributeValueUnquotedState);
    }
  }

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

  private [TokenizerState.AttributeValueSingleQuotedState](codePoint: number) {
    if (codePoint === CODE_POINTS.APOSTROPHE) {
      this.appendValueToCurrentAttributeToken("'");
      this.switchStateTo(TokenizerState.AfterAttributeValueQuotedState);
    } else if (codePoint === CODE_POINTS.AMPERSAND) {
      this.setReturnState(TokenizerState.AttributeValueSingleQuotedState);
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
      // TODO: error
      this.appendValueToCurrentAttributeToken(REPLACEMENT_CHARACTER);
    } else if (
      codePoint === CODE_POINTS.QUOTATION_MARK ||
      codePoint === CODE_POINTS.APOSTROPHE ||
      codePoint === CODE_POINTS.LESS_THAN_SIGN ||
      codePoint === CODE_POINTS.EQUALS_SIGN ||
      codePoint === CODE_POINTS.GRAVE_ACCENT
    ) {
      // TODO: error
      this.appendValueToCurrentAttributeToken(utils.toCharacter(codePoint));
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitEofToken();
    } else {
      this.appendValueToCurrentAttributeToken(utils.toCharacter(codePoint));
    }
  }

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
      // TODO: error
      this.emitEofToken();
    } else {
      // TODO: error
      this.reconsumeInState(TokenizerState.BeforeAttributeNameState);
    }
  }

  private [TokenizerState.SelfClosingStartTagState](codePoint: number) {
    if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      (this.currentToken as StartTagToken).selfClosing = true;
      this.appendToLastPunctuatorTokens(">");
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitEofToken();
    } else {
      // TODO: error
      this.reconsumeInState(TokenizerState.BeforeAttributeNameState);
    }
  }

  private [TokenizerState.BogusCommentState](codePoint: number) {
    if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.switchStateTo(TokenizerState.DataState);
      // TODO: Emit the current comment token.
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: Emit the comment. Emit an end-of-file token.
    } else if (codePoint === CODE_POINTS.NULL) {
      // TODO: This is an unexpected-null-character parse error. Append a U+FFFD REPLACEMENT CHARACTER character to the comment token's data.
    } else {
      // TODO: Append the current input character to the comment token's data.
    }
  }

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
        (pattern) => {
          this.appendToLastPunctuatorTokens(
            pattern.map((p) => utils.toCharacter(p)).join("")
          );
        }
      )
    ) {
      // this._createCommentToken();
      // this.currentToken.data = "[CDATA[";
      this.switchStateTo(TokenizerState.BogusCommentState);
    } else {
      this.switchStateTo(TokenizerState.BogusCommentState);
    }
  }

  private [TokenizerState.CommentStartState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.pushToPunctuatorTokens("-");
      this.switchStateTo(TokenizerState.CommentStartDashState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      // TODO: error
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
    } else {
      this.reconsumeInState(TokenizerState.CommentState);
    }
  }

  private [TokenizerState.CommentStartDashState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.appendToLastPunctuatorTokens("-");
      this.switchStateTo(TokenizerState.CommentEndState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      // TODO: error
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.appendCharToCurrentCommentTokenData("-");
      this.reconsumeInState(TokenizerState.CommentState);
    }
  }

  private [TokenizerState.CommentState](codePoint: number) {
    if (codePoint === CODE_POINTS.LESS_THAN_SIGN) {
      this.appendCharToCurrentCommentTokenData("<");
      this.switchStateTo(TokenizerState.CommentLessThanSignState);
    } else if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.pushToPunctuatorTokens("-");
      this.switchStateTo(TokenizerState.CommentEndDashState);
    } else if (codePoint === CODE_POINTS.NULL) {
      // TODO: error
      (this.currentToken as CommentToken).data.value +=
        CODE_POINTS.REPLACEMENT_CHARACTER;
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.appendCharToCurrentCommentTokenData(utils.toCharacter(codePoint));
    }
  }

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

  private [TokenizerState.CommentLessThanSignBangState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.switchStateTo(TokenizerState.CommentLessThanSignBangDashDashState);
    } else {
      this.reconsumeInState(TokenizerState.CommentEndDashState);
    }
  }

  private [TokenizerState.CommentLessThanSignBangDashState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.switchStateTo(TokenizerState.CommentLessThanSignBangDashDashState);
    } else {
      this.reconsumeInState(TokenizerState.CommentEndDashState);
    }
  }

  private [TokenizerState.CommentLessThanSignBangDashDashState](
    codePoint: number
  ) {
    if (
      codePoint === CODE_POINTS.GREATER_THAN_SIGN ||
      codePoint === CODE_POINTS.EOF
    ) {
      this.reconsumeInState(TokenizerState.CommentEndState);
    } else {
      // TODO: error
      this.reconsumeInState(TokenizerState.CommentEndState);
    }
  }

  private [TokenizerState.CommentEndDashState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      this.appendToLastPunctuatorTokens("-");
      this.switchStateTo(TokenizerState.CommentEndState);
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.appendCharToCurrentCommentTokenData("-");
      this.reconsumeInState(TokenizerState.CommentState);
    }
  }

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
      // TODO: error
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      (this.currentToken as CommentToken).data.value += "--";
      this.reconsumeInState(TokenizerState.CommentState);
    }
  }

  private [TokenizerState.CommentEndBangState](codePoint: number) {
    if (codePoint === CODE_POINTS.HYPHEN_MINUS) {
      (this.currentToken as CommentToken).data.value += "--!";
      this.switchStateTo(TokenizerState.CommentEndDashState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      // TODO: error
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
      this.emitEofToken();
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: Error
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      (this.currentToken as CommentToken).data.value += "--!";
      this.reconsumeInState(TokenizerState.CommentState);
    }
  }

  private [TokenizerState.DoctypeState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      this.switchStateTo(TokenizerState.BeforeDoctypeNameState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.reconsumeInState(TokenizerState.BeforeDoctypeNameState);
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.createDoctypeToken("");
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      // TODO: error
      this.reconsumeInState(TokenizerState.BeforeDoctypeNameState);
    }
  }

  private [TokenizerState.BeforeDoctypeNameState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      return;
    } else if (utils.isAsciiUpperAlpha(codePoint)) {
      this.createDoctypeToken(utils.toAsciiLowerCharacter(codePoint));
      this.switchStateTo(TokenizerState.DoctypeNameState);
    } else if (codePoint === CODE_POINTS.NULL) {
      // TODO: error
      this.createDoctypeToken(REPLACEMENT_CHARACTER);
      this.switchStateTo(TokenizerState.DoctypeNameState);
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      // TODO: error
      this.createDoctypeToken("");
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.createDoctypeToken("");
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.createDoctypeToken(utils.toCharacter(codePoint));
      this.switchStateTo(TokenizerState.DoctypeNameState);
    }
  }

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
      // TODO: error
      (this.currentToken as DoctypeToken).name.value += REPLACEMENT_CHARACTER;
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      (this.currentToken as DoctypeToken).forceQuirks = true;
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.appendCharToDoctypeTokenName(utils.toCharacter(codePoint));
    }
  }

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
      // TODO: error
      //   this.currentToken.forceQuirks = true;
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
      // TODO: error
      this.reconsumeInState(TokenizerState.BogusDoctypeState);
    }
  }

  private [TokenizerState.AfterDoctypePublicKeywordState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      this.switchStateTo(TokenizerState.BeforeDoctypePublicIdentifierState);
    } else if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      // TODO: error
      this.switchStateTo(
        TokenizerState.DoctypePublicIdentifierDoubleQuotedState
      );
    } else if (codePoint === CODE_POINTS.APOSTROPHE) {
      // TODO: error;
      this.switchStateTo(
        TokenizerState.DoctypePublicIdentifierSingleQuotedState
      );
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      // TODO: error;
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
    } else if (codePoint === CODE_POINTS.EOF) {
      // This is an eof-in-doctype parse error. Set the current DOCTYPE token's force-quirks flag to on. Emit the current DOCTYPE token. Emit an end-of-file token.
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.reconsumeInState(TokenizerState.BogusCommentState);
    }
  }

  private [TokenizerState.BeforeDoctypePublicIdentifierState](
    codePoint: number
  ) {
    if (utils.isWhitespace(codePoint)) {
      return;
    } else if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      this.switchStateTo(
        TokenizerState.DoctypePublicIdentifierDoubleQuotedState
      );
    } else if (codePoint === CODE_POINTS.APOSTROPHE) {
      this.switchStateTo(
        TokenizerState.DoctypePublicIdentifierSingleQuotedState
      );
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      // TODO: error
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: Error
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      // TODO: error
      this.reconsumeInState(TokenizerState.BogusDoctypeState);
    }
  }

  private [TokenizerState.DoctypePublicIdentifierDoubleQuotedState](
    codePoint: number
  ) {
    if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      this.switchStateTo(TokenizerState.AfterDoctypePublicIdentifierState);
    } else if (codePoint === CODE_POINTS.NULL) {
      // This is an unexpected-null-character parse error. Append a U+FFFD REPLACEMENT CHARACTER character to the current DOCTYPE token's public identifier.
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
      // This is an abrupt-doctype-public-identifier parse error. Set the current DOCTYPE token's force-quirks flag to on. Switch to the data state. Emit the current DOCTYPE token.
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitCurrentToken();
      this.emitEofToken();
      // This is an eof-in-doctype parse error. Set the current DOCTYPE token's force-quirks flag to on. Emit the current DOCTYPE token. Emit an end-of-file token.
    } else {
      this.appendCharToDoctypePublicId(utils.toCharacter(codePoint));
    }
  }

  private [TokenizerState.DoctypePublicIdentifierSingleQuotedState](
    codePoint: number
  ) {
    if (codePoint === CODE_POINTS.APOSTROPHE) {
      this.switchStateTo(TokenizerState.AfterDoctypePublicIdentifierState);
    } else if (codePoint === CODE_POINTS.NULL) {
      // This is an unexpected-null-character parse error. Append a U+FFFD REPLACEMENT CHARACTER character to the current DOCTYPE token's public identifier.
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      // TODO: error
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.emitCurrentToken();
      this.emitEofToken();
      // This is an eof-in-doctype parse error. Set the current DOCTYPE token's force-quirks flag to on. Emit the current DOCTYPE token. Emit an end-of-file token.
    } else {
      this.appendCharToDoctypePublicId(utils.toCharacter(codePoint));
    }
  }

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
      // TODO: error;
      (this.currentToken as DoctypeToken).systemId.value = "";
      this.switchStateTo(
        TokenizerState.DoctypeSystemIdentifierDoubleQuotedState
      );
    } else if (codePoint === CODE_POINTS.APOSTROPHE) {
      // TODO: error
      (this.currentToken as DoctypeToken).systemId.value = "";
      this.switchStateTo(
        TokenizerState.DoctypeSystemIdentifierSingleQuotedState
      );
      // This is a missing-whitespace-between-doctype-public-and-system-identifiers parse error. Set the current DOCTYPE token's system identifier to the empty string (not missing), then switch to the DOCTYPE system identifier (single-quoted) state.
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      // TODO: error
      this.reconsumeInState(TokenizerState.BogusDoctypeState);
      // This is a missing-quote-before-doctype-system-identifier parse error. Set the current DOCTYPE token's force-quirks flag to on. Reconsume in the bogus DOCTYPE state.
    }
  }

  private [TokenizerState.BetweenDoctypePublicAndSystemIdentifiersState](
    codePoint: number
  ) {
    if (utils.isWhitespace(codePoint)) {
      return;
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      // Set the current DOCTYPE token's system identifier to the empty string (not missing), then switch to the DOCTYPE system identifier (double-quoted) state.
      // TODO: error
      this.switchStateTo(
        TokenizerState.DoctypeSystemIdentifierDoubleQuotedState
      );
    } else if (codePoint === CODE_POINTS.APOSTROPHE) {
      // TODO: error
      this.switchStateTo(
        TokenizerState.DoctypeSystemIdentifierSingleQuotedState
      );
      // Set the current DOCTYPE token's system identifier to the empty string (not missing), then switch to the DOCTYPE system identifier (single-quoted) state.
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitCurrentToken();
      this.emitEofToken();
      // This is an eof-in-doctype parse error. Set the current DOCTYPE token's force-quirks flag to on. Emit the current DOCTYPE token. Emit an end-of-file token.
    } else {
      this.reconsumeInState(TokenizerState.BogusDoctypeState);
      // This is a missing-quote-before-doctype-system-identifier parse error. Set the current DOCTYPE token's force-quirks flag to on. Reconsume in the bogus DOCTYPE state.
    }
  }

  private [TokenizerState.AfterDoctypeSystemKeywordState](codePoint: number) {
    if (utils.isWhitespace(codePoint)) {
      this.switchStateTo(TokenizerState.BeforeDoctypeSystemIdentifierState);
    } else if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      // TODO: Error
      this.switchStateTo(
        TokenizerState.DoctypeSystemIdentifierDoubleQuotedState
      );
    } else if (codePoint === CODE_POINTS.APOSTROPHE) {
      // TODO:error
      this.switchStateTo(
        TokenizerState.DoctypeSystemIdentifierSingleQuotedState
      );
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      // TODO: error
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      // TODO: error
      this.reconsumeInState(TokenizerState.BogusDoctypeState);
    }
  }

  private [TokenizerState.BeforeDoctypeSystemIdentifierState](
    codePoint: number
  ) {
    if (utils.isWhitespace(codePoint)) {
      return;
    } else if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      this.switchStateTo(
        TokenizerState.DoctypeSystemIdentifierDoubleQuotedState
      );
    } else if (codePoint === CODE_POINTS.APOSTROPHE) {
      this.switchStateTo(
        TokenizerState.DoctypeSystemIdentifierSingleQuotedState
      );
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.switchStateTo(TokenizerState.DataState);
      this.emitCurrentToken();
    } else if (codePoint === CODE_POINTS.EOF) {
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      // TODO: error
      this.reconsumeInState(TokenizerState.BogusDoctypeState);
    }
  }

  private [TokenizerState.DoctypeSystemIdentifierDoubleQuotedState](
    codePoint: number
  ) {
    if (codePoint === CODE_POINTS.QUOTATION_MARK) {
      this.switchStateTo(TokenizerState.AfterDoctypeSystemIdentifierState);
    } else if (codePoint === CODE_POINTS.NULL) {
      // TODO: error
      (this.currentToken as DoctypeToken).systemId.value +=
        REPLACEMENT_CHARACTER;
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      // TODO: error
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
      // This is an abrupt-doctype-system-identifier parse error. Set the current DOCTYPE token's force-quirks flag to on. Switch to the data state. Emit the current DOCTYPE token.
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitCurrentToken();
      this.emitEofToken();
      // This is an eof-in-doctype parse error. Set the current DOCTYPE token's force-quirks flag to on. Emit the current DOCTYPE token. Emit an end-of-file token.
    } else {
      this.appendCharToDoctypeSystemId(utils.toCharacter(codePoint));
    }
  }

  private [TokenizerState.DoctypeSystemIdentifierSingleQuotedState](
    codePoint: number
  ) {
    if (codePoint === CODE_POINTS.APOSTROPHE) {
      this.switchStateTo(TokenizerState.AfterDoctypeSystemIdentifierState);
    } else if (codePoint === CODE_POINTS.NULL) {
      // TODO: error
      (this.currentToken as DoctypeToken).systemId.value +=
        REPLACEMENT_CHARACTER;
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      // TODO: error
      // TODO:       this.currentToken.forceQuirks = true;
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitCurrentToken();
      this.emitEofToken();
    } else {
      this.appendCharToDoctypeSystemId(utils.toCharacter(codePoint));
    }
  }

  private [TokenizerState.AfterDoctypeSystemIdentifierState](
    codePoint: number
  ) {
    if (utils.isWhitespace(codePoint)) {
      // Ignore the character.
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.pushToPunctuatorTokens(">");
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.EOF) {
      this.emitCurrentToken();
      this.emitEofToken();
      // This is an eof-in-doctype parse error. Set the current DOCTYPE token's force-quirks flag to on. Emit the current DOCTYPE token. Emit an end-of-file token.
    } else {
      this.reconsumeInState(TokenizerState.BogusDoctypeState);
      // This is an unexpected-character-after-doctype-system-identifier parse error. Reconsume in the bogus DOCTYPE state. (This does not set the current DOCTYPE token's force-quirks flag to on.)
    }
  }

  private [TokenizerState.BogusDoctypeState](codePoint: number) {
    if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.pushToPunctuatorTokens(">");
      this.emitCurrentToken();
      this.switchStateTo(TokenizerState.DataState);
    } else if (codePoint === CODE_POINTS.NULL) {
      // TODO: error
    } else if (codePoint === CODE_POINTS.EOF) {
      this.emitCurrentToken();
      this.emitEofToken();
    }
  }

  private [TokenizerState.CdataSectionState](codePoint: number) {
    if (codePoint === CODE_POINTS.RIGHT_SQUARE_BRACKET) {
      this.switchStateTo(TokenizerState.CdataSectionBracketState);
    } else if (codePoint === CODE_POINTS.EOF) {
      // TODO: error
      this.emitEofToken();
    } else {
      this.emitCodePoint(codePoint);
    }
  }

  private [TokenizerState.CdataSectionBracketState](codePoint: number) {
    if (codePoint === CODE_POINTS.RIGHT_SQUARE_BRACKET) {
      this.switchStateTo(TokenizerState.CdataSectionEndState);
    } else {
      // Emit a U+005D RIGHT SQUARE BRACKET character token. Reconsume in the CDATA section state.
    }
  }

  private [TokenizerState.CdataSectionEndState](codePoint: number) {
    if (codePoint === CODE_POINTS.RIGHT_SQUARE_BRACKET) {
      // Emit a U+005D RIGHT SQUARE BRACKET character token.
    } else if (codePoint === CODE_POINTS.GREATER_THAN_SIGN) {
      this.switchStateTo(TokenizerState.DataState);
    } else {
      // Emit two U+005D RIGHT SQUARE BRACKET character tokens. Reconsume in the CDATA section state.
    }
  }

  private [TokenizerState.CharacterReferenceState](codePoint: number) {
    this.temporaryBuffer = [CODE_POINTS.AMPERSAND];

    if (utils.isAsciiAlphaNumeric(codePoint)) {
      this.reconsumeInState(TokenizerState.NamedCharacterReferenceState);
    } else if (codePoint === CODE_POINTS.NUMBER_SIGN) {
      this.temporaryBuffer.push(codePoint);
    } else {
      // TODO Flush code points consumed as a character reference.
      this.reconsumeInState(this.returnState!);
    }
  }

  private [TokenizerState.NamedCharacterReferenceState](codePoint: number) {
    // TODO
    this.charRefCode = 0;
    if (
      codePoint === CODE_POINTS.LATIN_SMALL_X ||
      codePoint === CODE_POINTS.LATIN_CAPITAL_X
    ) {
      this.temporaryBuffer.push(codePoint);
      this.switchStateTo(TokenizerState.HexaemicalCharacterReferenceStartState);
    } else {
      this.reconsumeInState(
        TokenizerState.HexaemicalCharacterReferenceStartState
      );
    }
  }

  private [TokenizerState.AmbiguousAmpersandState](codePoint: number) {
    if (utils.isAsciiAlphaNumeric(codePoint)) {
    } else {
      if (codePoint === CODE_POINTS.SEMICOLON) {
        // TODO error
      }
      this.reconsumeInState(this.returnState!);
    }
  }

  private [TokenizerState.NumericCharacterReferenceState](codePoint: number) {
    this.charRefCode = 0;
    if (
      codePoint === CODE_POINTS.LATIN_SMALL_X ||
      codePoint === CODE_POINTS.LATIN_CAPITAL_X
    ) {
      this.temporaryBuffer.push(codePoint);
      this.switchStateTo(TokenizerState.HexaemicalCharacterReferenceStartState);
    } else {
      this.reconsumeInState(TokenizerState.DecimalCharacterReferenceStartState);
    }
  }

  private [TokenizerState.HexaemicalCharacterReferenceStartState](
    codePoint: number
  ) {
    if (utils.isAsciiDigit(codePoint)) {
      this.reconsumeInState(TokenizerState.DecimalCharacterReferenceState);
    } else {
      // TODO
      // this._err(ERR.absenceOfDigitsInNumericCharacterReference);
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

  private [TokenizerState.HexademicalCharacterReferenceState](
    codePoint: number
  ) {
    // TODO
    if (utils.isAsciiUpperHexDigit(codePoint)) {
      this.charRefCode = this.charRefCode * 16 + codePoint - 0x37;
    } else if (utils.isAsciiLowerHexDigit(codePoint)) {
      this.charRefCode = this.charRefCode * 16 + codePoint - 0x57;
    } else if (utils.isAsciiDigit(codePoint)) {
      this.charRefCode = this.charRefCode * 16 + codePoint - 0x30;
    } else if (codePoint === CODE_POINTS.SEMICOLON) {
      this.state = TokenizerState.NumericCharacterReferenceEndState;
    } else {
      // TODO error
      this.reconsumeInState(TokenizerState.NumericCharacterReferenceEndState);
    }
  }

  private [TokenizerState.DecimalCharacterReferenceState](codePoint: number) {
    if (utils.isAsciiDigit(codePoint)) {
      this.charRefCode = this.charRefCode * 10 + codePoint - 0x30;
    } else if (codePoint === CODE_POINTS.SEMICOLON) {
      this.switchStateTo(TokenizerState.NumericCharacterReferenceEndState);
    } else {
      // TODO: error
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
      // TODO: error
      this.charRefCode = CODE_POINTS.REPLACEMENT_CHARACTER;
    } else if (this.charRefCode > 0x10ffff) {
      // TODO: error
      this.charRefCode = CODE_POINTS.REPLACEMENT_CHARACTER;
    } else if (utils.isSurrogate(this.charRefCode)) {
      // TODO: error
      this.charRefCode = CODE_POINTS.REPLACEMENT_CHARACTER;
    } else if (
      utils.isUndefinedCodePoint(codePoint) ||
      this.charRefCode === CODE_POINTS.CARRIAGE_RETURN
    ) {
      // TODO error
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
