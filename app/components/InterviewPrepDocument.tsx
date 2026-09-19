"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { TemplateId } from "@/lib/useCredits";

interface InterviewQuestion {
  category: "Behavioral" | "Technical" | "Nigeria-Specific";
  question: string;
  answer: string;
  coachTip: string;
}

interface PrepResult {
  readinessScore: number;
  questions: InterviewQuestion[];
  topStrengths: string[];
  watchOuts: string[];
}

interface Props {
  result: PrepResult;
  template?: TemplateId;
}

// ---------------------------------------------------------------------------
// CLASSIC styles
// ---------------------------------------------------------------------------
const classicStyles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 44,
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: "#1a1a1a",
    lineHeight: 1.5,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#0a2540",
    paddingBottom: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "Times-Bold",
    color: "#0a2540",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: "#666",
  },
  scoreBox: {
    backgroundColor: "#f0f4f8",
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#0a2540",
  },
  scoreLabel: {
    fontSize: 9,
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 24,
    fontFamily: "Times-Bold",
    color: "#0a2540",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Times-Bold",
    color: "#0a2540",
    marginTop: 14,
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#0a2540",
    paddingBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  strengthItem: {
    fontSize: 10,
    marginBottom: 3,
  },
  questionCard: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  qCategory: {
    fontSize: 8,
    color: "#0a2540",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  qText: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    marginBottom: 4,
    color: "#1a1a1a",
  },
  qAnswer: {
    fontSize: 9.5,
    color: "#333",
    marginBottom: 3,
  },
  coachTip: {
    fontSize: 9,
    color: "#0a2540",
    fontStyle: "italic",
    marginTop: 2,
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

// ---------------------------------------------------------------------------
// MODERN styles
// ---------------------------------------------------------------------------
const modernStyles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
    lineHeight: 1.55,
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: "#2563EB",
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 44,
    paddingBottom: 14,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#2563EB",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: "#64748B",
  },
  body: {
    paddingHorizontal: 44,
  },
  scoreBox: {
    backgroundColor: "#EFF6FF",
    padding: 14,
    marginBottom: 16,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#2563EB",
  },
  scoreLabel: {
    fontSize: 9,
    color: "#2563EB",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: "#1E3A8A",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#2563EB",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  strengthItem: {
    fontSize: 10,
    marginBottom: 3,
    color: "#334155",
  },
  questionCard: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
  },
  qCategory: {
    fontSize: 8,
    color: "#2563EB",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  qText: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
    color: "#0F172A",
  },
  qAnswer: {
    fontSize: 9.5,
    color: "#334155",
    marginBottom: 4,
  },
  coachTip: {
    fontSize: 9,
    color: "#0EA5E9",
    marginTop: 3,
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

// ---------------------------------------------------------------------------
// MINIMAL styles
// ---------------------------------------------------------------------------
const minimalStyles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 55,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111",
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#000",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 9,
    color: "#888",
    marginTop: 3,
  },
  scoreBox: {
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  scoreLabel: {
    fontSize: 8.5,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  scoreValue: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#000",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 20,
    marginBottom: 8,
  },
  strengthItem: {
    fontSize: 10,
    marginBottom: 4,
    color: "#333",
  },
  questionCard: {
    marginBottom: 14,
    paddingBottom: 10,
  },
  qCategory: {
    fontSize: 8,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  qText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
    color: "#000",
  },
  qAnswer: {
    fontSize: 9.5,
    color: "#333",
    marginBottom: 4,
  },
  coachTip: {
    fontSize: 9,
    color: "#888",
    fontStyle: "italic",
    marginTop: 3,
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
// Category label helper
// ---------------------------------------------------------------------------
function categoryLabel(cat: string): string {
  switch (cat) {
    case "Behavioral":
      return "💬 Behavioral";
    case "Technical":
      return "⚙️ Technical";
    case "Nigeria-Specific":
      return "🇳🇬 Nigeria-Specific";
    default:
      return cat;
  }
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export function InterviewPrepDocument({ result, template = "classic" }: Props) {
  const footerText = "Built with CVPro · Made by PrimeWeb Designs";

  // ============ MODERN ============
  if (template === "modern") {
    return (
      <Document>
        <Page size="A4" style={modernStyles.page}>
          <View style={modernStyles.accentBar} />

          <View style={modernStyles.header}>
            <Text style={modernStyles.title}>Interview Prep Pack</Text>
            <Text style={modernStyles.subtitle}>
              Personalized questions + STAR answers
            </Text>
          </View>

          <View style={modernStyles.body}>
            <View style={modernStyles.scoreBox}>
              <Text style={modernStyles.scoreLabel}>Readiness Score</Text>
              <Text style={modernStyles.scoreValue}>
                {result.readinessScore}%
              </Text>
            </View>

            {result.topStrengths.length > 0 && (
              <View>
                <Text style={modernStyles.sectionTitle}>
                  Your Strengths
                </Text>
                {result.topStrengths.map((s, i) => (
                  <Text key={i} style={modernStyles.strengthItem}>
                    ✓  {s}
                  </Text>
                ))}
              </View>
            )}

            {result.watchOuts.length > 0 && (
              <View>
                <Text style={modernStyles.sectionTitle}>
                  Prepare to Address
                </Text>
                {result.watchOuts.map((w, i) => (
                  <Text key={i} style={modernStyles.strengthItem}>
                    ⚠  {w}
                  </Text>
                ))}
              </View>
            )}

            <Text style={modernStyles.sectionTitle}>Your 10 Questions</Text>

            {result.questions.map((q, i) => (
              <View key={i} style={modernStyles.questionCard} wrap={false}>
                <Text style={modernStyles.qCategory}>
                  {i + 1}. {categoryLabel(q.category)}
                </Text>
                <Text style={modernStyles.qText}>{q.question}</Text>
                <Text style={modernStyles.qAnswer}>{q.answer}</Text>
                {q.coachTip && (
                  <Text style={modernStyles.coachTip}>
                    💡 {q.coachTip}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <Text style={modernStyles.footer} fixed>
            {footerText}
          </Text>
        </Page>
      </Document>
    );
  }

  // ============ MINIMAL ============
  if (template === "minimal") {
    return (
      <Document>
        <Page size="A4" style={minimalStyles.page}>
          <View style={minimalStyles.header}>
            <Text style={minimalStyles.title}>INTERVIEW PREP PACK</Text>
            <Text style={minimalStyles.subtitle}>
              Personalized questions + STAR answers
            </Text>
          </View>

          <View style={minimalStyles.scoreBox}>
            <Text style={minimalStyles.scoreLabel}>Readiness Score</Text>
            <Text style={minimalStyles.scoreValue}>
              {result.readinessScore}%
            </Text>
          </View>

          {result.topStrengths.length > 0 && (
            <View>
              <Text style={minimalStyles.sectionTitle}>Strengths</Text>
              {result.topStrengths.map((s, i) => (
                <Text key={i} style={minimalStyles.strengthItem}>
                  –  {s}
                </Text>
              ))}
            </View>
          )}

          {result.watchOuts.length > 0 && (
            <View>
              <Text style={minimalStyles.sectionTitle}>Watch Outs</Text>
              {result.watchOuts.map((w, i) => (
                <Text key={i} style={minimalStyles.strengthItem}>
                  –  {w}
                </Text>
              ))}
            </View>
          )}

          <Text style={minimalStyles.sectionTitle}>Questions</Text>

          {result.questions.map((q, i) => (
            <View key={i} style={minimalStyles.questionCard} wrap={false}>
              <Text style={minimalStyles.qCategory}>
                {i + 1}. {categoryLabel(q.category)}
              </Text>
              <Text style={minimalStyles.qText}>{q.question}</Text>
              <Text style={minimalStyles.qAnswer}>{q.answer}</Text>
              {q.coachTip && (
                <Text style={minimalStyles.coachTip}>
                  Coach tip: {q.coachTip}
                </Text>
              )}
            </View>
          ))}

          <Text style={minimalStyles.footer} fixed>
            {footerText}
          </Text>
        </Page>
      </Document>
    );
  }

  // ============ CLASSIC (default) ============
  return (
    <Document>
      <Page size="A4" style={classicStyles.page}>
        <View style={classicStyles.header}>
          <Text style={classicStyles.title}>Interview Prep Pack</Text>
          <Text style={classicStyles.subtitle}>
            Personalized questions + STAR answers
          </Text>
        </View>

        <View style={classicStyles.scoreBox}>
          <Text style={classicStyles.scoreLabel}>Readiness Score</Text>
          <Text style={classicStyles.scoreValue}>
            {result.readinessScore}%
          </Text>
        </View>

        {result.topStrengths.length > 0 && (
          <View>
            <Text style={classicStyles.sectionTitle}>Your Strengths</Text>
            {result.topStrengths.map((s, i) => (
              <Text key={i} style={classicStyles.strengthItem}>
                •  {s}
              </Text>
            ))}
          </View>
        )}

        {result.watchOuts.length > 0 && (
          <View>
            <Text style={classicStyles.sectionTitle}>
              Prepare to Address
            </Text>
            {result.watchOuts.map((w, i) => (
              <Text key={i} style={classicStyles.strengthItem}>
                •  {w}
              </Text>
            ))}
          </View>
        )}

        <Text style={classicStyles.sectionTitle}>Your 10 Questions</Text>

        {result.questions.map((q, i) => (
          <View key={i} style={classicStyles.questionCard} wrap={false}>
            <Text style={classicStyles.qCategory}>
              {i + 1}. {categoryLabel(q.category)}
            </Text>
            <Text style={classicStyles.qText}>{q.question}</Text>
            <Text style={classicStyles.qAnswer}>{q.answer}</Text>
            {q.coachTip && (
              <Text style={classicStyles.coachTip}>💡 {q.coachTip}</Text>
            )}
          </View>
        ))}

        <Text style={classicStyles.footer} fixed>
          {footerText}
        </Text>
      </Page>
    </Document>
  );
}
