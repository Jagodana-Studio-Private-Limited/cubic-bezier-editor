"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Play, RotateCcw, GitCompare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ToolEvents } from "@/lib/analytics";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BezierValues {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Preset {
  label: string;
  values: BezierValues;
  group: "standard" | "in" | "out" | "inout" | "special";
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS_SIZE = 280; // SVG viewBox size (square)
const PADDING = 30; // Inner padding so handles don't clip
const GRID = CANVAS_SIZE - PADDING * 2; // Usable grid area

const PRESETS: Preset[] = [
  { label: "ease", values: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 }, group: "standard" },
  { label: "linear", values: { x1: 0, y1: 0, x2: 1, y2: 1 }, group: "standard" },
  { label: "ease-in", values: { x1: 0.42, y1: 0, x2: 1, y2: 1 }, group: "standard" },
  { label: "ease-out", values: { x1: 0, y1: 0, x2: 0.58, y2: 1 }, group: "standard" },
  { label: "ease-in-out", values: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 }, group: "standard" },
  { label: "ease-in-cubic", values: { x1: 0.55, y1: 0.055, x2: 0.675, y2: 0.19 }, group: "in" },
  { label: "ease-out-cubic", values: { x1: 0.215, y1: 0.61, x2: 0.355, y2: 1 }, group: "out" },
  { label: "ease-in-expo", values: { x1: 0.95, y1: 0.05, x2: 0.795, y2: 0.035 }, group: "in" },
  { label: "ease-out-expo", values: { x1: 0.19, y1: 1, x2: 0.22, y2: 1 }, group: "out" },
  { label: "ease-in-back", values: { x1: 0.6, y1: -0.28, x2: 0.735, y2: 0.045 }, group: "in" },
  { label: "ease-out-back", values: { x1: 0.175, y1: 0.885, x2: 0.32, y2: 1.275 }, group: "out" },
  { label: "snappy", values: { x1: 0.2, y1: 0, x2: 0, y2: 1 }, group: "special" },
  { label: "spring", values: { x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 }, group: "special" },
  { label: "bouncy", values: { x1: 0.68, y1: -0.55, x2: 0.265, y2: 1.55 }, group: "special" },
];

const DEFAULT_VALUES: BezierValues = { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 };

// ─── Bezier math helpers ─────────────────────────────────────────────────────

/** Map a bezier unit value (0–1 for X, -0.5–1.5 for Y) to SVG coordinates */
function toSvg(unitX: number, unitY: number) {
  const x = PADDING + unitX * GRID;
  // Y is flipped: unit 0 = bottom, unit 1 = top
  const y = PADDING + (1 - unitY) * GRID;
  return { x, y };
}

/** Map SVG coordinates back to bezier unit values */
function fromSvg(svgX: number, svgY: number) {
  const x = (svgX - PADDING) / GRID;
  const y = 1 - (svgY - PADDING) / GRID;
  return { x, y };
}

/** Build the SVG path `d` attribute for the cubic bezier curve */
function buildCurvePath(v: BezierValues): string {
  const start = toSvg(0, 0);
  const p1 = toSvg(v.x1, v.y1);
  const p2 = toSvg(v.x2, v.y2);
  const end = toSvg(1, 1);
  return `M ${start.x} ${start.y} C ${p1.x} ${p1.y} ${p2.x} ${p2.y} ${end.x} ${end.y}`;
}

/** Clamp x to [0,1] and y to [-0.5, 1.5] */
function clamp(v: BezierValues): BezierValues {
  return {
    x1: Math.max(0, Math.min(1, v.x1)),
    y1: Math.max(-0.5, Math.min(1.5, v.y1)),
    x2: Math.max(0, Math.min(1, v.x2)),
    y2: Math.max(-0.5, Math.min(1.5, v.y2)),
  };
}

/** Round to 3 decimal places */
function r(n: number) {
  return Math.round(n * 1000) / 1000;
}

function cssValue(v: BezierValues): string {
  return `cubic-bezier(${r(v.x1)}, ${r(v.y1)}, ${r(v.x2)}, ${r(v.y2)})`;
}

// ─── BezierCanvas ─────────────────────────────────────────────────────────────

function BezierCanvas({
  values,
  onChange,
  compareValues,
}: {
  values: BezierValues;
  onChange: (v: BezierValues) => void;
  compareValues?: BezierValues;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<"p1" | "p2" | null>(null);

  const getSvgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragging.current) return;
      const pt = getSvgPoint(clientX, clientY);
      if (!pt) return;
      const unit = fromSvg(pt.x, pt.y);
      if (dragging.current === "p1") {
        onChange(clamp({ ...values, x1: unit.x, y1: unit.y }));
      } else {
        onChange(clamp({ ...values, x2: unit.x, y2: unit.y }));
      }
    },
    [values, onChange, getSvgPoint]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => handleMove(e.clientX, e.clientY),
    [handleMove]
  );
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    },
    [handleMove]
  );

  const stopDrag = useCallback(() => {
    dragging.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", stopDrag);
    window.removeEventListener("touchmove", handleTouchMove);
    window.removeEventListener("touchend", stopDrag);
  }, [handleMouseMove, handleTouchMove]);

  const startDrag = useCallback(
    (handle: "p1" | "p2") => {
      dragging.current = handle;
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopDrag);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", stopDrag);
    },
    [handleMouseMove, handleTouchMove, stopDrag]
  );

  const p0 = toSvg(0, 0);
  const p1 = toSvg(values.x1, values.y1);
  const p2 = toSvg(values.x2, values.y2);
  const p3 = toSvg(1, 1);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      className="w-full max-w-[320px] mx-auto select-none touch-none"
      style={{ cursor: dragging.current ? "grabbing" : "default" }}
    >
      {/* Background */}
      <rect width={CANVAS_SIZE} height={CANVAS_SIZE} rx="12" className="fill-muted/50" />

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const px = PADDING + t * GRID;
        const py = PADDING + t * GRID;
        return (
          <g key={t}>
            <line x1={px} y1={PADDING} x2={px} y2={PADDING + GRID} className="stroke-border" strokeWidth="1" />
            <line x1={PADDING} y1={py} x2={PADDING + GRID} y2={py} className="stroke-border" strokeWidth="1" />
          </g>
        );
      })}

      {/* Diagonal reference line (linear) */}
      <line
        x1={p0.x} y1={p0.y}
        x2={p3.x} y2={p3.y}
        className="stroke-muted-foreground/30"
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      {/* Compare curve */}
      {compareValues && (
        <path
          d={buildCurvePath(compareValues)}
          fill="none"
          className="stroke-brand-accent/50"
          strokeWidth="2"
          strokeDasharray="6 3"
        />
      )}

      {/* Main bezier curve */}
      <path
        d={buildCurvePath(values)}
        fill="none"
        className="stroke-brand"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Control arm P0 → P1 */}
      <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} className="stroke-brand/50" strokeWidth="1.5" />
      {/* Control arm P3 → P2 */}
      <line x1={p3.x} y1={p3.y} x2={p2.x} y2={p2.y} className="stroke-brand-accent/50" strokeWidth="1.5" />

      {/* Anchor points */}
      <circle cx={p0.x} cy={p0.y} r="5" className="fill-foreground stroke-background" strokeWidth="2" />
      <circle cx={p3.x} cy={p3.y} r="5" className="fill-foreground stroke-background" strokeWidth="2" />

      {/* P1 handle */}
      <circle
        cx={p1.x}
        cy={p1.y}
        r="8"
        className="fill-brand stroke-background cursor-grab active:cursor-grabbing"
        strokeWidth="2.5"
        onMouseDown={() => startDrag("p1")}
        onTouchStart={() => startDrag("p1")}
      />
      <text x={p1.x + 11} y={p1.y + 4} className="fill-brand text-[9px] font-mono font-semibold" style={{ fontSize: 9 }}>P1</text>

      {/* P2 handle */}
      <circle
        cx={p2.x}
        cy={p2.y}
        r="8"
        className="fill-brand-accent stroke-background cursor-grab active:cursor-grabbing"
        strokeWidth="2.5"
        onMouseDown={() => startDrag("p2")}
        onTouchStart={() => startDrag("p2")}
      />
      <text x={p2.x + 11} y={p2.y + 4} className="fill-brand-accent text-[9px] font-mono font-semibold" style={{ fontSize: 9 }}>P2</text>

      {/* Axis labels */}
      <text x={PADDING} y={CANVAS_SIZE - 6} className="fill-muted-foreground" style={{ fontSize: 9 }}>0</text>
      <text x={PADDING + GRID - 4} y={CANVAS_SIZE - 6} className="fill-muted-foreground" style={{ fontSize: 9 }}>1</text>
      <text x={4} y={PADDING + 4} className="fill-muted-foreground" style={{ fontSize: 9 }}>1</text>
      <text x={4} y={PADDING + GRID + 4} className="fill-muted-foreground" style={{ fontSize: 9 }}>0</text>
    </svg>
  );
}

// ─── AnimationPreview ─────────────────────────────────────────────────────────

function AnimationPreview({
  values,
  duration,
  compareValues,
}: {
  values: BezierValues;
  duration: number;
  compareValues?: BezierValues;
}) {
  const [key, setKey] = useState(0);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    setKey((k) => k + 1);
    setPlaying(true);
    setTimeout(() => setPlaying(false), duration + 100);
    ToolEvents.toolUsed("preview");
  };

  const timingFn = cssValue(values);
  const compareTimingFn = compareValues ? cssValue(compareValues) : null;

  return (
    <div className="space-y-3">
      {/* Primary ball track */}
      <div className="relative h-10 rounded-full bg-muted/60 border border-border/50 overflow-hidden">
        <div className="absolute inset-0 flex items-center px-3">
          <div className="text-[10px] text-muted-foreground font-mono">primary</div>
        </div>
        {/* Track line */}
        <div className="absolute top-1/2 left-4 right-4 h-px bg-border/80" />
        <motion.div
          key={`ball-${key}`}
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-brand to-brand-accent shadow-md shadow-brand/30"
          style={{ left: 16 }}
          animate={playing ? { left: "calc(100% - 40px)" } : { left: 16 }}
          transition={{
            duration: duration / 1000,
            ease: [values.x1, values.y1, values.x2, values.y2],
            delay: 0,
          }}
        />
      </div>

      {/* Compare ball track */}
      {compareTimingFn && compareValues && (
        <div className="relative h-10 rounded-full bg-muted/60 border border-border/50 overflow-hidden">
          <div className="absolute inset-0 flex items-center px-3">
            <div className="text-[10px] text-muted-foreground font-mono">compare</div>
          </div>
          <div className="absolute top-1/2 left-4 right-4 h-px bg-border/80" />
          <motion.div
            key={`compare-${key}`}
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-brand-accent to-purple-500 shadow-md shadow-brand-accent/30"
            style={{ left: 16 }}
            animate={playing ? { left: "calc(100% - 40px)" } : { left: 16 }}
            transition={{
              duration: duration / 1000,
              ease: [compareValues.x1, compareValues.y1, compareValues.x2, compareValues.y2],
              delay: 0,
            }}
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={play}
          disabled={playing}
          className="flex-1 gap-2 bg-gradient-to-r from-brand to-brand-accent text-white shadow-sm"
        >
          <Play className="h-3.5 w-3.5" />
          {playing ? "Playing…" : "Play"}
        </Button>
      </div>
    </div>
  );
}

// ─── ValueInput ───────────────────────────────────────────────────────────────

function ValueInput({
  label,
  value,
  onChange,
  min,
  max,
  colorClass,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  colorClass: string;
}) {
  const [raw, setRaw] = useState(String(r(value)));

  useEffect(() => {
    setRaw(String(r(value)));
  }, [value]);

  return (
    <div className="flex flex-col gap-1">
      <label className={cn("text-[11px] font-mono font-semibold", colorClass)}>{label}</label>
      <input
        type="number"
        value={raw}
        min={min}
        max={max}
        step="0.01"
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-brand/50"
        onChange={(e) => {
          setRaw(e.target.value);
          const n = parseFloat(e.target.value);
          if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
        onBlur={() => setRaw(String(r(value)))}
      />
    </div>
  );
}

// ─── CubicBezierEditor (main export) ─────────────────────────────────────────

export function CubicBezierEditor() {
  const [values, setValues] = useState<BezierValues>(DEFAULT_VALUES);
  const [compareMode, setCompareMode] = useState(false);
  const [compareValues, setCompareValues] = useState<BezierValues>({
    x1: 0.42,
    y1: 0,
    x2: 0.58,
    y2: 1,
  });
  const [duration, setDuration] = useState(800);
  const [activePreset, setActivePreset] = useState<string | null>("ease");

  const css = cssValue(values);
  const fullCss = `transition-timing-function: ${css};`;

  const applyPreset = (preset: Preset) => {
    setValues(preset.values);
    setActivePreset(preset.label);
    ToolEvents.toolUsed("preset");
  };

  const reset = () => {
    setValues(DEFAULT_VALUES);
    setActivePreset("ease");
  };

  const copyCSS = async () => {
    try {
      await navigator.clipboard.writeText(fullCss);
      toast.success("CSS copied to clipboard!");
      ToolEvents.resultCopied();
    } catch {
      toast.error("Failed to copy. Please copy manually.");
    }
  };

  const updateValue = (key: keyof BezierValues, val: number) => {
    setValues((v) => clamp({ ...v, [key]: val }));
    setActivePreset(null);
  };

  const presetGroups = [
    { label: "Standard", group: "standard" as const },
    { label: "Ease In", group: "in" as const },
    { label: "Ease Out", group: "out" as const },
    { label: "Special", group: "special" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Canvas column */}
        <div className="space-y-4">
          <BezierCanvas
            values={values}
            onChange={(v) => {
              setValues(v);
              setActivePreset(null);
            }}
            compareValues={compareMode ? compareValues : undefined}
          />

          {/* Value inputs */}
          <div className="grid grid-cols-4 gap-2">
            <ValueInput label="x1" value={values.x1} min={0} max={1} colorClass="text-brand" onChange={(v) => updateValue("x1", v)} />
            <ValueInput label="y1" value={values.y1} min={-0.5} max={1.5} colorClass="text-brand" onChange={(v) => updateValue("y1", v)} />
            <ValueInput label="x2" value={values.x2} min={0} max={1} colorClass="text-brand-accent" onChange={(v) => updateValue("x2", v)} />
            <ValueInput label="y2" value={values.y2} min={-0.5} max={1.5} colorClass="text-brand-accent" onChange={(v) => updateValue("y2", v)} />
          </div>
        </div>

        {/* Controls column */}
        <div className="space-y-5">
          {/* Animation preview */}
          <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Animation Preview</h3>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-muted-foreground font-mono">{duration}ms</label>
                <input
                  type="range"
                  min={200}
                  max={3000}
                  step={100}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-24 accent-[--brand]"
                />
              </div>
            </div>
            <AnimationPreview
              values={values}
              duration={duration}
              compareValues={compareMode ? compareValues : undefined}
            />
          </div>

          {/* CSS output */}
          <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold">CSS Output</h3>
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 font-mono text-sm">
              <code className="flex-1 break-all text-foreground">{fullCss}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyCSS}
                className="shrink-0 h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
              <code className="flex-1 break-all">{css}</code>
            </div>
          </div>

          {/* Compare mode */}
          <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-brand-accent" />
                Curve Comparison
              </h3>
              <button
                onClick={() => setCompareMode((m) => !m)}
                className={cn(
                  "text-xs font-medium px-3 py-1 rounded-full border transition-colors",
                  compareMode
                    ? "bg-brand-accent/10 border-brand-accent/30 text-brand-accent"
                    : "border-border text-muted-foreground hover:border-brand/40 hover:text-brand"
                )}
              >
                {compareMode ? "On" : "Off"}
              </button>
            </div>
            {compareMode && (
              <div className="grid grid-cols-4 gap-2">
                {(["x1", "y1", "x2", "y2"] as const).map((key) => (
                  <ValueInput
                    key={key}
                    label={key}
                    value={compareValues[key]}
                    min={key === "x1" || key === "x2" ? 0 : -0.5}
                    max={key === "x1" || key === "x2" ? 1 : 1.5}
                    colorClass="text-brand-accent"
                    onChange={(v) =>
                      setCompareValues((cv) =>
                        clamp({ ...cv, [key]: v })
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Reset */}
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            className="w-full gap-2 text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to ease
          </Button>
        </div>
      </div>

      {/* Presets */}
      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold">Presets</h3>
        <div className="space-y-3">
          {presetGroups.map(({ label, group }) => {
            const groupPresets = PRESETS.filter((p) => p.group === group);
            return (
              <div key={group} className="space-y-1.5">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {groupPresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => applyPreset(preset)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-mono border transition-all",
                        activePreset === preset.label
                          ? "bg-gradient-to-r from-brand to-brand-accent text-white border-transparent shadow-sm"
                          : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
