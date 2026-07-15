import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Newsreader } from "next/font/google";
import "./lab.css";

/** Design-lab routes: three competing first-fold prototypes. Not indexed. */

const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif-src",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Design lab",
  robots: { index: false, follow: false },
};

export default function LabLayout({ children }: { children: ReactNode }) {
  return <div className={`${serif.variable} lab-root`}>{children}</div>;
}
