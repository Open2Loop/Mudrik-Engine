"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin, Calendar, Building2, ArrowLeft, Tag } from "lucide-react";

const IBM_PLEX =
  "var(--font-ibm-plex), 'IBM Plex Sans Arabic', system-ui, sans-serif";
const primary = "#003334";
const secondary = "#006a67";
const surface = "#f7fafa";
const gold = "#D4AF37";

interface Tender {
  id: string;
  title: string;
  entity: string;
  location: string;
  deadline: string;
  category: string;
  budget: string;
  status: "open" | "closing_soon";
}

const TENDERS: Tender[] = [
  {
    id: "t1",
    title: "صيانة مباني وزارة الصحة — المنطقة الوسطى",
    entity: "وزارة الصحة",
    location: "الرياض",
    deadline: "١٥ مايو ٢٠٢٦",
    category: "صيانة وإنشاء",
    budget: "٢٫٥ مليون ريال",
    status: "open",
  },
  {
    id: "t2",
    title: "تطوير البنية التحتية لتقنية المعلومات — أمانة منطقة مكة",
    entity: "أمانة منطقة مكة المكرمة",
    location: "مكة المكرمة",
    deadline: "٢ يونيو ٢٠٢٦",
    category: "تقنية المعلومات",
    budget: "٨ ملايين ريال",
    status: "open",
  },
  {
    id: "t3",
    title: "توريد وتركيب أنظمة الأمن والمراقبة لمطار الأمير محمد بن عبدالعزيز",
    entity: "الهيئة العامة للطيران المدني",
    location: "المدينة المنورة",
    deadline: "٢٨ أبريل ٢٠٢٦",
    category: "أمن وأنظمة",
    budget: "١٢ مليون ريال",
    status: "closing_soon",
  },
  {
    id: "t4",
    title: "إنشاء وتأهيل شبكة الصرف الصحي — المرحلة الثالثة",
    entity: "شركة المياه الوطنية",
    location: "الدمام",
    deadline: "١٠ يونيو ٢٠٢٦",
    category: "بنية تحتية",
    budget: "٣٥ مليون ريال",
    status: "open",
  },
];

function TenderCard({ tender }: { tender: Tender }) {
  const isClosingSoon = tender.status === "closing_soon";

  return (
    <div
      style={{
        background: surface,
        borderRadius: 22,
        overflow: "hidden",
        boxShadow:
          "0 4px 30px rgba(0,51,52,0.06), inset 0 0 0 1px rgba(0,106,103,0.07)",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 250ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {/* Gold accent top stripe for closing-soon */}
      {isClosingSoon && (
        <div
          style={{
            height: 3,
            background: `linear-gradient(to left, ${gold}, rgba(212,175,55,0.3))`,
          }}
        />
      )}

      <div style={{ padding: "20px 22px 18px", flex: 1 }}>
        {/* Category + status badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 10px",
              borderRadius: 99,
              background: "rgba(0,106,103,0.08)",
              color: secondary,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            <Tag size={10} />
            {tender.category}
          </span>
          {isClosingSoon && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 10px",
                borderRadius: 99,
                background: "rgba(212,175,55,0.12)",
                color: "#9a7a12",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              ينتهي قريباً
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            margin: "0 0 14px",
            color: primary,
            fontSize: "clamp(0.9rem, 1.4vw, 1.05rem)",
            fontWeight: 700,
            lineHeight: 1.5,
            fontFamily: IBM_PLEX,
          }}
        >
          {tender.title}
        </h3>

        {/* Meta info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={13} style={{ color: secondary, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "rgba(0,51,52,0.6)", fontWeight: 500 }}>
              {tender.entity}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={13} style={{ color: secondary, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "rgba(0,51,52,0.6)", fontWeight: 500 }}>
              {tender.location}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={13} style={{ color: secondary, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "rgba(0,51,52,0.6)", fontWeight: 500 }}>
              آخر تاريخ: {tender.deadline}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "14px 22px",
          background: "rgba(0,106,103,0.03)",
          borderTop: "1px solid rgba(0,106,103,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <span style={{ fontSize: 11, color: "rgba(0,51,52,0.35)", fontWeight: 600 }}>
            الميزانية التقديرية
          </span>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: primary,
              marginTop: 1,
            }}
          >
            {tender.budget}
          </div>
        </div>
        <Link
          href="/dashboard/engine"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 16px",
            borderRadius: 12,
            background: primary,
            color: surface,
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 4px 14px rgba(0,51,52,0.2)",
            transition: "all 200ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          توليد عرض
          <ArrowLeft size={12} />
        </Link>
      </div>
    </div>
  );
}

export default function TendersPage() {
  const [query, setQuery] = useState("");

  const filtered = TENDERS.filter(
    (t) =>
      !query.trim() ||
      t.title.includes(query) ||
      t.entity.includes(query) ||
      t.category.includes(query) ||
      t.location.includes(query),
  );

  return (
    <div
      dir="rtl"
      style={{ fontFamily: IBM_PLEX, display: "flex", flexDirection: "column", gap: 28 }}
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
          Government Tenders
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
          المناقصات الحكومية
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

      {/* Search bar */}
      <div
        style={{
          position: "relative",
          maxWidth: 560,
        }}
      >
        <Search
          size={16}
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            color: secondary,
            pointerEvents: "none",
          }}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في المناقصات الحكومية..."
          dir="rtl"
          style={{
            width: "100%",
            padding: "13px 44px 13px 18px",
            borderRadius: 14,
            border: "none",
            background: surface,
            color: primary,
            fontSize: 14,
            fontFamily: IBM_PLEX,
            outline: "none",
            boxShadow:
              "0 4px 20px rgba(0,51,52,0.07), inset 0 0 0 1px rgba(0,106,103,0.1)",
          }}
        />
      </div>

      {/* Tender count */}
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: "rgba(0,51,52,0.45)",
          fontWeight: 500,
        }}
      >
        {filtered.length === TENDERS.length
          ? `${TENDERS.length} مناقصة متاحة`
          : `${filtered.length} نتيجة من ${TENDERS.length}`}
      </p>

      {/* Tenders bento grid */}
      {filtered.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 18,
          }}
        >
          {filtered.map((tender) => (
            <TenderCard key={tender.id} tender={tender} />
          ))}
        </div>
      ) : (
        <div
          style={{
            background: surface,
            borderRadius: 20,
            padding: "48px 28px",
            textAlign: "center",
            boxShadow:
              "0 4px 24px rgba(0,51,52,0.04), inset 0 0 0 1px rgba(0,106,103,0.06)",
          }}
        >
          <Search size={28} style={{ color: secondary, marginBottom: 12, opacity: 0.5 }} />
          <p style={{ margin: 0, color: "rgba(0,51,52,0.45)", fontSize: 14, fontWeight: 500 }}>
            لا توجد نتائج لـ «{query}»
          </p>
          <p style={{ margin: "6px 0 0", color: "rgba(0,51,52,0.3)", fontSize: 12 }}>
            جرب كلمات بحث مختلفة
          </p>
        </div>
      )}
    </div>
  );
}
