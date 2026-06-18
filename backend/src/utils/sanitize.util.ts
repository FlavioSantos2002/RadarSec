import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

export function sanitizeText(input: string | null | undefined): string | null {
  if (input === null || input === undefined) return null;
  return sanitizeHtml(input, SANITIZE_OPTIONS).trim();
}

export function sanitizeRequiredText(input: string): string {
  return sanitizeHtml(input, SANITIZE_OPTIONS).trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  textFields: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of textFields) {
    const value = result[field];
    if (typeof value === 'string') {
      (result[field] as unknown) = sanitizeRequiredText(value);
    } else if (value === null || value === undefined) {
      (result[field] as unknown) = value;
    }
  }
  return result;
}
