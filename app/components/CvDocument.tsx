"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#000",
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#0047FF",
    paddingBottom: 10,
  },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#0047FF",
    marginBottom: 4,
  },
  contact: {
    fontSize: 9,
    color: "#555",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0047FF",
    marginTop: 14,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionBody: {
    fontSize: 10,
    color: "#111",
    marginBottom: 4,
  },
  bullet: {
    fontSize: 10,
    color: "#111",
    marginLeft: 8,
    marginBottom: 2,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 7,
    color: "#999",
  },
});

interface Props {
  cvText: string;
}

/**
 * Parses the AI-rewritten CV text and renders a clean PDF.
 * Handles common section headers: SUMMARY, EXPERIENCE, EDUCATION, SKILLS, etc.
 */
export function CvDocument({ cvText }: Props) {
  const lines = cvText.split("\n").map((l) => l.trim());

  // First 3 non-empty lines are treated as the header (name + contact info)
  const headerLines: string[] = [];
  const bodyLines: string[] = [];
  let headerDone = false;
  let headerCount = 0;

  for (const line of lines) {
    if (!headerDone && headerCount < 3 && line.length > 0) {
      headerLines.push(line);
      headerCount++;
      if (headerCount === 3) headerDone = true;
    } else {
      bodyLines.push(line);
    }
  }

  // Group body lines into sections
  type Section = { title: string; lines: string[] };
  const sections: Section[] = [];
  let current: Section | null = null;

  const SECTION_PATTERNS = [
    /^[A-Z][A-Z\s&/]{2,}$/, // ALL CAPS headers
    /^(professional\s+)?summary$/i,
    /^(work\s+)?experience$/i,
    /^education$/i,
    /^skills$/i,
    /^certifications?$/i,
    /^projects?$/i,
    /^languages?$/i,
    /^nysc$/i,
    /^awards?$/i,
    /^references?$/i,
  ];

  for (const line of bodyLines) {
    if (!line) {
      if (current) current.lines.push("");
      continue;
    }

    const isHeading = SECTION_PATTERNS.some((p) => p.test(line)) && line.length < 40;

    if (isHeading) {
      if (current) sections.push(current);
      current = { title: line.toUpperCase(), lines: [] };
    } else {
      if (!current) current = { title: "", lines: [] };
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {headerLines.map((line, i) => (
            <Text key={i} style={i === 0 ? styles.name : styles.contact}>
              {line}
            </Text>
          ))}
        </View>

        {/* Sections */}
        {sections.map((section, i) => (
          <View key={i}>
            {section.title ? (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            ) : null}
            {section.lines
              .filter((l) => l.length > 0)
              .map((line, j) => {
                const isBullet = /^[-•*]\s/.test(line);
                const clean = isBullet ? line.replace(/^[-•*]\s*/, "") : line;
                return (
                  <Text key={j} style={isBullet ? styles.bullet : styles.sectionBody}>
                    {isBullet ? `• ${clean}` : clean}
                  </Text>
                );
              })}
          </View>
        ))}

        <Text style={styles.footer} fixed>
          Built with CVPro · Made by PrimeWeb Designs
        </Text>
      </Page>
    </Document>
  );
}
