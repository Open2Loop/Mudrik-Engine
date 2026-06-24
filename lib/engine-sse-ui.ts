/**
 * Parse Vercel AI SDK `toUIMessageStreamResponse()` lines — text-delta only.
 * Shared by engine page streaming UI and `useMudrikEngine`.
 */

function extractDeltaFromSseLine(line: string): string {
  if (!line.startsWith("data:")) return "";
  const payload = line.slice(5).trim();
  if (!payload || payload === "[DONE]") return "";

  let event: { type?: unknown; delta?: unknown; textDelta?: unknown };
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return "";
  }

  if (event.type !== "text-delta") return "";

  const delta = typeof event.delta === "string" ? event.delta : event.textDelta;
  return typeof delta === "string" ? delta : "";
}

export function parseStreamChunk(
  rawChunk: string,
  bufferRef: { current: string },
): string {
  const combined = bufferRef.current + rawChunk;
  const lines = combined.split(/\r?\n/);
  bufferRef.current = lines.pop() ?? "";

  let extracted = "";
  for (const line of lines) {
    if (!line) continue;
    extracted += extractDeltaFromSseLine(line);
  }
  return extracted;
}
