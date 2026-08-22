import type { Metadata } from "next";
import { ProseDoc } from "@/components/prose-doc";
import { docsMeta } from "@/lib/metadata";
import { PRIVACY_PAGE } from "@/lib/trust-pages";

export const metadata: Metadata = docsMeta({
  title: PRIVACY_PAGE.title,
  description: PRIVACY_PAGE.description,
  path: "/privacy",
  markdown: "/privacy.md",
});

export default function PrivacyPage() {
  return <ProseDoc page={PRIVACY_PAGE} />;
}
