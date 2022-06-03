# sa-html-parser

[![codecov](https://codecov.io/gh/yeonjuan/sa-html-parser/branch/main/graph/badge.svg?token=ZCVMF7K8Y9)](https://codecov.io/gh/yeonjuan/sa-html-parser)

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
import { parse } from "sa-html-parser";

const root = parse("<html><body><div id='foo'></div></bod></html>");

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
