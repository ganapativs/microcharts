import { markPng } from "@/lib/mark-png";

export const dynamic = "force-static";
export const contentType = "image/png";

export function GET() {
  return markPng(512);
}
