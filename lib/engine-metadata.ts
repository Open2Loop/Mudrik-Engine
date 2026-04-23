/**
 * Side-panel engine routes (gaps / BOQ / WBS) share a capped RFP excerpt so
 * three concurrent Gemini calls stay within latency limits and reduce 502s.
 */
export const METADATA_SOURCE_TEXT_CAP = 12_000;
