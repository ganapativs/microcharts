import type { Metadata } from "next";
import { ProseDoc } from "@/components/prose-doc";
import { docsMeta } from "@/lib/metadata";
import { CONTACT_PAGE } from "@/lib/trust-pages";

export const metadata: Metadata = docsMeta({
  title: CONTACT_PAGE.title,
  description: CONTACT_PAGE.description,
  path: "/contact",
  markdown: "/contact.md",
});

export default function ContactPage() {
  return <ProseDoc page={CONTACT_PAGE} />;
}
