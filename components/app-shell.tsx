"use client";

import Link from "next/link";
import { LogOut, Vault, Cpu, Settings, Building2 } from "lucide-react";
import type { ReactNode } from "react";
import { MudrikLogo } from "@/components/mudrik-logo";

const nav = [
  { href: "/vault", label: "الخزنة", icon: Vault },
  { href: "/engine", label: "المحرك", icon: Cpu },
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
    <div className="app-shell-frame bg-[#F8FAFC] font-sans">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="app-shell-header-inner">
          <div className="flex min-w-0 items-center gap-[clamp(1rem,2vw,3rem)]">
            <Link
              href="/"
              prefetch
              className="flex items-center gap-2 text-[clamp(1rem,0.9rem+0.7vw,1.35rem)] font-bold text-midnight tracking-tight"
              aria-label="الرئيسية — مُدْرِك"
            >
              <div className="rounded-lg bg-midnight p-1.5 text-white">
                <MudrikLogo size={20} />
              </div>
              <span>مُدْرِك</span>
            </Link>
            <nav className="hidden md:flex min-w-0 items-center gap-[clamp(0.8rem,1.4vw,2rem)] overflow-x-auto whitespace-nowrap text-[clamp(0.82rem,0.76rem+0.3vw,0.96rem)] font-semibold text-mist">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 transition-all hover:text-midnight hover:translate-y-[-1px] active:translate-y-0"
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-[clamp(0.5rem,1vw,1rem)]">
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-full border border-slate-200 px-[clamp(0.8rem,1.3vw,1.25rem)] py-[clamp(0.45rem,0.7vw,0.7rem)] text-[clamp(0.8rem,0.74rem+0.25vw,0.92rem)] font-bold text-mist transition-all hover:bg-slate-50 hover:text-midnight hover:border-slate-300"
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
          <h1 className="text-[clamp(1.45rem,1.1rem+1.6vw,2.5rem)] font-extrabold tracking-tight text-midnight">{title}</h1>
          <div className="h-1.5 w-12 rounded-full bg-midnight/10" />
        </div>
        <div className="mt-[clamp(0.8rem,2.2vh,2rem)]">{children}</div>
      </main>
    </div>
  );
}
