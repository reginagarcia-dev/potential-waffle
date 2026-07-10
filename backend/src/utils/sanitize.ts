// These fields are always rendered as plain text on the frontend (React
// escapes on output; nothing reads them via dangerouslySetInnerHTML), so the
// only thing that needs stripping is the characters that could ever give
// stored text HTML meaning to some other consumer down the line. A full
// HTML-parsing sanitizer is the wrong tool here: it treats a benign string
// like "bench < 225 for 5" or "a<b>c" as containing a tag and silently
// deletes the "225 for 5" / "b" inside it. Removing '<' and '>' outright
// prevents anything from ever being interpreted as a tag, without parsing
// (and potentially eating) the surrounding text.
export function sanitizeText(value: string): string {
  return value.replace(/[<>]/g, "").trim();
}

export function sanitizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const sanitized = sanitizeText(value);
  return sanitized.length > 0 ? sanitized : null;
}
