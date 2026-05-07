import { Folder } from "remotion";
import { registerRoot } from "remotion";
import compositions from "./compositions";

const componentEntries = Object.entries(compositions);

const Root: React.FC = () => {
  return (
    <Folder name="Generated">
      {componentEntries.map(([name, Component]) => (
        <Component key={name} />
      ))}
    </Folder>
  );
};

registerRoot(Root);
