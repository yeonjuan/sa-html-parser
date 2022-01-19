import React, { FC } from "react";

const CompactObjectView: FC<{
  keys: string[];
  onClick: (e: React.MouseEvent) => void;
}> = ({ keys, onClick }) => {
  if (keys.length === 0) {
    return <span className="p">{"{ }"}</span>;
  } else {
    if (keys.length > 5) {
      keys = keys.slice(0, 5).concat([`... +${keys.length - 5}`]);
    }
    return (
      <span>
        <span className="p">{"{"}</span>
        <span className="compact placeholder ge" onClick={onClick}>
          {keys.join(", ")}
        </span>
        <span className="p">{"}"}</span>
      </span>
    );
  }
};

export default CompactObjectView;
