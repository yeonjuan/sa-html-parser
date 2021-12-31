import { HtmlTokenType } from "../../token-html";
import { Tokenizer } from "../tokenizer";
import { TokenType } from "../../token";
import { Position } from "../../source-code-location";

export const testHtmlTokenizer = (
  description: string,
  testCase: [string, HtmlTokenType[]]
) => {
  const [input, types] = testCase;
  test(description, () => {
    const tokenizer = Tokenizer.create(input);
    types.forEach((type) => {
      const token = tokenizer.getNextToken();
      expect(token?.type).toBe(type);
    });
  });
};

export const testTokensLocations = (
  description: string,
  testCase: [string, [TokenType, string, number[], Position, Position][]]
) => {
  test(description, () => {
    const [input, tokens] = testCase;
    const tokenizer = Tokenizer.create(input);
    const atomTokens: any[] = [];
    while (true) {
      let token = tokenizer.getNextToken();
      if (token?.type === HtmlTokenType.EOF) {
        break;
      }
      atomTokens.push(...(token!.tokenize() || []));
    }
    tokens.forEach(([type, value, range, start, end], index) => {
      expect(atomTokens[index]?.type).toBe(type);
      expect(atomTokens[index]?.value).toBe(value);
      expect(atomTokens[index]?.range).toStrictEqual(range);
      expect(atomTokens[index]?.loc.start).toStrictEqual(start);
      expect(atomTokens[index]?.loc.end).toStrictEqual(end);
    });
  });
};
