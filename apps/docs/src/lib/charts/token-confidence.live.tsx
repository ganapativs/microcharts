import type { ChartModule, PlaygroundSpec } from "./types";
import { TokenConfidence } from "@microcharts/react/token-confidence";
import { TokenConfidence as TokenConfidenceInteractive } from "@microcharts/react/token-confidence/interactive";
import staticModule, { playground as staticPlayground, ANSWER } from "./token-confidence";

export function PreviewLive() {
  return (
    <TokenConfidenceInteractive data={ANSWER} summary={false} style={{ fontSize: "0.8rem" }} />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s) => (
    <TokenConfidenceInteractive
      data={ANSWER}
      tiers={[(s.lo as number) / 100, (s.hi as number) / 100]}
      show={s.all ? "all" : "flagged"}
      legend={s.legend as boolean}
      title="Model answer"
      summary={false}
      style={{ fontSize: "0.95rem" }}
    />
  ),
  codeInteractive: (s) =>
    [
      "<TokenConfidence",
      "  data={tokens}",
      `  tiers={[${((s.lo as number) / 100).toFixed(2)}, ${((s.hi as number) / 100).toFixed(2)}]}`,
      s.all === true && '  show="all"',
      s.legend === true && "  legend",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: TokenConfidence,
  ChartLive: TokenConfidenceInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
