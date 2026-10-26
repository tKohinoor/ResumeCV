export type Extracted = { text: string; pageCount: number | null };

export async function extractText(file: File): Promise<Extracted> {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const buffer = await file.arrayBuffer();
  if (ext === ".pdf") return extractPdf(buffer);
  if (ext === ".docx") return extractDocx(buffer);
  throw new Error("Unsupported file type.");
}

async function extractPdf(buffer: ArrayBuffer): Promise<Extracted> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    let out = "";
    let lastY: number | null = null;
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) out += "\n";
      else if (out && !out.endsWith(" ") && !out.endsWith("\n")) out += " ";
      out += item.str;
      lastY = y;
    }
    pages.push(out);
  }
  return { text: pages.join("\n"), pageCount: pdf.numPages };
}

async function extractDocx(buffer: ArrayBuffer): Promise<Extracted> {
  const mammoth = await import("mammoth/mammoth.browser");
  // HTML keeps list items, so Word bullets survive as "• " lines.
  const { value } = await mammoth.convertToHtml({ arrayBuffer: buffer });
  const text = value
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|tr|ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
  return { text, pageCount: null };
}