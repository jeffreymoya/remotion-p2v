/**
 * Prompt Template Manager
 *
 * Handles loading and rendering prompt templates with variable substitution.
 * Uses native template strings for simplicity and type safety.
 */

export type PromptVariables = Record<string, string | number | boolean | string[]>;

/**
 * Render a prompt template with variables
 *
 * @param template - Template string with ${variable} placeholders
 * @param variables - Key-value pairs for substitution
 * @returns Rendered prompt string
 */
export function renderPrompt(
  template: string | ((vars: PromptVariables) => string),
  variables: PromptVariables = {}
): string {
  // If template is a function, call it with variables
  if (typeof template === 'function') {
    return template(variables);
  }

  // Otherwise, use simple string replacement
  let rendered = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\$\\{${key}\\}`, 'g');

    // Handle arrays by joining with newlines or commas
    if (Array.isArray(value)) {
      rendered = rendered.replace(placeholder, value.join('\n'));
    } else {
      rendered = rendered.replace(placeholder, String(value));
    }
  }

  return rendered;
}

/**
 * Format an array of items as a numbered list
 */
export function formatList(items: string[], numbered: boolean = true): string {
  if (numbered) {
    return items.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
  }
  return items.map(item => `- ${item}`).join('\n');
}

/**
 * Format an object as key-value pairs
 */
export function formatKeyValue(obj: Record<string, any>, separator: string = ': '): string {
  return Object.entries(obj)
    .map(([key, value]) => `${key}${separator}${value}`)
    .join('\n');
}

/**
 * Create a section with a header
 */
export function section(header: string, content: string): string {
  return `${header}\n${content}`;
}

/**
 * Prompt template builder with fluent API
 */
export class PromptBuilder {
  private parts: string[] = [];

  constructor(initialText?: string) {
    if (initialText) {
      this.parts.push(initialText);
    }
  }

  add(text: string): this {
    this.parts.push(text);
    return this;
  }

  addSection(header: string, content: string): this {
    this.parts.push(section(header, content));
    return this;
  }

  addList(items: string[], numbered: boolean = true): this {
    this.parts.push(formatList(items, numbered));
    return this;
  }

  addKeyValue(obj: Record<string, any>, separator: string = ': '): this {
    this.parts.push(formatKeyValue(obj, separator));
    return this;
  }

  addBlankLine(): this {
    this.parts.push('');
    return this;
  }

  build(): string {
    return this.parts.join('\n\n');
  }
}

/**
 * Create a new prompt builder
 */
export function createPrompt(initialText?: string): PromptBuilder {
  return new PromptBuilder(initialText);
}
