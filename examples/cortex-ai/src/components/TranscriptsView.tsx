import { useState } from "react";
import { TokenConfidence } from "@microcharts/react/token-confidence/interactive";
import { RubricStrip } from "@microcharts/react/rubric-strip/interactive";
import { StarSpoke } from "@microcharts/react/star-spoke/interactive";
import { Card, CardHead, StatLine } from "./ui";
import * as d from "../data";

type Unit = { index: number; value: number | null; label?: string } | null;

export function TranscriptsView() {
  const [starActive, setStarActive] = useState<Unit>(null);
  // Tier the "word" tokens (skip whitespace-only / bare-punctuation chunks).
  const words = d.answerTokens.filter((t) => t.token.replace(/[\s.,]/g, "") !== "");
  const tiers = { confident: 0, unsure: 0, guessing: 0 };
  for (const t of words) tiers[d.tierOf(t.confidence)]++;
  const flaggedCount = tiers.unsure + tiers.guessing;
  const meanConf = d.answerTokens.reduce((a, t) => a + t.confidence, 0) / d.answerTokens.length;

  const tierBands: { key: keyof typeof tiers; label: string; color: string }[] = [
    // Colours track the chart's own tier encoding: unsure = amber underline
    // (--mc-cat-1), guessing = red dotted (--mc-negative). Confident is unmarked
    // in the answer, so the meter reads it as the calm positive baseline.
    { key: "confident", label: "Confident", color: "var(--mc-positive, #0e7a5f)" },
    { key: "unsure", label: "Unsure", color: "var(--mc-cat-1, #d2982f)" },
    { key: "guessing", label: "Guessing", color: "var(--mc-negative, #bd4b2d)" },
  ];

  return (
    <div className="view-enter">
      <div className="view-head">
        <div className="eyebrow">Transcript · run #48213 · cortex-opus-4</div>
        <h1>Read the answer the way the model wrote it</h1>
        <p>
          Every token carries the model's own confidence. Hedges and specifics that the model was
          unsure of are marked inline, so a reviewer sees exactly where to look before shipping the
          reply.
        </p>
      </div>

      <div className="transcript">
        {/* Conversation */}
        <Card hover={false} className="pad-lg">
          <CardHead title="Support · past-window refund" tag={<>graded</>} />

          {/* Signature: the confidence instrument that frames the reading */}
          <div className="conf-readout">
            <div className="conf-mean">
              <span className="conf-mean-value">{meanConf.toFixed(2)}</span>
              <span className="conf-mean-scale">of 1.00</span>
              <span className="conf-mean-label">
                mean token
                <br />
                confidence
              </span>
            </div>
            <div className="conf-meter-wrap">
              <span className="conf-meter-caption">
                {words.length} tokens · {flaggedCount} flagged
              </span>
              <div
                className="conf-meter"
                role="img"
                aria-label={`${tiers.confident} confident, ${tiers.unsure} unsure, ${tiers.guessing} guessing tokens`}
              >
                {tierBands.map((b) =>
                  tiers[b.key] > 0 ? (
                    <span
                      key={b.key}
                      className="conf-seg"
                      style={{ flexGrow: tiers[b.key], background: b.color }}
                    />
                  ) : null,
                )}
              </div>
              <div className="conf-legend">
                {tierBands.map((b) => (
                  <span key={b.key} className="conf-tier">
                    <span className="swatch" style={{ background: b.color }} />
                    {b.label}
                    <b className="num">{tiers[b.key]}</b>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="msg">
            <div className="avatar">U</div>
            <div className="bubble">
              <div className="who">Customer</div>
              <p className="user-q">
                A customer wants a refund but it's 44 days after purchase, past our 30-day window.
                How should I route it?
              </p>
            </div>
          </div>

          <div className="msg">
            <div className="avatar assistant">C</div>
            <div className="bubble">
              <div className="who">cortex-opus-4</div>
              <div className="answer-body">
                <TokenConfidence data={d.answerTokens} tiers={d.confidenceTiers} show="flagged" />
              </div>
            </div>
          </div>

          <StatLine
            items={[
              ["tokens", <span className="num">{words.length}</span>],
              ["flagged", <span className="num">{flaggedCount}</span>],
              ["needs review", <span className="num">{tiers.guessing} spans</span>],
            ]}
          />
        </Card>

        {/* Flagged spans panel */}
        <Card hover={false}>
          <CardHead
            title="Flagged spans"
            sub="Lowest-confidence phrases to verify"
            tag={<>{d.flaggedSpans.length}</>}
          />
          <div className="flags">
            {d.flaggedSpans.map((s, i) => (
              <div className={`flag ${s.tier}`} key={i}>
                <span className="flag-conf">{s.confidence.toFixed(2)}</span>
                <div className="flag-body">
                  <div className="flag-text">"{s.text}"</div>
                  <div className="flag-meta">{s.tier === "guessing" ? "guessing" : "unsure"}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Scorecard + profile */}
      <div className="grid stagger" style={{ marginTop: "var(--s5)" }}>
        <Card span={4}>
          <CardHead
            title="Rubric scorecard"
            sub="Bar length = score · thickness = weight · tick = pass threshold"
            tag={<>target {Math.round(d.rubricTarget * 100)}%</>}
          />
          <div className="chart-frame">
            <RubricStrip
              data={d.rubric}
              target={d.rubricTarget}
              labels
              domain={[0, 1]}
              format={(n) => `${Math.round(n * 100)}%`}
              width={640}
              height={246}
              className="chart-fill"
              style={{ width: "100%", height: "auto" }}
              animate
            />
          </div>
          <div className="legend">
            <span>
              <span className="swatch" style={{ background: "var(--mc-negative, #bd4b2d)" }} />{" "}
              Citations &amp; accuracy sit below target
            </span>
          </div>
        </Card>

        <Card span={2}>
          <CardHead title="Answer profile" sub="This answer vs. the prior model (ghost)" />
          <div style={{ display: "grid", placeItems: "center", padding: "var(--s3)" }}>
            <StarSpoke
              data={d.qualities}
              compare={d.qualitiesBaseline}
              guides
              labels
              domain={[0, 1]}
              size={210}
              animate
              onActive={setStarActive}
            />
          </div>
          <StatLine
            items={[
              ["strongest", <span className="num">Safe</span>],
              ["weakest", <span className="num">Grounded</span>],
              [
                "focus",
                <span className="num">
                  {starActive
                    ? `${starActive.label} ${Math.round((starActive.value ?? 0) * 100)}%`
                    : "—"}
                </span>,
              ],
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
