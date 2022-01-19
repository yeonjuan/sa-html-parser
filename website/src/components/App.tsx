import React, { useState } from "react";
import Header from "./Header";
import SplitPanel from "./SplitPane";
import Editor from "./Editor";
import Ast from "./Ast";
import Footer from "./Footer";
import { parse } from "sa-html-parser";

const DEFAULT_VALUE = `
<!DOCTYPE html>
<html>

<body>
    <h1>My First Heading</h1>
    <p>My first paragraph.</p>
</body>

</html>
`.trim();

const App = () => {
  const [html, setHtml] = useState(DEFAULT_VALUE);
  const ast = parse(html);
  const parseResult = {
    ast,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header />
      <SplitPanel>
        <Editor value={html} onChange={setHtml} />
        <Ast parseResult={parseResult} />
      </SplitPanel>
      <Footer />
    </div>
  );
};

export default App;
