"use client";

import { useCallback, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { CopyButton } from "@/components/ui/copy";

export type PropRow = {
  name: string;
  type: string;
  required?: boolean;
  description: ReactNode;
  copyNotes: string;
};

const MIN_COL = 14;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function toTsv(rows: PropRow[]) {
  const lines = ["Prop\tType\tNotes"];
  for (const r of rows) {
    const notes = r.copyNotes.replace(/\s+/g, " ").trim();
    lines.push(`${r.name}${r.required ? " *" : ""}\t${r.type}\t${notes}`);
  }
  return lines.join("\n");
}

function measureWidths(table: HTMLTableElement): [number, number, number] {
  const cells = table.querySelectorAll<HTMLTableCellElement>("thead th");
  const total = table.getBoundingClientRect().width || 1;
  const raw = [0, 1, 2].map((i) => ((cells[i]?.offsetWidth ?? 0) / total) * 100) as [
    number,
    number,
    number,
  ];
  const sum = raw[0] + raw[1] + raw[2] || 1;
  return [raw[0] * (100 / sum), raw[1] * (100 / sum), raw[2] * (100 / sum)];
}

function resizePair(
  col: 0 | 1,
  deltaPct: number,
  start: [number, number, number],
): [number, number, number] {
  if (col === 0) {
    const new0 = clamp(start[0] + deltaPct, MIN_COL, 100 - start[2] - MIN_COL);
    const new1 = start[0] + start[1] - new0;
    if (new1 < MIN_COL) return start;
    return [new0, new1, start[2]];
  }
  const new1 = clamp(start[1] + deltaPct, MIN_COL, 100 - start[0] - MIN_COL);
  const new2 = start[1] + start[2] - new1;
  if (new2 < MIN_COL) return start;
  return [start[0], new1, new2];
}

export function PropTableView({ rows }: { rows: PropRow[] }) {
  const [widths, setWidths] = useState<[number, number, number] | null>(null);
  const widthsRef = useRef(widths);
  widthsRef.current = widths;
  const drag = useRef<{
    col: 0 | 1;
    startX: number;
    start: [number, number, number];
    tableW: number;
  } | null>(null);

  const onResizeDown = useCallback((col: 0 | 1) => {
    return (e: PointerEvent<HTMLButtonElement>) => {
      const table = e.currentTarget.closest("table");
      if (!table) return;
      e.preventDefault();
      const start = widthsRef.current ?? measureWidths(table);
      if (!widthsRef.current) setWidths(start);
      drag.current = {
        col,
        startX: e.clientX,
        start,
        tableW: table.getBoundingClientRect().width,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    };
  }, []);

  const onResizeMove = useCallback((e: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    const { col, startX, start, tableW } = drag.current;
    const deltaPct = ((e.clientX - startX) / tableW) * 100;
    setWidths(resizePair(col, deltaPct, start));
  }, []);

  const onResizeUp = useCallback((e: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    drag.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  const onResizeDblClick = useCallback((e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setWidths(null);
    drag.current = null;
  }, []);

  return (
    <div className="not-prose group/mc-prop relative my-6 overflow-x-auto">
      <div className="pointer-events-none absolute top-2.5 right-2.5 z-10 opacity-0 transition-opacity duration-150 group-hover/mc-prop:pointer-events-auto group-hover/mc-prop:opacity-100 group-focus-within/mc-prop:pointer-events-auto group-focus-within/mc-prop:opacity-100">
        <CopyButton text={toTsv(rows)} size={7} className="opacity-90" />
      </div>
      <table className="mc-table mc-prop-table text-sm" data-sized={widths ? "" : undefined}>
        {widths && (
          <colgroup>
            <col style={{ width: `${widths[0]}%` }} />
            <col style={{ width: `${widths[1]}%` }} />
            <col style={{ width: `${widths[2]}%` }} />
          </colgroup>
        )}
        <thead>
          <tr>
            <th>
              Prop
              <button
                type="button"
                aria-label="Resize Prop and Type columns"
                className="mc-prop-table__handle"
                onPointerDown={onResizeDown(0)}
                onPointerMove={onResizeMove}
                onPointerUp={onResizeUp}
                onPointerCancel={onResizeUp}
                onDoubleClick={onResizeDblClick}
              />
            </th>
            <th className="mc-prop-table__type">
              Type
              <button
                type="button"
                aria-label="Resize Type and Notes columns"
                className="mc-prop-table__handle"
                onPointerDown={onResizeDown(1)}
                onPointerMove={onResizeMove}
                onPointerUp={onResizeUp}
                onPointerCancel={onResizeUp}
                onDoubleClick={onResizeDblClick}
              />
            </th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.name}>
              <td className="font-mono text-fd-foreground">
                {p.name}
                {p.required && <span className="ml-1 text-fd-primary">*</span>}
              </td>
              <td className="mc-prop-table__type font-mono text-xs text-fd-muted-foreground">
                {p.type}
              </td>
              <td className="text-fd-muted-foreground">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
