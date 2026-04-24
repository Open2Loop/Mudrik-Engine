"use client";

import Link from "next/link";
import { useProposalsStore } from "@/lib/proposals-store";
import { FileText, Search, Cpu, TrendingUp, Clock, ArrowLeft } from "lucide-react";

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
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const DUMMY_TENDERS_COUNT = 4;

export default function DashboardPage() {
  const { proposals } = useProposalsStore();

  const kpis = [
    {
      label: "عروض تم توليدها",
      value: proposals.length,
      icon: FileText,
      color: secondary,
      bg: "rgba(0,106,103,0.07)",
      hint: "محفوظة في الأرشيف",
    },
    {
      label: "مناقصات نشطة",
      value: DUMMY_TENDERS_COUNT,
      icon: Search,
      color: "#c8a020",
      bg: "rgba(212,175,55,0.08)",
      hint: "متاحة للتقديم",
    },
    {
      label: "جاهزية المحرك",
      value: "100%",
      icon: Cpu,
      color: secondary,
      bg: "rgba(0,106,103,0.07)",
      hint: "محرك التوليد الذكي",
    },
    {
      label: "معدل الإنجاز",
      value: proposals.length > 0 ? `${Math.min(100, proposals.length * 12)}%` : "0%",
      icon: TrendingUp,
      color: "#c8a020",
      bg: "rgba(212,175,55,0.08)",
      hint: "مقارنةً بالشهر الماضي",
    },
  ];

  const recentProposals = proposals.slice(0, 5);

  return (
    <div
      dir="rtl"
      style={{ fontFamily: IBM_PLEX, display: "flex", flexDirection: "column", gap: 32 }}
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
          Mudrik Platform
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
          مرحباً بك في مُدْرِك
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

      {/* KPI grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: surface,
              borderRadius: 20,
              padding: "20px 22px",
              boxShadow:
                "0 4px 24px rgba(0,51,52,0.06), inset 0 0 0 1px rgba(0,106,103,0.07)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: kpi.bg,
                display: "grid",
                placeItems: "center",
              }}
            >
              <kpi.icon size={18} style={{ color: kpi.color }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                  fontWeight: 700,
                  color: primary,
                  lineHeight: 1,
                }}
              >
                {kpi.value}
              </div>
              <div
                style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: primary }}
              >
                {kpi.label}
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 11,
                  color: "rgba(0,51,52,0.4)",
                  fontWeight: 500,
                }}
              >
                {kpi.hint}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link
          href="/dashboard/engine"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 22px",
            borderRadius: 14,
            background: primary,
            color: surface,
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
            boxShadow: "0 8px 24px rgba(0,51,52,0.22)",
            transition: "all 200ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <Cpu size={16} />
          توليد عرض جديد
          <ArrowLeft size={14} />
        </Link>
        <Link
          href="/dashboard/tenders"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 22px",
            borderRadius: 14,
            background: "rgba(0,106,103,0.08)",
            color: secondary,
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
            transition: "all 200ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <Search size={16} />
          استعراض المناقصات
        </Link>
      </div>

      {/* Recent proposals */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: primary,
                fontSize: "clamp(1rem, 1.6vw, 1.2rem)",
                fontWeight: 700,
              }}
            >
              أحدث العروض المحفوظة
            </h2>
          </div>
          {proposals.length > 0 && (
            <Link
              href="/dashboard/proposals"
              style={{
                color: secondary,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              عرض الكل
              <ArrowLeft size={13} />
            </Link>
          )}
        </div>

        {recentProposals.length === 0 ? (
          <div
            style={{
              background: surface,
              borderRadius: 20,
              padding: "40px 28px",
              textAlign: "center",
              boxShadow: "0 4px 24px rgba(0,51,52,0.04), inset 0 0 0 1px rgba(0,106,103,0.06)",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "rgba(0,106,103,0.07)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
              }}
            >
              <FileText size={22} style={{ color: secondary }} />
            </div>
            <p style={{ margin: 0, color: "rgba(0,51,52,0.45)", fontSize: 14, fontWeight: 500 }}>
              لا توجد عروض محفوظة بعد
            </p>
            <p style={{ margin: "6px 0 0", color: "rgba(0,51,52,0.3)", fontSize: 12 }}>
              استخدم محرك التوليد لإنشاء وحفظ عرضك الأول
            </p>
          </div>
        ) : (
          <div
            style={{
              background: surface,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(0,51,52,0.05), inset 0 0 0 1px rgba(0,106,103,0.07)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "rgba(0,106,103,0.04)",
                    borderBottom: "1px solid rgba(0,106,103,0.08)",
                  }}
                >
                  {["اسم المشروع", "الجهة", "تاريخ الحفظ", ""].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 18px",
                        textAlign: "right",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "rgba(0,51,52,0.45)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        fontFamily: IBM_PLEX,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentProposals.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom:
                        i < recentProposals.length - 1
                          ? "1px solid rgba(0,106,103,0.05)"
                          : "none",
                    }}
                  >
                    <td
                      style={{
                        padding: "13px 18px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: primary,
                        maxWidth: 240,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.title || "—"}
                    </td>
                    <td
                      style={{
                        padding: "13px 18px",
                        fontSize: 12,
                        color: "rgba(0,51,52,0.55)",
                        maxWidth: 160,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.ownerEntity || "—"}
                    </td>
                    <td
                      style={{
                        padding: "13px 18px",
                        fontSize: 12,
                        color: "rgba(0,51,52,0.45)",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Clock size={11} style={{ color: secondary, flexShrink: 0 }} />
                      {formatDate(p.savedAt)}
                    </td>
                    <td style={{ padding: "13px 18px" }}>
                      <Link
                        href="/dashboard/proposals"
                        style={{
                          color: secondary,
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        عرض
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
