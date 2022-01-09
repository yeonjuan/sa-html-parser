// import { Range, Position, SourceCodeLocation } from "../common/types";
// import { TokenType, TokenAPI } from "./types";

// class BaseToken<T extends TokenType> implements TokenAPI<T> {
//   loc: SourceCodeLocation;
//   range: Range;
//   constructor(
//     public type: T,
//     public value: string,
//     pos: Position,
//     index: number
//   ) {
//     const len = value.length;
//     this.loc = {
//       start: pos,
//       end: {
//         column: pos.column + len,
//         line: pos.line,
//       },
//     };
//     this.range = [index, index + len];
//   }
// }

// export class TagNameToken extends BaseToken<TokenType.TagName> {
//   constructor(value: string, pos: Position, index: number) {
//     super(TokenType.TagName, value, pos, index);
//   }
// }

// export class AttrNameToken extends BaseToken<TokenType.AttrName> {
//   constructor(value: string, pos: Position, index: number) {
//     super(TokenType.AttrName, value, pos, index);
//   }
// }

// export class AttrValueToken extends BaseToken<TokenType.AttrValue> {
//   constructor(value: string, pos: Position, index: number) {
//     super(TokenType.AttrValue, value, pos, index);
//   }
// }

// export class PunctuatorToken extends BaseToken<TokenType.Punctuator> {
//   constructor(value: string, pos: Position, index: number) {
//     super(TokenType.Punctuator, value, pos, index);
//   }
// }

// export class CharactersToken extends BaseToken<TokenType.Characters> {
//   constructor(value: string, pos: Position, index: number) {
//     super(TokenType.Characters, value, pos, index);
//   }
// }

// export class WhiteSpacesToken extends BaseToken<TokenType.WhiteSpaces> {
//   constructor(value: string, pos: Position, index: number) {
//     super(TokenType.WhiteSpaces, value, pos, index);
//   }
// }

// export class NullCharacterToken extends BaseToken<TokenType.NullCharacter> {
//   constructor(value: string, pos: Position, index: number) {
//     super(TokenType.NullCharacter, value, pos, index);
//   }
// }
