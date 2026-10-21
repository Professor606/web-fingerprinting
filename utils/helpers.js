// ─── Helper ───────────────────────────────────────────────────────────────────

function create4DigitId(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash) % 10000;
}

const MAX_URL_LENGTH = 2048;

// Validates a redirect URL. Empty string is valid and means "no redirect".
// Only http/https is accepted so values like javascript: can never be stored.
function normalizeRedirectUrl(input) {
  if (input === undefined || input === null) return { ok: true, url: "" };
  if (typeof input !== "string") return { ok: false, error: "URL must be a string" };

  const value = input.trim();
  if (!value) return { ok: true, url: "" };
  if (value.length > MAX_URL_LENGTH) return { ok: false, error: "URL is too long" };

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "URL must start with http:// or https://" };
  }
  return { ok: true, url: parsed.href };
}

module.exports = {
  create4DigitId,
  normalizeRedirectUrl,
};
