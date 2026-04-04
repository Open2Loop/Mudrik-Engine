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
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-12">
            <Link href="/vault" className="flex items-center gap-2 text-xl font-bold text-midnight tracking-tight">
              <div className="rounded-lg bg-midnight p-1.5 text-white">
                <MudrikLogo size={20} />
              </div>
              <span>مُدْرِك</span>
            </Link>
            <nav className="hidden md:flex flex-wrap gap-8 text-sm font-semibold text-mist">
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
          <div className="flex items-center gap-4">
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-bold text-mist transition-all hover:bg-slate-50 hover:text-midnight hover:border-slate-300"
              >
                <span>خروج</span>
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-midnight md:text-4xl">{title}</h1>
          <div className="h-1.5 w-12 rounded-full bg-midnight/10" />
        </div>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
