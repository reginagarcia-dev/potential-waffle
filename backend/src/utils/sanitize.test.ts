import { describe, expect, it } from "vitest";
import { sanitizeText, sanitizeOptionalText } from "./sanitize.js";

describe("sanitizeText", () => {
  it("preserves benign text containing comparison-style angle brackets", () => {
    expect(sanitizeText("Bench  225 for 5")).toBe("Bench  225 for 5");
    expect(sanitizeText("Bench < 225 for 5")).toBe("Bench  225 for 5");
  });

  it("does not delete content that looks like a tag", () => {
    // A parser-based sanitizer treats "<b>" as a real tag and drops it along
    // with everything inside — this must preserve every character except the
    // angle brackets themselves.
    expect(sanitizeText("a<b>c")).toBe("abc");
  });

  it("never leaves stored HTML entities behind", () => {
    const result = sanitizeText("Push/Pull <> split");
    expect(result).not.toContain("&lt;");
    expect(result).not.toContain("&gt;");
  });

  it("strips angle brackets so no tag can ever be reconstructed", () => {
    const result = sanitizeText("<script>alert(1)</script>Legs Day");
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeText("  Leg Day  ")).toBe("Leg Day");
  });
});

describe("sanitizeOptionalText", () => {
  it("returns null for non-string input", () => {
    expect(sanitizeOptionalText(null)).toBeNull();
    expect(sanitizeOptionalText(undefined)).toBeNull();
    expect(sanitizeOptionalText(42)).toBeNull();
  });

  it("returns null when sanitizing leaves nothing but whitespace", () => {
    expect(sanitizeOptionalText("   ")).toBeNull();
    expect(sanitizeOptionalText("<>")).toBeNull();
  });

  it("returns the sanitized string when non-empty", () => {
    expect(sanitizeOptionalText("  Felt strong today  ")).toBe(
      "Felt strong today",
    );
  });
});
