export const sanitizeString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString();
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  const disallowedChars = /[<>`"'%;(){}|]/;

  const cleaned = Array.from(trimmed)
    .filter((char) => {
      const code = char.charCodeAt(0);
      if (code < 32 || code === 127) {
        return false;
      }
      return !disallowedChars.test(char);
    })
    .join('')
    .replace(/\s{2,}/g, ' ');

  return cleaned;
};

export const sanitizeLowercaseString = (value: unknown): string | undefined => {
  const sanitized = sanitizeString(value);
  return sanitized ? sanitized.toLowerCase() : undefined;
};
