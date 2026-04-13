import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@google/generative-ai", () => {
  class GoogleGenerativeAI {
    private apiKey: string;
    constructor(apiKey: string) {
      this.apiKey = apiKey;
    }
    getGenerativeModel({ model }: { model: string }) {
      if (model === "gemini-embedding-001") {
        return {
          embedContent: async (input: string) => {
            if (!this.apiKey) throw new Error("missing key");
            if (!input) return { embedding: { values: Array(3072).fill(0) } };
            return { embedding: { values: Array(3072).fill(0.001) } };
          },
        };
      }
      return {
        generateContent: async () => ({
          response: {
            text: () => "{\"ok\":true}",
          },
        }),
      };
    }
  }
  return { GoogleGenerativeAI };
});

import { completeJson, embedTexts } from "@/lib/model-gateway";

describe("model-gateway provider enforcement", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.MODEL_API_BASE = "https://example.com/v1";
    process.env.EMBEDDING_VECTOR_DIMENSIONS = "3072";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("throws a Gemini-specific error when Gemini is selected without a key", async () => {
    await expect(
      embedTexts(
        {
          aiProvider: "gemini",
          generationEngine: "gemini",
          geminiApiKey: null,
          modelApiKey: null,
          embeddingModel: "text-embedding-3-small",
          chatModel: "gpt-4o-mini",
        },
        ["hello"]
      )
    ).rejects.toThrow("CRITICAL: Gemini API Key is missing from both settings and .env file.");
  });

  it("produces 3072-dim embeddings when Gemini is selected", async () => {
    const vecs = await embedTexts(
      {
        aiProvider: "gemini",
        generationEngine: "gemini",
        geminiApiKey: "test",
        modelApiKey: null,
        embeddingModel: "text-embedding-3-small",
        chatModel: "gpt-4o-mini",
      },
      ["a", "b"]
    );
    expect(vecs).toHaveLength(2);
    expect(vecs[0]).toHaveLength(3072);
    expect(vecs[1]).toHaveLength(3072);
  });

  it("throws an OpenAI-specific error when OpenAI is selected without a key", async () => {
    await expect(
      embedTexts(
        {
          aiProvider: "openai",
          generationEngine: "openai",
          geminiApiKey: null,
          modelApiKey: null,
          embeddingModel: "text-embedding-3-small",
          chatModel: "gpt-4o-mini",
        },
        ["hello"]
      )
    ).rejects.toThrow("يرجى إضافة مفتاح OpenAI في الإعدادات لإتمام البحث والتضمين.");
  });

  it("uses OpenAI embeddings when OpenAI is selected", async () => {
    globalThis.fetch = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          data: [{ embedding: Array(3072).fill(0) }, { embedding: Array(3072).fill(1) }],
        }),
      } as unknown as Response;
    });

    const vecs = await embedTexts(
      {
        aiProvider: "openai",
        generationEngine: "openai",
        geminiApiKey: null,
        modelApiKey: "sk-test",
        embeddingModel: "text-embedding-3-small",
        chatModel: "gpt-4o-mini",
      },
      ["x", "y"]
    );

    expect(vecs).toHaveLength(2);
    expect(vecs[0]).toHaveLength(3072);
    expect(vecs[1]).toHaveLength(3072);
  });

  it("uses Gemini generation when Gemini is selected", async () => {
    const text = await completeJson(
      {
        aiProvider: "gemini",
        generationEngine: "gemini",
        geminiApiKey: "test",
        modelApiKey: null,
        embeddingModel: "text-embedding-3-small",
        chatModel: "gpt-4o-mini",
      },
      "system",
      "user"
    );
    expect(text).toBe("{\"ok\":true}");
  });
});
