"use client";

import Link from "next/link";
import { Archive, Building2, Cpu, Settings, Star, Vault } from "lucide-react";
import { GithubIcon } from "@/components/github-icon";
import type { ReactNode } from "react";
import { MunakasaLogo } from "@/components/munakasa-logo";
import { BRAND_NAME, GITHUB_REPO_URL } from "@/lib/brand";

const nav = [
  { href: "/command-center", label: "المحرك", icon: Cpu },
  { href: "/archive", label: "الأرشيف", icon: Archive },
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
      <header className="sticky top-0 z-50 bg-surface/85 shadow-[0_1px_0_rgba(0,106,103,0.08)] backdrop-blur-md">
        <div className="app-shell-header-inner">
          <div className="flex min-w-0 items-center gap-[clamp(1rem,2vw,3rem)]">
            <Link
              href="/"
              prefetch
              className="flex items-center gap-2 text-[clamp(1rem,0.9rem+0.7vw,1.35rem)] font-bold tracking-tight text-primary"
              aria-label={`الرئيسية — ${BRAND_NAME}`}
            >
              <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <MunakasaLogo size={20} />
              </div>
              <span>{BRAND_NAME}</span>
            </Link>
            <nav className="hidden min-w-0 items-center gap-[clamp(0.8rem,1.4vw,2rem)] overflow-x-auto whitespace-nowrap text-[clamp(0.82rem,0.76rem+0.3vw,0.96rem)] font-semibold text-mist md:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 transition-all hover:translate-y-[-1px] hover:text-secondary active:translate-y-0"
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-ghost px-[clamp(0.75rem,1.2vw,1.1rem)] py-[clamp(0.45rem,0.7vw,0.65rem)] text-[clamp(0.78rem,0.72rem+0.25vw,0.9rem)] font-bold text-mist transition-all hover:border-secondary/40 hover:bg-secondary/5 hover:text-secondary"
            >
              <GithubIcon size={16} />
              <Star size={14} className="text-amber-500" aria-hidden />
              <span className="hidden sm:inline">GitHub</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="app-shell-main">
        <div className="mb-[clamp(1rem,2.5vh,2.5rem)] space-y-2">
          <h1 className="text-[clamp(1.45rem,1.1rem+1.6vw,2.5rem)] font-extrabold tracking-tight text-primary">
            {title}
          </h1>
          <div className="h-1.5 w-12 rounded-full bg-secondary/25" />
        </div>
        <div className="mt-[clamp(0.8rem,2.2vh,2rem)]">{children}</div>
      </main>
    </div>
  );
}
