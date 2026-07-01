export const RESEARCH_MODES = {
  quick_summary: {
    label: "Quick Summary",
    description: "Concise summary of the most important points.",
  },
  executive_summary: {
    label: "Executive Summary",
    description: "Business-focused overview for managers and executives.",
  },
  deep_analysis: {
    label: "Deep Analysis",
    description: "Detailed analysis with trends, risks, opportunities, conclusions.",
  },
  key_insights: {
    label: "Key Insights",
    description: "The most important findings, structured for scanning.",
  },
  action_items: {
    label: "Action Items",
    description: "Recommended actions and next steps.",
  },
  recommendation_report: {
    label: "Recommendation Report",
    description: "Practical recommendations grounded in the material.",
  },
  compare_documents: {
    label: "Compare Documents",
    description: "Similarities, differences, and conflicts across the provided documents.",
  },
} as const;

export type ResearchMode = keyof typeof RESEARCH_MODES;

export const COMPLEXITY_LEVELS = {
  beginner: "Explain simply as if to someone new to the topic. Avoid jargon.",
  intermediate: "Balance clarity and depth. Define specialized terms briefly.",
  professional: "Use precise, professional language suitable for domain experts.",
} as const;
export type Complexity = keyof typeof COMPLEXITY_LEVELS;

export function buildSystemPrompt(mode: ResearchMode, complexity: Complexity, hasDocs: boolean): string {
  const base = `You are Nexora's AI Research Analyst — a senior workplace research assistant. You help professionals research topics, summarise material, analyse reports, compare information, extract insights, and generate recommendations that support real workplace decisions.

Style:
- ${COMPLEXITY_LEVELS[complexity]}
- Format responses in clean Markdown with clear H2/H3 headings, bullet lists, and Markdown tables where they aid comparison.
- Prefer concrete facts, numbers, and quotes from provided material over generic filler.
- Never fabricate statistics or citations. If the material doesn't cover a question, say so plainly.
- Every response should be immediately usable in a business context.`;

  const modeInstr = {
    quick_summary: `Mode: QUICK SUMMARY. Produce a tight summary (≤200 words) with a short "Key Points" bullet list at the end.`,
    executive_summary: `Mode: EXECUTIVE SUMMARY. Structure as: Overview, Strategic Implications, Key Metrics/Statistics, Risks, Opportunities, Recommended Actions.`,
    deep_analysis: `Mode: DEEP ANALYSIS. Structure as: Executive Summary, Key Insights, Important Statistics, Challenges, Risks, Opportunities, Recommendations, Action Items, Conclusion.`,
    key_insights: `Mode: KEY INSIGHTS. List the 5–10 most important findings as headline + supporting evidence. Rank by importance.`,
    action_items: `Mode: ACTION ITEMS. Return a Markdown table with columns: Action | Owner (suggested) | Priority | Deadline (suggested) | Rationale.`,
    recommendation_report: `Mode: RECOMMENDATION REPORT. Structure as: Context, Options Considered, Recommended Path, Trade-offs, Implementation Steps, Success Metrics.`,
    compare_documents: `Mode: COMPARE DOCUMENTS. Structure as: Documents Compared, Similarities, Differences (Markdown table), Conflicting Information, Reconciled Recommendation.`,
  }[mode];

  const docNote = hasDocs
    ? `\n\nThe user has attached documents. Ground your response in their content. Quote briefly when it strengthens a point.`
    : "";

  const followupInstr = `\n\nAt the very end of every response, add a section titled exactly "### Follow-up" containing 3–4 short, clickable follow-up suggestions as a bullet list. Each suggestion should be a single sentence question or command the user could send next.`;

  return `${base}\n\n${modeInstr}${docNote}${followupInstr}`;
}

export function extractFollowups(text: string): string[] {
  const idx = text.lastIndexOf("### Follow-up");
  if (idx === -1) return [];
  const tail = text.slice(idx).split("\n").slice(1);
  const items: string[] = [];
  for (const line of tail) {
    const m = line.match(/^\s*[-*]\s+(.*\S)\s*$/);
    if (m) items.push(m[1].replace(/^["']|["']$/g, ""));
    if (items.length >= 4) break;
  }
  return items;
}
