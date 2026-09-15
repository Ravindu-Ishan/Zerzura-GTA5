"use client";

import { useState } from "react";
import Slider from "./Slider";
import TabLayout, { NavItem, SectionNav } from "./ui/TabLayout";
import { HairData, HAIR_COLOR_MAX } from "@/lib/appearance";

interface HairEyesTabProps {
  hair: HairData;
  onHairChange: (hair: HairData) => void;
  hairStyleMax: number;
  eyeColor: number;
  onEyeColorChange: (eyeColor: number) => void;
}

type GroupId = "style" | "colour" | "eyes";

const NAV: NavItem[] = [
  { id: "style", label: "Hair Style", icon: "scissors" },
  { id: "colour", label: "Hair Colour", icon: "droplet" },
  { id: "eyes", label: "Eyes", icon: "eye" },
];

const COPY: Record<GroupId, { title: string; description: string }> = {
  style: {
    title: "Hair Style",
    description:
      "Cuts are read straight off the ped model, so the catalogue size changes with the body you picked on the Details tab.",
  },
  colour: {
    title: "Hair Colour",
    description:
      "Base colour plus an optional highlight, both from GTA's fixed 64-swatch multiplayer palette.",
  },
  eyes: {
    title: "Eyes",
    description: "Iris colour, from the game's own eye texture set.",
  },
};

export default function HairEyesTab({
  hair,
  onHairChange,
  hairStyleMax,
  eyeColor,
  onEyeColorChange,
}: HairEyesTabProps) {
  const [group, setGroup] = useState<GroupId>("style");
  const set = (key: keyof HairData, value: number) => onHairChange({ ...hair, [key]: value });

  const nav = NAV.map((item) => ({
    ...item,
    dot:
      item.id === "style"
        ? hair.style !== 0 || hair.texture !== 0
        : item.id === "colour"
          ? hair.color !== 0 || hair.highlight !== 0
          : eyeColor !== 0,
  }));

  return (
    <TabLayout
      nav={<SectionNav header="Hair & Eyes" items={nav} active={group} onSelect={(id) => setGroup(id as GroupId)} />}
      title={COPY[group].title}
      description={COPY[group].description}
    >
      <div className="divide-y divide-hairline">
        {group === "style" && (
          <>
            <Slider
              label="Cut"
              value={hair.style}
              min={0}
              max={hairStyleMax}
              step={1}
              onChange={(v) => set("style", v)}
            />
            <Slider
              label="Texture"
              value={hair.texture}
              min={0}
              max={3}
              step={1}
              onChange={(v) => set("texture", v)}
            />
          </>
        )}

        {group === "colour" && (
          <>
            <Slider
              label="Base Colour"
              value={hair.color}
              min={0}
              max={HAIR_COLOR_MAX}
              step={1}
              onChange={(v) => set("color", v)}
            />
            <Slider
              label="Highlight"
              value={hair.highlight}
              min={0}
              max={HAIR_COLOR_MAX}
              step={1}
              onChange={(v) => set("highlight", v)}
            />
          </>
        )}

        {group === "eyes" && (
          <Slider
            label="Iris Colour"
            value={eyeColor}
            min={0}
            max={30}
            step={1}
            onChange={onEyeColorChange}
          />
        )}
      </div>

      {group === "style" && hairStyleMax <= 0 && (
        <p className="mt-3 border-l-[3px] border-white/20 bg-black/35 px-3 py-2.5 text-[12px] leading-snug text-white/40">
          No hair variations reported for this ped yet. Pick a body on the Details tab - the
          catalogue is queried from the model the moment it loads.
        </p>
      )}
    </TabLayout>
  );
}
