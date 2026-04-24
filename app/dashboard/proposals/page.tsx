"use client";

import { useState } from "react";
import { useProposalsStore, type SavedProposal } from "@/lib/proposals-store";
import { FileText, Trash2, Eye, X, Clock, Building2, Cpu } from "lucide-react";
import Link from "next/link";

const IBM_PLEX =
  "var(--font-ibm-plex), 'IBM Plex Sans Arabic', system-ui, sans-serif";
const primary = "#003334";
const secondary = "#006a67";
const surface = "#f7fafa";
const gold = "#D4AF37";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function ProposalViewModal({
  proposal,
  onClose,
}: {
  proposal: SavedProposal;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`عرض: ${proposal.title}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(0,30,31,0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: surface,
          borderRadius: 24,
          width: "100%",
          maxWidth: 780,
          maxHeight: "85dvh",
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "0 32px 80px rgba(0,51,52,0.22), inset 0 0 0 1px rgba(212,175,55,0.12)",
          overflow: "hidden",
          fontFamily: IBM_PLEX,
        }}
        dir="rtl"
      >
        {/* Modal header */}
        <div
          style={{
            padding: "22px 24px 18px",
            borderBottom: "1px solid rgba(0,106,103,0.08)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: "0 0 4px",
                color: secondary,
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              العرض الفني المحفوظ
            </p>
            <h2
              style={{
                margin: 0,
                color: primary,
                fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
                fontWeight: 700,
                lineHeight: 1.3,
              }}
            >
              {proposal.title || "عرض فني"}
            </h2>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              {proposal.ownerEntity && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    color: "rgba(0,51,52,0.45)",
                    fontWeight: 500,
                  }}
                >
                  <Building2 size={11} style={{ color: secondary }} />
                  {proposal.ownerEntity}
                </span>
              )}
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: "rgba(0,51,52,0.45)",
                  fontWeight: 500,
                }}
              >
                <Clock size={11} style={{ color: secondary }} />
                {formatDate(proposal.savedAt)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              flexShrink: 0,
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "none",
              background: "rgba(0,106,103,0.07)",
              color: primary,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              fontFamily: IBM_PLEX,
              transition: "background 200ms",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal body — scrollable text */}
        <div
          dir="rtl"
          lang="ar"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "22px 24px",
            fontSize: 15,
            lineHeight: 2,
            color: primary,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: IBM_PLEX,
            fontWeight: 400,
          }}
        >
          {proposal.text || "لا يوجد نص محفوظ."}
        </div>

        {/* Modal footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid rgba(0,106,103,0.07)",
            display: "flex",
            justifyContent: "flex-start",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px",
              borderRadius: 12,
              border: "none",
              background: "rgba(0,106,103,0.08)",
              color: secondary,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: IBM_PLEX,
              transition: "background 200ms",
            }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

function ProposalCard({
  proposal,
  onView,
  onDelete,
}: {
  proposal: SavedProposal;
  onView: () => void;
  onDelete: () => void;
}) {
  const preview =
    proposal.text.length > 180
      ? proposal.text.slice(0, 180) + "…"
      : proposal.text;

  return (
    <div
      style={{
        background: surface,
        borderRadius: 22,
        overflow: "hidden",
        boxShadow:
          "0 4px 28px rgba(0,51,52,0.06), inset 0 0 0 1px rgba(0,106,103,0.07)",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 250ms cubic-bezier(0.22,1,0.36,1)",
        fontFamily: IBM_PLEX,
      }}
    >
      {/* Gold top stripe */}
      <div
        style={{
          height: 3,
          background: `linear-gradient(to left, ${gold}, rgba(212,175,55,0.15))`,
        }}
      />

      <div style={{ padding: "18px 20px", flex: 1 }}>
        <h3
          style={{
            margin: "0 0 6px",
            color: primary,
            fontSize: "clamp(0.9rem, 1.4vw, 1rem)",
            fontWeight: 700,
            lineHeight: 1.4,
            fontFamily: IBM_PLEX,
          }}
        >
          {proposal.title || "عرض فني"}
        </h3>
        {proposal.ownerEntity && (
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 12,
              color: secondary,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Building2 size={11} style={{ flexShrink: 0 }} />
            {proposal.ownerEntity}
          </p>
        )}
        <p
          dir="rtl"
          lang="ar"
          style={{
            margin: "0 0 14px",
            fontSize: 12,
            lineHeight: 1.8,
            color: "rgba(0,51,52,0.55)",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {preview}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            color: "rgba(0,51,52,0.35)",
          }}
        >
          <Clock size={10} style={{ color: secondary, flexShrink: 0 }} />
          {formatDate(proposal.savedAt)}
        </div>
      </div>

      {/* Card footer */}
      <div
        style={{
          padding: "12px 20px",
          background: "rgba(0,106,103,0.025)",
          borderTop: "1px solid rgba(0,106,103,0.06)",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <button
          onClick={onView}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "9px 14px",
            borderRadius: 12,
            border: "none",
            background: primary,
            color: surface,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: IBM_PLEX,
            boxShadow: "0 4px 14px rgba(0,51,52,0.18)",
            transition: "all 200ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <Eye size={13} />
          عرض
        </button>
        <button
          onClick={onDelete}
          aria-label="حذف العرض"
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            border: "none",
            background: "rgba(220,38,38,0.06)",
            color: "#dc2626",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            fontFamily: IBM_PLEX,
            transition: "background 200ms",
            flexShrink: 0,
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function ProposalsPage() {
  const { proposals, deleteProposal } = useProposalsStore();
  const [viewing, setViewing] = useState<SavedProposal | null>(null);

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: IBM_PLEX,
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      {/* Page header */}
      <div>
        <p
          style={{
            margin: 0,
            color: secondary,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Proposals Archive
        </p>
        <h1
          style={{
            margin: "6px 0 6px",
            color: primary,
            fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)",
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          عروضي الفنية
        </h1>
        <div
          style={{
            height: 3,
            width: 40,
            borderRadius: 2,
            background: `linear-gradient(to left, ${secondary}, ${gold})`,
          }}
        />
      </div>

      {/* Count badge */}
      {proposals.length > 0 && (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "rgba(0,51,52,0.45)",
            fontWeight: 500,
          }}
        >
          {proposals.length} عرض محفوظ
        </p>
      )}

      {/* Empty state */}
      {proposals.length === 0 && (
        <div
          style={{
            background: surface,
            borderRadius: 24,
            padding: "60px 32px",
            textAlign: "center",
            boxShadow:
              "0 4px 24px rgba(0,51,52,0.04), inset 0 0 0 1px rgba(0,106,103,0.06)",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: "rgba(0,106,103,0.07)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 18px",
            }}
          >
            <FileText size={26} style={{ color: secondary }} />
          </div>
          <p
            style={{
              margin: 0,
              color: "rgba(0,51,52,0.5)",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            لا توجد عروض محفوظة بعد
          </p>
          <p
            style={{
              margin: "8px 0 24px",
              color: "rgba(0,51,52,0.35)",
              fontSize: 13,
            }}
          >
            استخدم محرك التوليد لإنشاء عرضك الأول ثم احفظه في الأرشيف
          </p>
          <Link
            href="/dashboard/engine"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              borderRadius: 14,
              background: primary,
              color: surface,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              boxShadow: "0 8px 24px rgba(0,51,52,0.2)",
            }}
          >
            <Cpu size={16} />
            توليد عرض جديد
          </Link>
        </div>
      )}

      {/* Proposals grid */}
      {proposals.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 18,
          }}
        >
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onView={() => setViewing(proposal)}
              onDelete={() => deleteProposal(proposal.id)}
            />
          ))}
        </div>
      )}

      {/* View modal */}
      {viewing && (
        <ProposalViewModal proposal={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
