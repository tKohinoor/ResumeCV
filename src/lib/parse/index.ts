import { extractText } from "./extract";
import { detectSections, extractBullets, detectContact, type Sections, type Contact } from "./sections";
import { redact } from "./redact";

export type ParsedResume = {
  fileName: string;
  rawText: string;       // stays in the browser, used by the rule engine
  redactedText: string;  // the only version that is ever sent to Gemini
  sections: Sections;
  bullets: string[];
  contact: Contact;
  wordCount: number;
  pageCount: number | null;
};

export async function parseResume(file: File): Promise<ParsedResume> {
  const { text, pageCount } = await extractText(file);
  const rawText = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  const wordCount = rawText ? rawText.split(/\s+/).length : 0;

  if (wordCount < 50) {
    throw new Error(
      "We couldn't read enough text from this file. It may be a scanned image. Please upload a text-based PDF or a DOCX."
    );
  }

  const sections = detectSections(rawText);
  const bullets = extractBullets([...sections.experience, ...sections.projects]);

  return {
    fileName: file.name,
    rawText,
    redactedText: redact(rawText),
    sections,
    bullets,
    contact: detectContact(rawText),
    wordCount,
    pageCount,
  };
}