"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { TemplateId } from "@/lib/useCredits";

export type LetterTone = "professional" | "friendly" | "bold";

interface Props {
  letterText: string;
  tone?: LetterTone;
  template?: TemplateId;
}

// ---------------------------------------------------------------------------
// Parse the AI-generated letter to extract header block
// ---------------------------------------------------------------------------
interface ParsedLetter {
  salutation: string;
  bodyParagraphs: string[];
  signoff: string;
  signature: string;
}

function parseLetter(raw: string): ParsedLetter {
  const lines = raw.split("\n").map((l) => l.trimEnd());

  // Find where "Dear" starts — that's the salutation
  let salutationIdx = -1;
  let signoffIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (salutationIdx === -1 && /^dear\s+/i.test(line)) {
      salutationIdx = i;
    }
    if (
      signoffIdx === -1 &&
      /^(sincerely|regards|best regards|yours (sincerely|faithfully)|respectfully|warm regards|best),?\s*$/i.test(
        line
      )
    ) {
      signoffIdx = i;
    }
  }

  const salutation =
    salutationIdx >= 0 ? lines[salutationIdx].trim() : "Dear Hiring Manager,";

  const bodyStart = salutationIdx >= 0 ? salutationIdx + 1 : 0;
  const bodyEnd = signoffIdx > -1 ? signoffIdx : lines.length;

  // Join body, split by blank lines into paragraphs
  const bodyText = lines.slice(bodyStart, bodyEnd).join("\n").trim();
  const bodyParagraphs = bodyText
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n+/g, " ").trim())
    .filter((p) => p.length > 0);

  const signoff =
    signoffIdx >= 0 ? lines[signoffIdx].trim() : "Sincerely,";
  const signature =
    signoffIdx >= 0
      ? lines
          .slice(signoffIdx + 1)
          .filter((l) => l.trim().length > 0)
          .slice(0, 3)
          .join("\n")
          .trim()
      : "";

  return { salutation, bodyParagraphs, signoff, signature };
}

// ---------------------------------------------------------------------------
// CLASSIC — Serif, traditional letter format
// ---------------------------------------------------------------------------
const classicStyles = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 64,
    fontSize: 11,
    fontFamily: "Times-Roman",
    color: "#1a1a1a",
    lineHeight: 1.6,
  },
  date: {
    fontSize: 10,
    color: "#666",
    marginBottom: 24,
  },
  salutation: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 11,
    marginBottom: 14,
    textAlign: "justify",
  },
  signoff: {
    fontSize: 11,
    marginTop: 20,
    marginBottom: 4,
  },
  signature: {
    fontSize: 11,
    fontFamily: "Times-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 7,
    color: "#999",
  },
});

// ---------------------------------------------------------------------------
// MODERN — Sans-serif, colored header rule
// ---------------------------------------------------------------------------
const modernStyles = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 64,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
    lineHeight: 1.65,
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: "#2563EB",
  },
  date: {
    fontSize: 10,
    color: "#64748B",
    marginBottom: 24,
  },
  salutation: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#2563EB",
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 11,
    marginBottom: 14,
    textAlign: "justify",
    color: "#1F2937",
  },
  signoff: {
    fontSize: 11,
    marginTop: 22,
    marginBottom: 4,
    color: "#334155",
  },
  signature: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#2563EB",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 7,
    color: "#999",
  },
});

// ---------------------------------------------------------------------------
// MINIMAL — Clean, spacious
// ---------------------------------------------------------------------------
const minimalStyles = StyleSheet.create({
  page: {
    paddingTop: 72,
    paddingBottom: 72,
    paddingHorizontal: 72,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#111",
    lineHeight: 1.75,
  },
  date: {
    fontSize: 9,
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 32,
    textTransform: "uppercase",
  },
  salutation: {
    fontSize: 11,
    marginBottom: 20,
    color: "#1F2937",
  },
  paragraph: {
    fontSize: 11,
    marginBottom: 16,
    textAlign: "justify",
    color: "#334155",
  },
  signoff: {
    fontSize: 11,
    marginTop: 28,
    marginBottom: 6,
    color: "#334155",
  },
  signature: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 7,
    color: "#ccc",
  },
});

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export function CoverLetterDocument({
  letterText,
  tone = "professional",
  template = "classic",
}: Props) {
  const parsed = parseLetter(letterText);
  const today = new Date().toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const footerText = "Built with CVPro · Made by PrimeWeb Designs";

  // ---- MODERN ----
  if (template === "modern") {
    return (
      <Document>
        <Page size="A4" style={modernStyles.page}>
          <View style={modernStyles.accentBar} />
          <Text style={modernStyles.date}>{today}</Text>

          <Text style={modernStyles.salutation}>{parsed.salutation}</Text>

          {parsed.bodyParagraphs.map((p, i) => (
            <Text key={i} style={modernStyles.paragraph}>
              {p}
            </Text>
          ))}

          <Text style={modernStyles.signoff}>{parsed.signoff}</Text>
          {parsed.signature && (
            <Text style={modernStyles.signature}>{parsed.signature}</Text>
          )}

          <Text style={modernStyles.footer} fixed>
            {footerText}
          </Text>
        </Page>
      </Document>
    );
  }

  // ---- MINIMAL ----
  if (template === "minimal") {
    return (
      <Document>
        <Page size="A4" style={minimalStyles.page}>
          <Text style={minimalStyles.date}>{today}</Text>

          <Text style={minimalStyles.salutation}>{parsed.salutation}</Text>

          {parsed.bodyParagraphs.map((p, i) => (
            <Text key={i} style={minimalStyles.paragraph}>
              {p}
            </Text>
          ))}

          <Text style={minimalStyles.signoff}>{parsed.signoff}</Text>
          {parsed.signature && (
            <Text style={minimalStyles.signature}>{parsed.signature}</Text>
          )}

          <Text style={minimalStyles.footer} fixed>
            {footerText}
          </Text>
        </Page>
      </Document>
    );
  }

  // ---- CLASSIC (default) ----
  return (
    <Document>
      <Page size="A4" style={classicStyles.page}>
        <Text style={classicStyles.date}>{today}</Text>

        <Text style={classicStyles.salutation}>{parsed.salutation}</Text>

        {parsed.bodyParagraphs.map((p, i) => (
          <Text key={i} style={classicStyles.paragraph}>
            {p}
          </Text>
        ))}

        <Text style={classicStyles.signoff}>{parsed.signoff}</Text>
        {parsed.signature && (
          <Text style={classicStyles.signature}>{parsed.signature}</Text>
        )}

        <Text style={classicStyles.footer} fixed>
          {footerText}
        </Text>
      </Page>
    </Document>
  );
}
