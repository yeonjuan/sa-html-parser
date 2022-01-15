import React, { FC } from "react";
import MonacoEditor from "react-monaco-editor";

const Editor: FC<{
  value: string;
  onChange?: (value: string) => void;
}> = (props) => {
  return (
    <div style={{ padding: "5px", width: "100%" }}>
      <MonacoEditor
        value={props.value}
        onChange={props.onChange}
        language="html"
        options={{ automaticLayout: true }}
      />
    </div>
  );
};

export default Editor;
