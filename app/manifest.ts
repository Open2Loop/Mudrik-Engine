import type { MetadataRoute } from "next";
import { BRAND_NAME, BRAND_NAME_EN } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND_NAME} · ${BRAND_NAME_EN}`,
    short_name: BRAND_NAME,
    description:
      "منصة مفتوحة المصدر لتحليل كراسات الشروط وإعداد العروض الفنية للمناقصات الحكومية السعودية.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#006A67",
    lang: "ar",
    dir: "rtl",
    scope: SITE_URL,
  };
}
