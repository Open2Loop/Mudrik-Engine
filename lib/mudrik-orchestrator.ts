import { completeGenerationWithRetry } from "@/lib/ai-gateway";
import { BYOK_MISSING_GEMINI_AR } from "@/lib/byok";
import type { UserModelSettings } from "@/lib/model-gateway";

export type MudrikAgentRole = "extractor" | "architect" | "drafter" | "auditor";

export type OutlineSection = {
  id: string;
  title: string;
  objective?: string;
};

export type ProposalSection = {
  section_id: string;
  title: string;
  content: string;
};

export type MudrikPipelineResult = {
  extractionJsonText: string;
  outlineText: string;
  sections: ProposalSection[];
  finalDocument: string;
};

export type MudrikOrchestratorOptions = {
  interSectionDelayMs?: number;
  settings?: UserModelSettings;
  systemPrompts?: Partial<Record<MudrikAgentRole, string>>;
};

const DEFAULT_INTER_SECTION_DELAY_MS = 500;

const DEFAULT_SYSTEM_PROMPTS: Record<MudrikAgentRole, string> = {
  extractor:
    "AGENT 1: Extract technical requirements from Kraasa and return strict JSON only with no prose.",
  architect:
    "AGENT 2: Create a granular technical outline with hierarchical numbering only (1.0, 1.1, 1.1.1).",
  drafter:
    "AGENT 3: Draft one requested sub-section only in formal Arabic technical consultancy tone using provided Source of Truth.",
  auditor:
    "AGENT 4: Audit section text, remove AI fluff, enforce compliance language, and return polished final text.",
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeWhitespaces(input: string): string {
  return input.replace(/\r\n/g, "\n").trim();
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function extractOutlineSections(outlineText: string): OutlineSection[] {
  const text = normalizeWhitespaces(outlineText);
  if (!text) return [];

  const lines = text.split("\n");
  const sections: OutlineSection[] = [];
  const seen = new Set<string>();
  const lineRe = /^(\d+(?:\.\d+)+)\s+(.+?)(?:\s+\[(?:Objective|الهدف)\s*:\s*(.+?)\])?$/i;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(lineRe);
    if (!match) continue;
    const id = match[1]?.trim();
    const title = match[2]?.trim();
    const objective = match[3]?.trim();
    if (!id || !title || seen.has(id)) continue;
    seen.add(id);
    sections.push({ id, title, objective });
  }

  return sections;
}

function formatFinalDocument(sections: ProposalSection[]): string {
  return sections.map((s) => s.content.trim()).filter(Boolean).join("\n\n");
}

export class MudrikOrchestrator {
  private readonly systemPrompts: Record<MudrikAgentRole, string>;
  private readonly interSectionDelayMs: number;
  private readonly settings: UserModelSettings;

  constructor(options: MudrikOrchestratorOptions = {}) {
    this.systemPrompts = { ...DEFAULT_SYSTEM_PROMPTS, ...(options.systemPrompts ?? {}) };
    this.interSectionDelayMs = options.interSectionDelayMs ?? DEFAULT_INTER_SECTION_DELAY_MS;
    this.settings = options.settings ?? {
      aiProvider: "gemini",
      generationEngine: "gemini",
      modelApiKey: null,
      geminiApiKey: null,
      embeddingModel: "text-embedding-3-small",
      chatModel: "gpt-4o-mini",
    };
    if (!this.settings.geminiApiKey?.trim() && this.settings.generationEngine === "gemini") {
      throw new Error(BYOK_MISSING_GEMINI_AR);
    }
  }

  async generateFullProposal(rawKraasaText: string): Promise<MudrikPipelineResult> {
    const kraasa = normalizeWhitespaces(rawKraasaText);
    if (!kraasa) {
      throw new Error("raw_kraasa_text is required.");
    }

    const extractionJsonText = normalizeWhitespaces(await this.runAgent("extractor", kraasa));
    const extractionAsJson = safeJsonParse<unknown>(extractionJsonText);
    if (!extractionAsJson) {
      throw new Error("Extractor did not return valid JSON.");
    }

    const outlineText = normalizeWhitespaces(await this.runAgent("architect", extractionJsonText));
    const sections = extractOutlineSections(outlineText);
    if (sections.length === 0) {
      throw new Error("Architect output does not contain parseable numbered sections.");
    }

    const proposalSections: ProposalSection[] = [];

    for (const section of sections) {
      const draftInput = JSON.stringify(
        {
          source_of_truth: extractionAsJson,
          target_section: section,
          instruction: "Draft this section only. Do not continue to other sections.",
        },
        null,
        2,
      );

      const rawDraft = await this.runAgent("drafter", draftInput);
      const polishedText = normalizeWhitespaces(await this.runAgent("auditor", rawDraft));

      proposalSections.push({
        section_id: section.id,
        title: section.title,
        content: polishedText,
      });

      if (this.interSectionDelayMs > 0) {
        await sleep(this.interSectionDelayMs);
      }
    }

    return {
      extractionJsonText,
      outlineText,
      sections: proposalSections,
      finalDocument: formatFinalDocument(proposalSections),
    };
  }

  private async runAgent(agentRole: MudrikAgentRole, inputData: string): Promise<string> {
    const response = await completeGenerationWithRetry(
      this.settings,
      this.systemPrompts[agentRole],
      inputData,
    );
    return response.trim();
  }
}

