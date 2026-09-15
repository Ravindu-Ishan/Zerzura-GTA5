"use client";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /**
   * The "untouched" value for this slider - used only to decide whether the readout
   * lights up in the accent colour. Face features are bipolar (-1..1, neutral 0), so
   * it can't just be assumed to equal `min`.
   */
  neutral?: number;
}

export default function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  neutral,
}: SliderProps) {
  const span = max - min;
  const fill = span > 0 ? ((value - min) / span) * 100 : 0;
  const isInteger = step >= 1;
  const base = neutral ?? min;
  const touched = Math.abs(value - base) > (isInteger ? 0.5 : 0.001);

  // A 0-based integer slider is really "option N of M" - showing the ceiling makes the
  // catalogue size visible, which matters on e.g. Hair Style where the max is
  // model-dependent and comes back from the game at runtime.
  const showCeiling = isInteger && min === 0 && max > 1;

  return (
    <label className="group block select-none py-[7px]">
      <div className="mb-[7px] flex items-baseline justify-between gap-3">
        <span className="t-label truncate transition-colors group-hover:text-white/80">
          {label}
        </span>
        <span className="t-num shrink-0 font-display text-[14px] font-bold tabular-nums">
          <span className={touched ? "text-accent" : "text-white/55"}>
            {isInteger ? value.toFixed(0) : value.toFixed(2)}
          </span>
          {showCeiling && <span className="text-white/25"> / {max.toFixed(0)}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="range"
        style={{ "--fill": `${fill}%` } as React.CSSProperties}
      />
    </label>
  );
}
