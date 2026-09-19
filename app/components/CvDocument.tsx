"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

export type TemplateId =
  | "classic"
  | "minimal"
  | "modern"
  | "executive"
  | "creative"
  | "corporate"
  | "academic"
  | "japa"
  | "tech";

interface Props {
  cvText: string;
  template?: TemplateId;
}

// ---------------------------------------------------------------------------
// Parser: turns raw CV text into structured sections
// ---------------------------------------------------------------------------
interface ParsedCv {
  name: string;
  contact: string[];
  sections: { title: string; lines: string[] }[];
}

function parseCv(raw: string): ParsedCv {
  const lines = raw.split("\n").map((l) => l.trim());

  const header: string[] = [];
  const body: string[] = [];
  let headerDone = false;
  let headerCount = 0;

  for (const line of lines) {
    if (!headerDone && headerCount < 3 && line.length > 0) {
      header.push(line);
      headerCount++;
      if (headerCount === 3) headerDone = true;
    } else {
      body.push(line);
    }
  }

  const SECTION_PATTERNS = [
    /^[A-Z][A-Z\s&/]{2,}$/,
    /^(professional\s+)?summary$/i,
    /^(work\s+)?experience$/i,
    /^employment(\s+history)?$/i,
    /^education$/i,
    /^skills$/i,
    /^(technical\s+)?skills$/i,
    /^certifications?$/i,
    /^licenses?$/i,
    /^projects?$/i,
    /^languages?$/i,
    /^nysc$/i,
    /^awards?$/i,
    /^references?$/i,
    /^career\s+objective$/i,
    /^profile$/i,
    /^publications?$/i,
    /^research$/i,
    /^interests?$/i,
  ];

  const sections: { title: string; lines: string[] }[] = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of body) {
    if (!line) {
      if (current) current.lines.push("");
      continue;
    }
    const isHeading =
      SECTION_PATTERNS.some((p) => p.test(line)) && line.length < 40;

    if (isHeading) {
      if (current) sections.push(current);
      current = { title: line.toUpperCase(), lines: [] };
    } else {
      if (!current) current = { title: "", lines: [] };
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  return {
    name: header[0] || "Your Name",
    contact: header.slice(1),
    sections,
  };
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
function renderSectionLines(
  lines: string[],
  textStyle: any,
  bulletStyle: any,
  bulletChar = "•"
) {
  return lines
    .filter((l) => l.length > 0)
    .map((line, j) => {
      const isBullet = /^[-•*]\s/.test(line);
      const clean = isBullet ? line.replace(/^[-•*]\s*/, "") : line;
      return (
        <Text key={j} style={isBullet ? bulletStyle : textStyle}>
          {isBullet ? `${bulletChar}  ${clean}` : clean}
        </Text>
      );
    });
}

const FOOTER_TEXT = "Built with CVPro · Made by PrimeWeb Designs";

// ===========================================================================
// 1. CLASSIC (FREE) — Traditional serif, single-column, navy
// ===========================================================================
const classicStyles = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 48, paddingHorizontal: 48, fontSize: 10, fontFamily: "Times-Roman", color: "#1a1a1a", lineHeight: 1.45 },
  name: { fontSize: 22, fontFamily: "Times-Bold", textAlign: "center", color: "#0a2540", letterSpacing: 1, textTransform: "uppercase" },
  contact: { fontSize: 9, textAlign: "center", color: "#555", marginTop: 4 },
  divider: { borderBottomWidth: 1.5, borderBottomColor: "#0a2540", marginTop: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontFamily: "Times-Bold", color: "#0a2540", textTransform: "uppercase", letterSpacing: 1.2, marginTop: 12, marginBottom: 4, borderBottomWidth: 0.5, borderBottomColor: "#0a2540", paddingBottom: 2 },
  text: { fontSize: 10, marginBottom: 2 },
  bullet: { fontSize: 10, marginLeft: 12, marginBottom: 2 },
  footer: { position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 7, color: "#999" },
});

// ===========================================================================
// 2. MINIMAL (FREE) — Clean sans, thin lines, whitespace
// ===========================================================================
const minimalStyles = StyleSheet.create({
  page: { paddingTop: 60, paddingBottom: 50, paddingHorizontal: 55, fontSize: 10, fontFamily: "Helvetica", color: "#111", lineHeight: 1.6 },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#000", letterSpacing: 2 },
  contact: { fontSize: 8.5, color: "#777", marginTop: 3, letterSpacing: 0.3 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: "#ccc", marginTop: 14, marginBottom: 16 },
  sectionTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#888", textTransform: "uppercase", letterSpacing: 2, marginTop: 16, marginBottom: 6 },
  text: { fontSize: 10, marginBottom: 3 },
  bullet: { fontSize: 10, marginLeft: 10, marginBottom: 3 },
  footer: { position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 7, color: "#aaa" },
});

// ===========================================================================
// 3. MODERN (PAID ₦1,500) — Blue header bar, sans-serif
// ===========================================================================
const modernStyles = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 40, fontSize: 10, fontFamily: "Helvetica", color: "#222", lineHeight: 1.5 },
  headerBar: { backgroundColor: "#2563EB", paddingTop: 32, paddingBottom: 24, paddingHorizontal: 40, marginBottom: 20 },
  name: { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#fff", letterSpacing: 0.5 },
  contact: { fontSize: 9, color: "#DBEAFE", marginTop: 4 },
  body: { paddingHorizontal: 40 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#2563EB", textTransform: "uppercase", letterSpacing: 1, marginTop: 14, marginBottom: 4 },
  sectionLine: { borderBottomWidth: 2, borderBottomColor: "#2563EB", width: 24, marginBottom: 6 },
  text: { fontSize: 10, marginBottom: 2 },
  bullet: { fontSize: 10, marginLeft: 10, marginBottom: 2, color: "#333" },
  footer: { position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 7, color: "#999" },
});

// ===========================================================================
// 4. EXECUTIVE (PAID ₦1,500) — Two-column premium, gold accents
// ===========================================================================
const executiveStyles = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a", lineHeight: 1.5 },
  header: { backgroundColor: "#0F172A", paddingTop: 36, paddingBottom: 28, paddingHorizontal: 44, borderBottomWidth: 4, borderBottomColor: "#D4A24C" },
  name: { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#fff", letterSpacing: 0.5 },
  contact: { fontSize: 9, color: "#D4A24C", marginTop: 4, letterSpacing: 0.3 },
  body: { paddingHorizontal: 44, paddingTop: 20 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0F172A", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 14, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: "#D4A24C", paddingLeft: 8 },
  text: { fontSize: 10, marginBottom: 2, paddingLeft: 11 },
  bullet: { fontSize: 10, marginLeft: 20, marginBottom: 2, color: "#333" },
  footer: { position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 7, color: "#999" },
});

// ===========================================================================
// 5. CREATIVE (PREMIUM ₦2,500) — Purple gradient, bold visuals
// ===========================================================================
const creativeStyles = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a", lineHeight: 1.55 },
  header: { backgroundColor: "#7C3AED", paddingTop: 40, paddingBottom: 32, paddingHorizontal: 44 },
  name: { fontSize: 30, fontFamily: "Helvetica-Bold", color: "#fff", letterSpacing: -0.5 },
  contact: { fontSize: 9, color: "#E9D5FF", marginTop: 5, letterSpacing: 0.2 },
  body: { paddingHorizontal: 44, paddingTop: 24 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#7C3AED", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 16, marginBottom: 4 },
  sectionBar: { height: 3, backgroundColor: "#A78BFA", width: 40, marginBottom: 8 },
  text: { fontSize: 10, marginBottom: 3 },
  bullet: { fontSize: 10, marginLeft: 12, marginBottom: 3, color: "#333" },
  footer: { position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 7, color: "#999" },
});

// ===========================================================================
// 6. CORPORATE (PREMIUM ₦2,500) — Dense, structured, two-column feel
// ===========================================================================
const corporateStyles = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111", lineHeight: 1.4 },
  header: { backgroundColor: "#0A0A0F", paddingTop: 30, paddingBottom: 22, paddingHorizontal: 40 },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#fff", letterSpacing: 1 },
  contact: { fontSize: 8.5, color: "#94A3B8", marginTop: 4 },
  body: { paddingHorizontal: 40, paddingTop: 18 },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0A0A0F", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 12, marginBottom: 4, backgroundColor: "#F1F5F9", paddingVertical: 3, paddingHorizontal: 6 },
  text: { fontSize: 9.5, marginBottom: 2, paddingLeft: 6 },
  bullet: { fontSize: 9.5, marginLeft: 16, marginBottom: 2 },
  footer: { position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 7, color: "#999" },
});

// ===========================================================================
// 7. ACADEMIC (PREMIUM ₦2,500) — Serif, numbered sections, publications-ready
// ===========================================================================
const academicStyles = StyleSheet.create({
  page: { paddingTop: 50, paddingBottom: 50, paddingHorizontal: 55, fontSize: 10, fontFamily: "Times-Roman", color: "#000", lineHeight: 1.5 },
  name: { fontSize: 20, fontFamily: "Times-Bold", textAlign: "center", color: "#000" },
  contact: { fontSize: 9, textAlign: "center", color: "#333", marginTop: 4 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: "#000", marginTop: 12, marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontFamily: "Times-Bold", color: "#000", marginTop: 14, marginBottom: 4 },
  text: { fontSize: 10, marginBottom: 2 },
  bullet: { fontSize: 10, marginLeft: 20, marginBottom: 2 },
  footer: { position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 7, color: "#999" },
});

// ===========================================================================
// 8. JAPA (PREMIUM ₦2,500) — Western format, ATS-optimized
// ===========================================================================
const japaStyles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 40, paddingHorizontal: 50, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a", lineHeight: 1.45 },
  name: { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#0F172A", letterSpacing: 0.3 },
  contact: { fontSize: 9, color: "#555", marginTop: 4 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#0F172A", marginTop: 12, marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0F172A", textTransform: "uppercase", letterSpacing: 1.2, marginTop: 14, marginBottom: 5 },
  text: { fontSize: 10, marginBottom: 3 },
  bullet: { fontSize: 10, marginLeft: 12, marginBottom: 3 },
  footer: { position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 7, color: "#999" },
});

// ===========================================================================
// 9. TECH (PREMIUM ₦2,500) — Monospace accents, GitHub-inspired
// ===========================================================================
const techStyles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 40, paddingHorizontal: 45, fontSize: 10, fontFamily: "Helvetica", color: "#0F172A", lineHeight: 1.5 },
  header: { borderBottomWidth: 2, borderBottomColor: "#0EA5E9", paddingBottom: 14, marginBottom: 16 },
  name: { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#0F172A", letterSpacing: -0.3 },
  contact: { fontSize: 9, color: "#0EA5E9", marginTop: 4, fontFamily: "Courier" },
  sectionTitle: { fontSize: 11, fontFamily: "Courier-Bold", color: "#0EA5E9", marginTop: 14, marginBottom: 4 },
  sectionHash: { color: "#0EA5E9", fontFamily: "Courier-Bold", fontSize: 11 },
  text: { fontSize: 10, marginBottom: 3 },
  bullet: { fontSize: 10, marginLeft: 12, marginBottom: 3, color: "#334155" },
  footer: { position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 7, color: "#999" },
});

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export function CvDocument({ cvText, template = "classic" }: Props) {
  const cv = parseCv(cvText);

  // ============ CLASSIC ============
  if (template === "classic") {
    return (
      <Document>
        <Page size="A4" style={classicStyles.page}>
          <Text style={classicStyles.name}>{cv.name}</Text>
          {cv.contact.map((line, i) => (
            <Text key={i} style={classicStyles.contact}>{line}</Text>
          ))}
          <View style={classicStyles.divider} />
          {cv.sections.map((section, i) => (
            <View key={i}>
              {section.title ? <Text style={classicStyles.sectionTitle}>{section.title}</Text> : null}
              {renderSectionLines(section.lines, classicStyles.text, classicStyles.bullet)}
            </View>
          ))}
          <Text style={classicStyles.footer} fixed>{FOOTER_TEXT}</Text>
        </Page>
      </Document>
    );
  }

  // ============ MINIMAL ============
  if (template === "minimal") {
    return (
      <Document>
        <Page size="A4" style={minimalStyles.page}>
          <Text style={minimalStyles.name}>{cv.name}</Text>
          {cv.contact.map((line, i) => (
            <Text key={i} style={minimalStyles.contact}>{line}</Text>
          ))}
          <View style={minimalStyles.divider} />
          {cv.sections.map((section, i) => (
            <View key={i}>
              {section.title ? <Text style={minimalStyles.sectionTitle}>{section.title}</Text> : null}
              {renderSectionLines(section.lines, minimalStyles.text, minimalStyles.bullet, "–")}
            </View>
          ))}
          <Text style={minimalStyles.footer} fixed>{FOOTER_TEXT}</Text>
        </Page>
      </Document>
    );
  }

  // ============ MODERN ============
  if (template === "modern") {
    return (
      <Document>
        <Page size="A4" style={modernStyles.page}>
          <View style={modernStyles.headerBar}>
            <Text style={modernStyles.name}>{cv.name}</Text>
            {cv.contact.map((line, i) => (
              <Text key={i} style={modernStyles.contact}>{line}</Text>
            ))}
          </View>
          <View style={modernStyles.body}>
            {cv.sections.map((section, i) => (
              <View key={i}>
                {section.title ? (
                  <>
                    <Text style={modernStyles.sectionTitle}>{section.title}</Text>
                    <View style={modernStyles.sectionLine} />
                  </>
                ) : null}
                {renderSectionLines(section.lines, modernStyles.text, modernStyles.bullet)}
              </View>
            ))}
          </View>
          <Text style={modernStyles.footer} fixed>{FOOTER_TEXT}</Text>
        </Page>
      </Document>
    );
  }

  // ============ EXECUTIVE ============
  if (template === "executive") {
    return (
      <Document>
        <Page size="A4" style={executiveStyles.page}>
          <View style={executiveStyles.header}>
            <Text style={executiveStyles.name}>{cv.name}</Text>
            {cv.contact.map((line, i) => (
              <Text key={i} style={executiveStyles.contact}>{line}</Text>
            ))}
          </View>
          <View style={executiveStyles.body}>
            {cv.sections.map((section, i) => (
              <View key={i}>
                {section.title ? <Text style={executiveStyles.sectionTitle}>{section.title}</Text> : null}
                {renderSectionLines(section.lines, executiveStyles.text, executiveStyles.bullet, "▸")}
              </View>
            ))}
          </View>
          <Text style={executiveStyles.footer} fixed>{FOOTER_TEXT}</Text>
        </Page>
      </Document>
    );
  }

  // ============ CREATIVE ============
  if (template === "creative") {
    return (
      <Document>
        <Page size="A4" style={creativeStyles.page}>
          <View style={creativeStyles.header}>
            <Text style={creativeStyles.name}>{cv.name}</Text>
            {cv.contact.map((line, i) => (
              <Text key={i} style={creativeStyles.contact}>{line}</Text>
            ))}
          </View>
          <View style={creativeStyles.body}>
            {cv.sections.map((section, i) => (
              <View key={i}>
                {section.title ? (
                  <>
                    <Text style={creativeStyles.sectionTitle}>{section.title}</Text>
                    <View style={creativeStyles.sectionBar} />
                  </>
                ) : null}
                {renderSectionLines(section.lines, creativeStyles.text, creativeStyles.bullet, "→")}
              </View>
            ))}
          </View>
          <Text style={creativeStyles.footer} fixed>{FOOTER_TEXT}</Text>
        </Page>
      </Document>
    );
  }

  // ============ CORPORATE ============
  if (template === "corporate") {
    return (
      <Document>
        <Page size="A4" style={corporateStyles.page}>
          <View style={corporateStyles.header}>
            <Text style={corporateStyles.name}>{cv.name}</Text>
            {cv.contact.map((line, i) => (
              <Text key={i} style={corporateStyles.contact}>{line}</Text>
            ))}
          </View>
          <View style={corporateStyles.body}>
            {cv.sections.map((section, i) => (
              <View key={i}>
                {section.title ? <Text style={corporateStyles.sectionTitle}>{section.title}</Text> : null}
                {renderSectionLines(section.lines, corporateStyles.text, corporateStyles.bullet)}
              </View>
            ))}
          </View>
          <Text style={corporateStyles.footer} fixed>{FOOTER_TEXT}</Text>
        </Page>
      </Document>
    );
  }

  // ============ ACADEMIC ============
  if (template === "academic") {
    return (
      <Document>
        <Page size="A4" style={academicStyles.page}>
          <Text style={academicStyles.name}>{cv.name}</Text>
          {cv.contact.map((line, i) => (
            <Text key={i} style={academicStyles.contact}>{line}</Text>
          ))}
          <View style={academicStyles.divider} />
          {cv.sections.map((section, i) => (
            <View key={i}>
              {section.title ? (
                <Text style={academicStyles.sectionTitle}>
                  {i + 1}. {section.title}
                </Text>
              ) : null}
              {renderSectionLines(section.lines, academicStyles.text, academicStyles.bullet)}
            </View>
          ))}
          <Text style={academicStyles.footer} fixed>{FOOTER_TEXT}</Text>
        </Page>
      </Document>
    );
  }

  // ============ JAPA ============
  if (template === "japa") {
    return (
      <Document>
        <Page size="A4" style={japaStyles.page}>
          <Text style={japaStyles.name}>{cv.name}</Text>
          {cv.contact.map((line, i) => (
            <Text key={i} style={japaStyles.contact}>{line}</Text>
          ))}
          <View style={japaStyles.divider} />
          {cv.sections.map((section, i) => (
            <View key={i}>
              {section.title ? <Text style={japaStyles.sectionTitle}>{section.title}</Text> : null}
              {renderSectionLines(section.lines, japaStyles.text, japaStyles.bullet)}
            </View>
          ))}
          <Text style={japaStyles.footer} fixed>{FOOTER_TEXT}</Text>
        </Page>
      </Document>
    );
  }

  // ============ TECH ============
  if (template === "tech") {
    return (
      <Document>
        <Page size="A4" style={techStyles.page}>
          <View style={techStyles.header}>
            <Text style={techStyles.name}>{cv.name}</Text>
            {cv.contact.map((line, i) => (
              <Text key={i} style={techStyles.contact}>{line}</Text>
            ))}
          </View>
          {cv.sections.map((section, i) => (
            <View key={i}>
              {section.title ? (
                <Text style={techStyles.sectionTitle}>
                  <Text style={techStyles.sectionHash}># </Text>
                  {section.title.toLowerCase()}
                </Text>
              ) : null}
              {renderSectionLines(section.lines, techStyles.text, techStyles.bullet, "›")}
            </View>
          ))}
          <Text style={techStyles.footer} fixed>{FOOTER_TEXT}</Text>
        </Page>
      </Document>
    );
  }

  // Default fallback: Classic
  return (
    <Document>
      <Page size="A4" style={classicStyles.page}>
        <Text style={classicStyles.name}>{cv.name}</Text>
        {cv.contact.map((line, i) => (
          <Text key={i} style={classicStyles.contact}>{line}</Text>
        ))}
        <View style={classicStyles.divider} />
        {cv.sections.map((section, i) => (
          <View key={i}>
            {section.title ? <Text style={classicStyles.sectionTitle}>{section.title}</Text> : null}
            {renderSectionLines(section.lines, classicStyles.text, classicStyles.bullet)}
          </View>
        ))}
        <Text style={classicStyles.footer} fixed>{FOOTER_TEXT}</Text>
      </Page>
    </Document>
  );
}
