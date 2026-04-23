"use client";

/**
 * PremiumMarkdownViewer — Emerald Atelier reader typography for the dark panel
 *
 * GFM (tables, lists, strikethrough) with IBM Plex, secondary headings, gold
 * rules, and RTL list chrome (see `globals.css` / `.proposal-md-reader__*`).
 * Uses `useDeferredValue` to keep heavy re-parses from blocking paint.
 */
import type { CSSProperties } from "react";
import { useDeferredValue } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const IBM_PLEX =
  "var(--font-ibm-plex), 'IBM Plex Sans Arabic', system-ui, sans-serif";
const SECONDARY = "#006a67";
const GOLD = "#D4AF37";
const TEXT = "rgba(247, 250, 250, 0.9)";
const TEXT_MUTED = "rgba(247, 250, 250, 0.75)";

const HEADER_RULE = "1px solid rgba(212, 175, 55, 0.55)";

const headingStyle = (fontSize: string): CSSProperties => ({
  fontFamily: IBM_PLEX,
  fontWeight: 700,
  color: SECONDARY,
  fontSize,
  lineHeight: 1.3,
  margin: "32px 0 0.5em",
  paddingBottom: "0.35em",
  borderBottom: HEADER_RULE,
});

export function PremiumMarkdownViewer({ markdown }: { markdown: string }) {
  const deferred = useDeferredValue(markdown);

  const components: Components = {
    p: ({ children }) => (
      <p
        style={{
          margin: "0.6em 0",
          color: TEXT,
          lineHeight: 1.9,
          textAlign: "justify",
          fontFamily: IBM_PLEX,
        }}
      >
        {children}
      </p>
    ),
    h1: ({ children }) => <h1 style={headingStyle("clamp(1.35rem, 2.2vw, 1.6rem)")}>{children}</h1>,
    h2: ({ children }) => <h2 style={headingStyle("clamp(1.18rem, 1.8vw, 1.35rem)")}>{children}</h2>,
    h3: ({ children }) => <h3 style={headingStyle("clamp(1.06rem, 1.5vw, 1.15rem)")}>{children}</h3>,
    h4: ({ children }) => (
      <h4
        style={{
          ...headingStyle("1.02rem"),
          borderBottom: "1px solid rgba(212, 175, 55, 0.35)",
        }}
      >
        {children}
      </h4>
    ),
    h5: ({ children }) => (
      <h5
        style={{
          ...headingStyle("0.98rem"),
          borderBottom: "1px solid rgba(212, 175, 55, 0.28)",
        }}
      >
        {children}
      </h5>
    ),
    h6: ({ children }) => (
      <h6
        style={{
          ...headingStyle("0.94rem"),
          borderBottom: "1px solid rgba(212, 175, 55, 0.22)",
        }}
      >
        {children}
      </h6>
    ),
    strong: ({ children }) => (
      <strong style={{ color: "rgba(247, 250, 250, 0.98)", fontWeight: 600, fontFamily: IBM_PLEX }}>{children}</strong>
    ),
    em: ({ children }) => <em style={{ color: TEXT_MUTED, fontStyle: "italic", fontFamily: IBM_PLEX }}>{children}</em>,
    ul: ({ children }) => <ul className="proposal-md-reader__ul">{children}</ul>,
    ol: ({ children }) => <ol className="proposal-md-reader__ol">{children}</ol>,
    li: ({ children }) => <li className="proposal-md-reader__li">{children}</li>,
    table: ({ children }) => (
      <div style={{ overflowX: "auto", margin: "0.75em 0", WebkitOverflowScrolling: "touch" as const }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 16,
            lineHeight: 1.55,
            fontFamily: IBM_PLEX,
          }}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead style={{ background: "rgba(0, 0, 0, 0.2)" }}>{children}</thead>,
    th: ({ children }) => (
      <th
        style={{
          border: "1px solid rgba(212, 175, 55, 0.35)",
          padding: "10px 12px",
          textAlign: "right",
          color: GOLD,
          fontWeight: 600,
          fontFamily: IBM_PLEX,
        }}
      >
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td
        style={{
          border: "1px solid rgba(247, 250, 250, 0.1)",
          padding: "10px 12px",
          textAlign: "right",
          color: TEXT,
          fontFamily: IBM_PLEX,
        }}
      >
        {children}
      </td>
    ),
    tr: ({ children }) => <tr style={{ borderBottom: "1px solid rgba(247, 250, 250, 0.06)" }}>{children}</tr>,
    blockquote: ({ children }) => (
      <blockquote
        style={{
          margin: "0.65em 0",
          padding: "8px 14px 8px 0",
          borderRight: "3px solid rgba(212, 175, 55, 0.45)",
          color: TEXT_MUTED,
          fontFamily: IBM_PLEX,
        }}
      >
        {children}
      </blockquote>
    ),
    hr: () => <hr style={{ border: "none", borderTop: "1px solid rgba(212, 175, 55, 0.25)", margin: "1.1em 0" }} />,
    a: ({ href, children }) => (
      <a
        href={href}
        style={{
          color: GOLD,
          textDecoration: "underline",
          textUnderlineOffset: 3,
          fontFamily: IBM_PLEX,
        }}
        target="_blank"
        rel="noreferrer noopener"
      >
        {children}
      </a>
    ),
    pre: ({ children }) => (
      <pre
        style={{
          margin: "0.75em 0",
          padding: 14,
          borderRadius: 10,
          background: "rgba(0, 0, 0, 0.3)",
          overflow: "auto",
          fontSize: 14.5,
          lineHeight: 1.65,
          border: "1px solid rgba(247, 250, 250, 0.08)",
          fontFamily: IBM_PLEX,
        }}
      >
        {children}
      </pre>
    ),
    code: ({ className, children, ...rest }) => {
      const isBlock = Boolean(
        className?.includes("language-") || (typeof className === "string" && className.length > 0),
      );
      if (isBlock) {
        return (
          <code
            className={className}
            style={{ display: "block", background: "transparent", color: "rgba(245, 248, 250, 0.92)", fontFamily: IBM_PLEX }}
            {...rest}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          style={{
            background: "rgba(0, 0, 0, 0.25)",
            padding: "2px 7px",
            borderRadius: 5,
            fontSize: "0.9em",
            color: "rgba(245, 248, 250, 0.95)",
            fontFamily: IBM_PLEX,
          }}
          {...rest}
        >
          {children}
        </code>
      );
    },
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="proposal-md-reader premium-md-viewer"
      style={{ wordBreak: "break-word", fontFamily: IBM_PLEX }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {deferred}
      </ReactMarkdown>
    </div>
  );
}
