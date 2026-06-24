import Link from "next/link";
import {
  Archive,
  Building2,
  Cpu,
  FileSearch,
  FileText,
  GitBranch,
  ShieldCheck,
  Sparkles,
  Vault,
} from "lucide-react";
import { GitHubStarBanner } from "@/components/github-star-banner";
import { MunakasaLogo } from "@/components/munakasa-logo";
import { BRAND_NAME, BRAND_TAGLINE, GITHUB_REPO_URL } from "@/lib/brand";

const MODULES = [
  {
    icon: Cpu,
    title: "محرك التوليد",
    href: "/command-center",
    body: "تحليل كراسة الشروط، استخراج المتطلبات، توليد مسودات فنية متعددة الأقسام، وتقدير WBS وBOQ بمساعدة نماذج ذكاء اصطناعي محلية أو سحابية.",
  },
  {
    icon: Vault,
    title: "الخزنة",
    href: "/vault",
    body: "رفع وتخزين كراسات الشروط والمرفقات، مع فهرسة نصية وبحث دلالي لربط المتطلبات بخبرات المشاريع السابقة.",
  },
  {
    icon: Archive,
    title: "الأرشيف",
    href: "/archive",
    body: "أرشفة العروض والمسودات المُولَّدة مع تتبع الإصدارات وإعادة استخدام المحتوى المعتمد في مناقصات لاحقة.",
  },
  {
    icon: Building2,
    title: "ملف الشركة",
    href: "/company-profile",
    body: "تعريف القدرات والشهادات والخبرات السابقة لحقنها تلقائياً في العروض الفنية بما يتوافق مع متطلبات اعتماد الموردين.",
  },
] as const;

const WORKFLOW = [
  {
    step: "١",
    title: "استيراد الكراسة",
    body: "رفع ملف PDF أو Word لكراسة الشروط والمواصفات عبر الخزنة أو المحرك مباشرة.",
  },
  {
    step: "٢",
    title: "التحليل والامتثال",
    body: "استخلاص البنود الإلزامية، ربطها بمعايير SBC وSASO ومتطلبات المحتوى المحلي، وكشف الفجوات.",
  },
  {
    step: "٣",
    title: "التوليد والتصدير",
    body: "صياغة عرض فني منظم، مع تصدير DOCX جاهز للمراجعة والتقديم عبر بوابة اعتماد أو منصات المناقصات.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="app-shell-frame bg-surface min-h-screen">
      <GitHubStarBanner />

      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md shadow-[0_1px_0_rgba(0,106,103,0.08)]">
        <div className="app-shell-header-inner">
          <Link
            href="/"
            prefetch
            className="flex items-center gap-2.5 text-[clamp(1rem,0.9rem+0.7vw,1.35rem)] font-bold text-primary tracking-tight"
            aria-label={`${BRAND_NAME} — الرئيسية`}
          >
            <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/25">
              <MunakasaLogo size={20} />
            </div>
            <span>{BRAND_NAME}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-[clamp(0.82rem,0.76rem+0.3vw,0.92rem)] font-semibold text-mist md:flex">
            <a href="#modules" className="transition hover:text-secondary">
              الوحدات
            </a>
            <a href="#workflow" className="transition hover:text-secondary">
              آلية العمل
            </a>
            <a href="#opensource" className="transition hover:text-secondary">
              المصدر المفتوح
            </a>
          </nav>
          <Link
            href="/command-center"
            className="rounded-full bg-primary px-[clamp(0.9rem,1.5vw,1.5rem)] py-[clamp(0.5rem,0.8vw,0.75rem)] text-[clamp(0.8rem,0.74rem+0.3vw,0.95rem)] font-bold text-surface shadow-lg shadow-primary/20 transition hover:bg-[#042323]"
          >
            ابدأ بدون تسجيل
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-[var(--fluid-shell-gutter)] pb-[clamp(3rem,8vh,6rem)] pt-[clamp(2.5rem,6vh,5rem)]">
          <div
            className="pointer-events-none absolute inset-0 munakasa-hero-mesh"
            aria-hidden
          />
          <div className="relative mx-auto max-w-[min(94vw,72rem)] text-center">
            <p className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-ghost bg-white/70 px-4 py-1.5 text-[clamp(0.78rem,0.72rem+0.22vw,0.88rem)] font-semibold text-secondary backdrop-blur-sm">
              <Sparkles size={14} aria-hidden />
              مفتوح المصدر · جاهز للنشر الحكومي
            </p>
            <h1 className="text-[clamp(1.75rem,1.2rem+2vw,3.25rem)] font-extrabold leading-[1.35] text-primary munakasa-heading-rule">
              {BRAND_NAME}
              <span className="mt-2 block text-[clamp(1.1rem,0.95rem+0.9vw,1.65rem)] font-bold text-secondary">
                {BRAND_TAGLINE}
              </span>
            </h1>
            <p className="mx-auto mt-[clamp(1rem,2.5vh,1.75rem)] max-w-[min(100%,44rem)] text-start text-[clamp(0.95rem,0.86rem+0.4vw,1.12rem)] leading-[1.85] text-charcoal">
              منصة عربية متكاملة لأتمتة دورة حياة المناقصة: من قراءة كراسة الشروط (RFP) واستخراج
              المتطلبات، إلى مقارنتها بسجل الخبرات، ثم توليد مسودات عروض فنية ومالية متوافقة مع
              معايير المشتريات الحكومية السعودية — دون حاجة لإنشاء حساب للبدء.
            </p>
            <div className="mt-[clamp(1.25rem,3.5vh,2.5rem)] flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/command-center"
                className="rounded-full bg-primary px-8 py-3.5 text-[clamp(0.88rem,0.8rem+0.3vw,1rem)] font-bold text-surface shadow-md shadow-primary/25 transition hover:bg-[#042323]"
              >
                تشغيل المحرك الآن
              </Link>
              <Link
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-ghost bg-white/80 px-8 py-3.5 text-[clamp(0.88rem,0.8rem+0.3vw,1rem)] font-bold text-primary backdrop-blur-sm transition hover:border-secondary/40 hover:text-secondary"
              >
                استعراض الكود المصدري
              </Link>
            </div>
            <ul className="mx-auto mt-10 grid max-w-3xl gap-3 text-start sm:grid-cols-3">
              {[
                { icon: FileSearch, label: "تحليل كراسات الشروط" },
                { icon: ShieldCheck, label: "فحص الامتثال والفجوات" },
                { icon: FileText, label: "تصدير DOCX رسمي" },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2.5 rounded-2xl border border-ghost bg-white/60 px-4 py-3 text-[clamp(0.82rem,0.76rem+0.25vw,0.92rem)] font-semibold text-tertiary backdrop-blur-sm"
                >
                  <item.icon size={18} className="shrink-0 text-secondary" aria-hidden />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Modules */}
        <section
          id="modules"
          className="border-t border-ghost/80 bg-white/50 px-[var(--fluid-shell-gutter)] py-[clamp(2.5rem,6vh,5rem)]"
        >
          <div className="mx-auto max-w-[min(94vw,72rem)]">
            <h2 className="text-[clamp(1.35rem,1.1rem+1vw,2rem)] font-extrabold text-primary">
              وحدات المنصة
            </h2>
            <p className="mt-2 max-w-2xl text-[clamp(0.9rem,0.84rem+0.3vw,1.05rem)] leading-relaxed text-mist">
              كل وحدة مصممة لمرحلة محددة في مسار المناقصة — من الاستيعاب الأولي للكراسة حتى
              الأرشفة والتقديم.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {MODULES.map((mod) => (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className="group munakasa-card flex flex-col gap-3 p-6 transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition group-hover:bg-secondary group-hover:text-white">
                      <mod.icon size={22} aria-hidden />
                    </span>
                    <h3 className="text-[clamp(1.05rem,0.95rem+0.4vw,1.2rem)] font-bold text-primary">
                      {mod.title}
                    </h3>
                  </div>
                  <p className="text-start text-[clamp(0.86rem,0.8rem+0.25vw,0.96rem)] leading-relaxed text-charcoal">
                    {mod.body}
                  </p>
                  <span className="mt-auto text-start text-sm font-bold text-secondary">
                    فتح الوحدة ←
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section
          id="workflow"
          className="px-[var(--fluid-shell-gutter)] py-[clamp(2.5rem,6vh,5rem)]"
        >
          <div className="mx-auto max-w-[min(94vw,56rem)] text-center">
            <h2 className="text-[clamp(1.35rem,1.1rem+1vw,2rem)] font-extrabold text-primary">
              من الكراسة إلى العرض الفني
            </h2>
            <p className="mt-2 text-mist">مسار عمل ثلاثي المراحل يغطي أغلب متطلبات فرق المناقصات.</p>
            <ol className="mt-10 grid gap-6 text-start md:grid-cols-3">
              {WORKFLOW.map((item) => (
                <li key={item.step} className="munakasa-card relative p-6 pt-8">
                  <span className="absolute -top-3 start-6 inline-flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-surface shadow-md">
                    {item.step}
                  </span>
                  <h3 className="font-bold text-primary">{item.title}</h3>
                  <p className="mt-2 text-[clamp(0.86rem,0.8rem+0.25vw,0.96rem)] leading-relaxed text-charcoal">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Open source */}
        <section
          id="opensource"
          className="border-t border-ghost/80 bg-gradient-to-b from-surface to-white px-[var(--fluid-shell-gutter)] py-[clamp(2.5rem,6vh,5rem)]"
        >
          <div className="mx-auto flex max-w-[min(94vw,56rem)] flex-col items-center gap-6 text-center">
            <GitBranch size={32} className="text-secondary" aria-hidden />
            <h2 className="text-[clamp(1.35rem,1.1rem+1vw,2rem)] font-extrabold text-primary">
              مفتوح المصدر بالكامل
            </h2>
            <p className="max-w-xl text-[clamp(0.9rem,0.84rem+0.3vw,1.05rem)] leading-relaxed text-charcoal">
              الشفرة متاحة على GitHub للمراجعة والمساهمة والنشر الذاتي. يمكنك تشغيل المنصة محلياً
              أو على Vercel مع مفاتيحك الخاصة لنماذج الذكاء الاصطناعي وقاعدة Supabase.
            </p>
            <Link
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-secondary px-8 py-3.5 font-bold text-surface shadow-lg shadow-secondary/25 transition hover:bg-[#005a57]"
            >
              منح نجمة ومتابعة المستودع
            </Link>
          </div>
        </section>
      </main>

      <footer className="shadow-[0_-1px_0_rgba(0,106,103,0.08)] py-[clamp(0.9rem,2.4vh,2rem)] text-[clamp(0.72rem,0.68rem+0.2vw,0.84rem)] text-mist">
        <div
          dir="ltr"
          className="mx-auto flex w-full max-w-[min(94vw,1280px)] flex-col gap-4 px-[var(--fluid-shell-gutter)] sm:flex-row sm:items-center sm:justify-between sm:gap-6"
        >
          <p dir="rtl" className="text-start leading-snug">
            نظام تقني مسجل رسميا
          </p>
          <p dir="rtl" className="text-center sm:text-end sm:shrink-0">
            © {new Date().getFullYear()} {BRAND_NAME}. مفتوح المصدر — جميع الحقوق محفوظة للمؤلف.
          </p>
        </div>
      </footer>
    </div>
  );
}
