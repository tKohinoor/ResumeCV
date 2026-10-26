const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const URL_RE = /\b(?:https?:\/\/|www\.)\S+|\b(?:linkedin|github|gitlab|behance|medium)\.com\/\S*/gi;
const PHONE_CANDIDATE = /\+?\d[\d\s().-]{8,16}\d/g;
const PIN = /\b\d{6}\b|\b\d{5}(?:-\d{4})?\b(?=\s*$)/gm;
const ADDRESS_LINE =
  /\b(street|st\.|road|rd\.|avenue|ave\.|lane|nagar|colony|sector|block|apartment|apt\.?|flat|house no|plot)\b/i;

export function redactLine(line: string): string {
  if (ADDRESS_LINE.test(line) && /\d/.test(line)) return "[ADDRESS]";
  return line
    .replace(EMAIL, "[EMAIL]")
    .replace(URL_RE, "[LINK]")
    .replace(PHONE_CANDIDATE, (m) => {
      const digits = m.replace(/\D/g, "").length;
      return digits >= 10 && digits <= 13 ? "[PHONE]" : m;
    })
    .replace(PIN, "[PIN]");
}

export function redact(text: string): string {
  const lines = text.split("\n");
  const first = lines.findIndex((l) => l.trim());
  if (first !== -1) {
    const l = lines[first].trim();
    if (l.split(/\s+/).length <= 5 && !/[\d@]/.test(l)) lines[first] = "[NAME]";
  }
  return lines.map(redactLine).join("\n");
}