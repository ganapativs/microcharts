import type { ReactNode } from "react";
import "@microcharts/react/styles.css";

export const metadata = {
  title: "microcharts — Next RSC fixture",
  description: "Checkpoint 1: static charts render server-side with zero client JS.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
