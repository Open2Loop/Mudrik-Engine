"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Search, Cpu, LogOut } from "lucide-react";
import { MudrikLogo } from "@/components/mudrik-logo";

const navItems = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/tenders", label: "المناقصات", icon: Search },
  { href: "/dashboard/proposals", label: "عروضي الفنية", icon: FileText },
  { href: "/dashboard/engine", label: "محرك التوليد", icon: Cpu },
];

const IBM_PLEX =
  "var(--font-ibm-plex), 'IBM Plex Sans Arabic', system-ui, sans-serif";
const surface = "#f7fafa";
const gold = "#D4AF37";

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside
      dir="rtl"
      style={{
        width: 252,
        minHeight: "100dvh",
        background:
          "linear-gradient(175deg, #003334 0%, #002425 55%, #001f20 100%)",
        display: "flex",
        flexDirection: "column",
        padding: "28px 16px 24px",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100dvh",
        overflowY: "auto",
        fontFamily: IBM_PLEX,
        boxShadow: "-1px 0 0 rgba(0,106,103,0.12)",
      }}
    >
      {/* Logo lockup */}
      <Link
        href="/dashboard"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 36,
          textDecoration: "none",
        }}
      >
        <div
          style={{
            borderRadius: 12,
            background: "rgba(247,250,250,0.07)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            padding: 9,
            boxShadow: `inset 0 0 0 1px rgba(212,175,55,0.18), 0 4px 16px rgba(0,0,0,0.22)`,
          }}
        >
          <MudrikLogo size={22} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span
            style={{
              color: surface,
              fontWeight: 700,
              fontSize: 17,
              lineHeight: 1.1,
            }}
          >
            مُدْرِك
          </span>
          <span
            style={{
              color: "rgba(247,250,250,0.35)",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Mudrik Platform
          </span>
        </div>
      </Link>

      {/* Section label */}
      <p
        style={{
          color: "rgba(247,250,250,0.25)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 8,
          paddingRight: 12,
        }}
      >
        القائمة الرئيسية
      </p>

      {/* Nav items */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 12,
                textDecoration: "none",
                color: isActive ? surface : "rgba(247,250,250,0.5)",
                background: isActive
                  ? "rgba(0,106,103,0.32)"
                  : "transparent",
                fontWeight: isActive ? 600 : 500,
                fontSize: 14,
                transition: "all 200ms cubic-bezier(0.22,1,0.36,1)",
                boxShadow: isActive
                  ? `inset 0 0 0 1px rgba(212,175,55,0.14), 0 2px 12px rgba(0,106,103,0.18)`
                  : "none",
                position: "relative",
              }}
            >
              {isActive && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "20%",
                    bottom: "20%",
                    width: 3,
                    borderRadius: "3px 0 0 3px",
                    background: gold,
                    boxShadow: `0 0 8px ${gold}`,
                  }}
                />
              )}
              <item.icon
                size={15}
                style={{
                  color: isActive ? "#006a67" : "rgba(247,250,250,0.35)",
                  flexShrink: 0,
                }}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: "rgba(0,106,103,0.15)",
          margin: "16px 0",
          borderRadius: 1,
        }}
      />

      {/* Sign-out */}
      <form action="/api/auth/signout" method="post">
        <button
          type="submit"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 12,
            border: "none",
            background: "transparent",
            color: "rgba(247,250,250,0.35)",
            fontWeight: 500,
            fontSize: 14,
            cursor: "pointer",
            fontFamily: IBM_PLEX,
            transition: "all 200ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          خروج
        </button>
      </form>
    </aside>
  );
}
