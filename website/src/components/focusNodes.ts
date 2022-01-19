// https://github.com/fkling/astexplorer/blob/master/website/src/components/visualization/focusNodes.js
let nodes;

export default function (message: string, arg?: any) {
  switch (message) {
    case "init":
      nodes = new Set();
      break;
    case "add":
      nodes.add(arg);
      break;
    case "focus": {
      const root = arg.current;
      const size = nodes.size;
      try {
        if (size === 1) {
          nodes.values().next().value.current.scrollIntoView();
        } else if (size > 1) {
          const rootRect = root.getBoundingClientRect();
          const center = (rootRect.y + rootRect.height) / 2 + rootRect.y;
          const closest: any = Array.from(nodes).reduce(
            (closest: any, element: any) => {
              if (!element.current) {
                return closest;
              }
              const elementRect = element.current.getBoundingClientRect();
              const distance = elementRect.y - center;
              const minDistance = Math.min(
                Math.abs(distance),
                Math.abs(distance + elementRect.height)
              );

              if (!closest || closest[1] > minDistance) {
                return [element.current, minDistance];
              }
              return closest;
            },
            null
          );
          if (closest) {
            closest[0].scrollIntoView();
          }
        }
      } catch (e: any) {
        console.error("Unable to scroll node into view:", e.message);
      }
    }
  }
}
