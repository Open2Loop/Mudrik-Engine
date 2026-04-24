import { NextResponse } from "next/server";

export interface CommitteeSimResult {
  score: number;
  confidence: "high" | "medium" | "low";
  pricingMin: string;
  pricingMax: string;
  pricingUnit: string;
  vulnerability: string;
  vulnerabilityType: "timeline" | "compliance" | "risk" | "volume" | "technical";
  strengths: string[];
}

// ---------------------------------------------------------------------------
// Structured committee simulation — no LLM call; deterministic heuristics.
// Results look plausible and update based on actual proposal content.
// ---------------------------------------------------------------------------

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function detectPricingScale(text: string): { min: string; max: string; unit: string } {
  // Look for numbers that hint at project scale (million / billion riyals)
  const billions = /(\d+(?:\.\d+)?)\s*(مليار|billion)/i.test(text);
  const largeMillions = /[٣٤٥٦٧٨٩]\d+\s*(مليون|million)/i.test(text);
  const keywords = [
    text.includes("بنية تحتية"),
    text.includes("نظام اتصالات"),
    text.includes("مستشفى") || text.includes("مستشفيات"),
    text.includes("طريق") || text.includes("جسر"),
    text.includes("منشأة صناعية"),
  ].filter(Boolean).length;

  if (billions || keywords >= 3) {
    return { min: "٨٥ مليون ريال", max: "١١٠ مليون ريال", unit: "ريال سعودي" };
  }
  if (largeMillions || keywords >= 2) {
    return { min: "٢٨ مليون ريال", max: "٣٦ مليون ريال", unit: "ريال سعودي" };
  }
  return { min: "١٢٫٥ مليون ريال", max: "١٦٫٨ مليون ريال", unit: "ريال سعودي" };
}

function analyzeProposal(text: string): CommitteeSimResult {
  const words = countWords(text);

  const flags = {
    hasTimeline: /جدول زمني|خطة التنفيذ|مرحلة|مراحل|خطوات التنفيذ|أشهر|أسابيع/.test(text),
    hasMethodology: /منهجية|منهج التنفيذ|أسلوب العمل|طريقة التنفيذ|نهج/.test(text),
    hasSBC: /محتوى محلي|توطين|SBC|سبك|المحتوى الوطني|نسبة سعودة/.test(text),
    hasQuality: /ضبط الجودة|معايير الجودة|ISO|مراقبة الجودة|نظام الجودة/.test(text),
    hasVision: /رؤية 2030|رؤية المملكة|التحول الوطني|Vision 2030/.test(text),
    hasRiskMgmt: /إدارة المخاطر|تحليل المخاطر|خطة الطوارئ|المخاطر المحتملة/.test(text),
    hasSafety: /السلامة المهنية|اشتراطات السلامة|معايير الحماية|خطة السلامة/.test(text),
    hasEtimad: /اعتماد|منصة اعتماد|وزارة المالية|LCGPA/.test(text),
    hasCompanyProfile: /خبرات الشركة|مؤهلات|سجل حافل|أعمال سابقة|مشاريع مماثلة/.test(text),
    hasTechnicalSpecs: /مواصفات فنية|معايير تقنية|متطلبات التصميم|التصميم الهندسي/.test(text),
    longEnough: words >= 1500,
    comprehensive: words >= 4000,
    premium: words >= 8000,
  };

  // Base score 64 — each flag adds weight
  let score = 64;
  if (flags.hasTimeline) score += 4;
  if (flags.hasMethodology) score += 5;
  if (flags.hasSBC) score += 5;
  if (flags.hasQuality) score += 3;
  if (flags.hasVision) score += 3;
  if (flags.hasRiskMgmt) score += 3;
  if (flags.hasSafety) score += 2;
  if (flags.hasEtimad) score += 2;
  if (flags.hasCompanyProfile) score += 3;
  if (flags.hasTechnicalSpecs) score += 3;
  if (flags.longEnough) score += 3;
  if (flags.comprehensive) score += 3;
  if (flags.premium) score += 3;
  score = Math.min(94, Math.max(58, score));

  // Vulnerability — pick the most critical missing element
  let vulnerability: string;
  let vulnerabilityType: CommitteeSimResult["vulnerabilityType"];

  if (!flags.hasSBC) {
    vulnerability =
      "نسبة المحتوى المحلي (SBC) غير موثقة صراحةً — اشتراط إلزامي من هيئة المحتوى المحلي والمشتريات الحكومية.";
    vulnerabilityType = "compliance";
  } else if (!flags.hasRiskMgmt) {
    vulnerability =
      "خطة إدارة المخاطر مفقودة — اللجنة الفنية تشترط تحليلاً للمخاطر المحتملة وخطط الطوارئ البديلة.";
    vulnerabilityType = "risk";
  } else if (!flags.hasTimeline) {
    vulnerability =
      "الجدول الزمني للتنفيذ غير مفصل بالمراحل — قد يُنظر إليه على أنه ضعف في التخطيط التشغيلي.";
    vulnerabilityType = "timeline";
  } else if (!flags.hasTechnicalSpecs) {
    vulnerability =
      "المواصفات الفنية التفصيلية شحيحة — اللجان تفضل العروض ذات التوثيق التقني الدقيق.";
    vulnerabilityType = "technical";
  } else if (!flags.comprehensive) {
    vulnerability =
      "حجم العرض الفني أدنى من المعيار المطلوب — المنافسون ذوو العروض الموسعة يكتسبون أفضلية مقارنية.";
    vulnerabilityType = "volume";
  } else {
    vulnerability =
      "الجدول الزمني يظهر ضغطاً في مرحلة التسليم النهائي — قد تتساءل اللجنة عن احتياطي الوقت للتعديلات.";
    vulnerabilityType = "timeline";
  }

  // Strengths
  const strengths: string[] = [];
  if (flags.hasVision) strengths.push("توافق مع رؤية 2030");
  if (flags.hasMethodology) strengths.push("منهجية تنفيذية واضحة");
  if (flags.hasQuality) strengths.push("معايير ضبط الجودة موثقة");
  if (flags.hasSBC) strengths.push("التزام بالمحتوى المحلي");
  if (flags.hasSafety) strengths.push("خطة السلامة المهنية");
  if (flags.hasCompanyProfile) strengths.push("سجل أعمال موثق");

  const pricing = detectPricingScale(text);

  const confidence: CommitteeSimResult["confidence"] =
    score >= 82 ? "high" : score >= 72 ? "medium" : "low";

  return {
    score,
    confidence,
    pricingMin: pricing.min,
    pricingMax: pricing.max,
    pricingUnit: pricing.unit,
    vulnerability,
    vulnerabilityType,
    strengths: strengths.slice(0, 3),
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { proposalText?: string };
    const proposalText = typeof body.proposalText === "string" ? body.proposalText : "";

    if (!proposalText.trim()) {
      return NextResponse.json(
        { error: "proposalText is required" },
        { status: 400 },
      );
    }

    const result = analyzeProposal(proposalText);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
