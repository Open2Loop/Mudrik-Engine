import Link from "next/link";
import { Star } from "lucide-react";
import { GithubIcon } from "@/components/github-icon";
import { BRAND_NAME, GITHUB_REPO_URL } from "@/lib/brand";

export function GitHubStarBanner() {
  return (
    <div className="relative z-[60] border-b border-ghost bg-gradient-to-l from-primary via-[#024a48] to-primary text-surface">
      <div className="mx-auto flex w-full max-w-[min(94vw,1280px)] flex-wrap items-center justify-center gap-2 px-[var(--fluid-shell-gutter)] py-2.5 text-[clamp(0.78rem,0.72rem+0.25vw,0.9rem)]">
        <GithubIcon size={16} className="shrink-0 opacity-90" />
        <span className="text-center leading-snug">
          {BRAND_NAME} منصة <strong className="font-bold">مفتوحة المصدر</strong> — ساهم في تطويرها
        </span>
        <Link
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-surface/15 px-3.5 py-1 font-bold text-surface ring-1 ring-surface/25 transition hover:bg-surface/25"
        >
          <Star size={14} className="text-amber-300" aria-hidden />
          <span>أضف نجمة على GitHub</span>
        </Link>
      </div>
    </div>
  );
}
