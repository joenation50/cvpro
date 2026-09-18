"use client";

/**
 * Extract plain text from uploaded files: PDF, DOCX, TXT.
 * All processing happens in the browser — no server, no upload, no cost.
 */

export type ExtractResult = {
  text: string;
  filename: string;
  error?: string;
};

// ---------------------------------------------------------------------------
// PDF extraction using pdfjs-dist
// ---------------------------------------------------------------------------
async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");

  // Use a CDN-hosted worker so we don't have to bundle it
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    fullText += pageText + "\n\n";
  }

  return fullText.trim();
}

// ---------------------------------------------------------------------------
// DOCX extraction using mammoth
// ---------------------------------------------------------------------------
async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

// ---------------------------------------------------------------------------
// TXT extraction (native)
// ---------------------------------------------------------------------------
async function extractTxt(file: File): Promise<string> {
  return await file.text();
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------
export async function extractTextFromFile(file: File): Promise<ExtractResult> {
  const name = file.name;
  const ext = name.split(".").pop()?.toLowerCase() || "";

  try {
    let text = "";

    if (ext === "pdf") {
      text = await extractPdf(file);
    } else if (ext === "docx") {
      text = await extractDocx(file);
    } else if (ext === "txt") {
      text = await extractTxt(file);
    } else if (ext === "doc") {
      return {
        text: "",
        filename: name,
        error:
          "Old .doc files aren't supported. Please save as .docx or .pdf and try again.",
      };
    } else {
      return {
        text: "",
        filename: name,
        error: `Unsupported file type (.${ext}). Use PDF, DOCX, or TXT.`,
      };
    }

    if (!text || text.length < 20) {
      return {
        text: "",
        filename: name,
        error:
          "We couldn't read any text from that file. It might be a scanned image PDF. Try copying the text manually.",
      };
    }

    // Clean up extra whitespace
    text = text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim();

    // Cap at 15,000 chars (matches API limit)
    if (text.length > 15000) {
      text = text.slice(0, 15000);
    }

    return { text, filename: name };
  } catch (err: any) {
    return {
      text: "",
      filename: name,
      error:
        err?.message ||
        "Could not read that file. Try a different file or paste the text manually.",
    };
  }
}
