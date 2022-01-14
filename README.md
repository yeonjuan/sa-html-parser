# sa-html-parser

`sa-html-parser` is a parser designed for HTML code static analysis.

## Install

- npm

  ```
  yarn add sa-html-parser
  ```

- yarn

  ```
  npm install sa-html-parser
  ```

## Usage

```js
import { Parser } from "es-html-parser";

const parser = new Parser();
const root = parser.parse("<html><body><div id='foo'></div></bod></html>");

root;
// {
//    type: "Root",
//    children: [ ... ],
//    start: 0,
//    end: 45,
//    ...
// }
//
```

## License

- [MIT](./LICENSE)
