"use client";

import Link from "next/link";
import { LogOut, Vault, Cpu, Settings, Building2 } from "lucide-react";
import type { ReactNode } from "react";
import { MudrikLogo } from "@/components/mudrik-logo";

const nav = [
  { href: "/command-center", label: "المحرك", icon: Cpu },
  { href: "/vault", label: "الخزنة", icon: Vault },
  { href: "/company-profile", label: "ملف الشركة", icon: Building2 },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function AppShell({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="app-shell-frame bg-surface font-sans">
      {/*
        No-Line rule: the former `border-b border-slate-200` sectioning line
        is replaced by tonal layering — a translucent surface panel with a
        soft shadow differentiates the sticky header from the body.
      */}
      <header className="bg-surface/85 backdrop-blur-md sticky top-0 z-50 shadow-[0_1px_0_rgba(0,106,103,0.08)]">
        <div className="app-shell-header-inner">
          <div className="flex min-w-0 items-center gap-[clamp(1rem,2vw,3rem)]">
            <Link
              href="/"
              prefetch
              className="flex items-center gap-2 text-[clamp(1rem,0.9rem+0.7vw,1.35rem)] font-bold text-primary tracking-tight"
              aria-label="الرئيسية — مُدْرِك"
            >
              <div className="rounded-lg bg-primary p-1.5 text-surface">
                <MudrikLogo size={20} />
              </div>
              <span>مُدْرِك</span>
            </Link>
            <nav className="hidden md:flex min-w-0 items-center gap-[clamp(0.8rem,1.4vw,2rem)] overflow-x-auto whitespace-nowrap text-[clamp(0.82rem,0.76rem+0.3vw,0.96rem)] font-semibold text-mist">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 transition-all hover:text-secondary hover:translate-y-[-1px] active:translate-y-0"
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-[clamp(0.5rem,1vw,1rem)]">
            <form action="/api/auth/signout" method="post">
              {/* Ghost Border: secondary @ 15 % — the only sanctioned sectioning line. */}
              <button
                type="submit"
                className="flex items-center gap-2 rounded-full border border-ghost px-[clamp(0.8rem,1.3vw,1.25rem)] py-[clamp(0.45rem,0.7vw,0.7rem)] text-[clamp(0.8rem,0.74rem+0.25vw,0.92rem)] font-bold text-mist transition-all hover:bg-secondary/5 hover:text-secondary"
              >
                <span>خروج</span>
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="app-shell-main">
        <div className="mb-[clamp(1rem,2.5vh,2.5rem)] space-y-2">
          <h1 className="text-[clamp(1.45rem,1.1rem+1.6vw,2.5rem)] font-extrabold tracking-tight text-primary">{title}</h1>
          <div className="h-1.5 w-12 rounded-full bg-secondary/25" />
        </div>
        <div className="mt-[clamp(0.8rem,2.2vh,2rem)]">{children}</div>
      </main>
    </div>
  );
}
