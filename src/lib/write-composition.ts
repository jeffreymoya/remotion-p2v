import fs from "node:fs";
import path from "node:path";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateCompositionCode(code: string): void {
  if (!code || code.trim().length === 0) {
    throw new ValidationError("Generated code is empty");
  }

  const hasExport =
    code.includes("export default") || code.includes("export {");
  if (!hasExport) {
    throw new ValidationError(
      "Generated code does not contain a React component export (export default or export {})",
    );
  }
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function extractComponentName(code: string, filename: string): string {
  const exportDefaultMatch = code.match(
    /export\s+default\s+(?:function|const|class)\s+(\w+)/,
  );
  if (exportDefaultMatch) {
    return exportDefaultMatch[1];
  }

  const exportConstMatch = code.match(
    /export\s*{\s*(?:(\w+)\s+as\s+default|default\s+as\s+(\w+))\s*}/,
  );
  if (exportConstMatch) {
    return exportConstMatch[1] || exportConstMatch[2];
  }

  return toPascalCase(path.basename(filename, ".tsx"));
}

export function writeComposition(
  code: string,
  title: string,
  compositionsDir: string,
): { filePath: string; componentName: string } {
  validateCompositionCode(code);

  const cleaned = code.replace(/^\/\/\s*@ts-nocheck\s*\n?/i, "");
  const content = `// @ts-nocheck\n${cleaned}`;

  const kebab = toKebabCase(title);
  const filename = `${kebab}.tsx`;
  const filePath = path.join(compositionsDir, filename);

  if (!fs.existsSync(compositionsDir)) {
    fs.mkdirSync(compositionsDir, { recursive: true });
  }

  fs.writeFileSync(filePath, content, "utf-8");

  const componentName = extractComponentName(content, filename);

  return { filePath, componentName };
}

export function regenerateBarrel(
  compositionsDir: string,
  barrelPath: string,
): void {
  const files = fs
    .readdirSync(compositionsDir)
    .filter((f) => f.endsWith(".tsx") && f !== "index.ts" && f !== "index.tsx");

  const imports: string[] = [];
  const exports: string[] = [];

  for (const file of files) {
    const content = fs.readFileSync(
      path.join(compositionsDir, file),
      "utf-8",
    );
    const name = extractComponentName(content, file);
    const modName = file.replace(/\.tsx?$/, "");
    imports.push(`import { default as ${name} } from "./${modName}";`);
    exports.push(`  ${name},`);
  }

  const barrel = `${imports.join("\n")}

export const compositions = {
${exports.join("\n")}
};

export default compositions;
`;

  const dir = path.dirname(barrelPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(barrelPath, barrel, "utf-8");
}
