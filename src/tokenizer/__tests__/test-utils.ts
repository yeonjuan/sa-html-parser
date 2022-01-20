import { HtmlTokenType } from "../../tokens";
import { Tokenizer } from "../tokenizer";
import { AtomTokenType } from "../../tokens";
import { Position } from "../../common/types";

export const testHtmlTokenizer = (
  description: string,
  testCase: [
    string,
    HtmlTokenType[],
    { line: number; column: number; error: string; index: number }[]?
  ]
) => {
  const [input, types, errors = []] = testCase;
  test(description, () => {
    const tokenizer = Tokenizer.create(input);
    types.forEach((type) => {
      const token = tokenizer.getNextToken();
      expect(token?.type).toBe(type);
    });
    if (errors?.length) {
      expect(tokenizer.errors).toMatchObject(errors);
    }
  });
};

export const testTokensLocations = (
  description: string,
  testCase: [string, [AtomTokenType, string, number[], Position, Position][]]
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
      expect(atomTokens[index]?.start).toBe(range[0]);
      expect(atomTokens[index]?.end).toBe(range[1]);
    });
  });
};
