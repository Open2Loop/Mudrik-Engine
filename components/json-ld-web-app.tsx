import { BRAND_NAME, BRAND_NAME_EN, BRAND_TAGLINE, GITHUB_REPO_URL } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";

/** WebApplication JSON-LD for search engines (Arabic + English). */
export function JsonLdWebApp() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: BRAND_NAME,
    alternateName: BRAND_NAME_EN,
    description: BRAND_TAGLINE,
    url: SITE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: ["ar", "en"],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "SAR",
      description:
        "Open-source BYOK platform — users supply their own Gemini or OpenAI API keys.",
    },
    featureList: [
      "Tender document analysis (كراسات الشروط)",
      "Technical proposal generation",
      "Compliance mapping (SBC, SASO, LCGPA)",
      "DOCX export",
      "Document vault and archive",
      "Company profile for proposals",
    ],
    isAccessibleForFree: true,
    codeRepository: GITHUB_REPO_URL,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
