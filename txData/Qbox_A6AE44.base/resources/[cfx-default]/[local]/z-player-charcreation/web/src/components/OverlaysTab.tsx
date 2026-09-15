"use client";

import { useState } from "react";
import Slider from "./Slider";
import Button from "./ui/Button";
import Icon, { IconName } from "./ui/Icon";
import TabLayout, { NavItem, SectionNav } from "./ui/TabLayout";
import {
  OverlaysData,
  OverlayKey,
  OVERLAY_KEYS,
  OVERLAY_LABELS,
  OVERLAY_COLOR_PALETTE,
  HAIR_COLOR_MAX,
} from "@/lib/appearance";

interface OverlaysTabProps {
  overlays: OverlaysData;
  overlayMax: Record<string, number>;
  onChange: (overlays: OverlaysData) => void;
}

const OVERLAY_ICONS: Record<OverlayKey, IconName> = {
  blemishes: "cheek",
  beard: "scissors",
  eyebrows: "eye",
  ageing: "contrast",
  makeUp: "sparkle",
  blush: "droplet",
  complexion: "contrast",
  sunDamage: "droplet",
  lipstick: "mouth",
  moleAndFreckles: "sparkle",
  chestHair: "scissors",
  bodyBlemishes: "cheek",
};

const OVERLAY_COPY: Record<OverlayKey, string> = {
  blemishes: "Acne and skin marks across the face.",
  beard: "Facial hair, from stubble through to a full beard.",
  eyebrows: "Brow shape and thickness.",
  ageing: "Lines and wear. Subtle amounts go a long way.",
  makeUp: "Eye makeup and full face looks.",
  blush: "Colour high on the cheeks.",
  complexion: "Overall skin condition and tone variation.",
  sunDamage: "Weathering and sun spots.",
  lipstick: "Lip colour and finish.",
  moleAndFreckles: "Freckle patterns and beauty marks.",
  chestHair: "Body hair across the chest and torso.",
  bodyBlemishes: "Marks and scarring on the body.",
};

export default function OverlaysTab({ overlays, overlayMax, onChange }: OverlaysTabProps) {
  const [key, setKey] = useState<OverlayKey>(OVERLAY_KEYS[0]);

  const setting = overlays[key];
  const hasColor = !!OVERLAY_COLOR_PALETTE[key];
  const styleMax = Math.max(overlayMax[key] ?? 0, 0);
  const activeCount = OVERLAY_KEYS.filter((k) => overlays[k].opacity > 0).length;

  const set = (field: string, value: number) =>
    onChange({ ...overlays, [key]: { ...overlays[key], [field]: value } });

  const clear = () =>
    onChange({
      ...overlays,
      [key]: { ...overlays[key], style: 0, opacity: 0, color: 0, secondColor: 0 },
    });

  const nav: NavItem[] = OVERLAY_KEYS.map((k) => ({
    id: k,
    label: OVERLAY_LABELS[k],
    icon: OVERLAY_ICONS[k],
    dot: overlays[k].opacity > 0,
  }));

  return (
    <TabLayout
      nav={
        <SectionNav
          header={`Overlays - ${activeCount} on`}
          items={nav}
          active={key}
          onSelect={(id) => setKey(id as OverlayKey)}
        />
      }
      title={OVERLAY_LABELS[key]}
      description={OVERLAY_COPY[key]}
      action={
        <Button
          size="sm"
          icon="x"
          onClick={clear}
          disabled={setting.opacity === 0 && setting.style === 0}
        >
          Clear
        </Button>
      }
    >
      {styleMax === 0 ? (
        <p className="border-l-[3px] border-white/20 bg-black/35 px-3 py-2.5 text-[12px] leading-snug text-white/40">
          The game reports no variations of this overlay for the current ped model.
        </p>
      ) : (
        <div className="divide-y divide-hairline">
          <Slider
            label="Style"
            value={setting.style}
            min={0}
            max={styleMax}
            step={1}
            onChange={(v) => set("style", v)}
          />
          <Slider
            label="Opacity"
            value={setting.opacity}
            min={0}
            max={1}
            step={0.1}
            onChange={(v) => set("opacity", v)}
          />
          {hasColor && (
            <Slider
              label={`Colour (${OVERLAY_COLOR_PALETTE[key]} palette)`}
              value={setting.color}
              min={0}
              max={HAIR_COLOR_MAX}
              step={1}
              onChange={(v) => set("color", v)}
            />
          )}
        </div>
      )}

      {styleMax > 0 && setting.opacity === 0 && (
        <p className="mt-3 flex items-start gap-2 border-l-[3px] border-accent bg-accent/[0.1] px-3 py-2.5 text-[12px] leading-snug text-white/60">
          <Icon name="alert" size={14} className="mt-[1px] shrink-0 text-accent" />
          Opacity is at zero, so this overlay is invisible on the ped. Raise it to see the style
          you&apos;ve picked.
        </p>
      )}
    </TabLayout>
  );
}
