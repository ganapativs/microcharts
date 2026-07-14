import type { Metadata } from "next";
import { docsMeta } from "@/lib/metadata";
import { BrandClearSpace } from "@/components/brand/clear-space";
import { BrandColorSection } from "@/components/brand/color-section";
import { BrandHero } from "@/components/brand/hero";
import { BrandLogoVariants } from "@/components/brand/logo-variants";
import { BrandMarkSection } from "@/components/brand/mark-section";
import { BrandMisuse } from "@/components/brand/misuse";
import { BrandNameSection } from "@/components/brand/name-section";
import { BrandPermission } from "@/components/brand/permission";
import { BrandTypeSection } from "@/components/brand/type-section";

export const metadata: Metadata = docsMeta({
  title: "Brand",
  description:
    "The microcharts mark, logo variants, colors, and type — with clear-space rules, usage guidance, and downloadable SVG assets.",
  path: "/brand",
});

export default function BrandPage() {
  return (
    <>
      <BrandHero />
      <BrandMarkSection />
      <BrandLogoVariants />
      <BrandClearSpace />
      <BrandMisuse />
      <BrandColorSection />
      <BrandTypeSection />
      <BrandNameSection />
      <BrandPermission />
    </>
  );
}
