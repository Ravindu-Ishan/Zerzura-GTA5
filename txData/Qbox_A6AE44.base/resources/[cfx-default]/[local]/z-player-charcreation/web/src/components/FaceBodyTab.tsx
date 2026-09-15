"use client";

import { useState } from "react";
import Slider from "./Slider";
import TabLayout, { NavItem, SectionNav } from "./ui/TabLayout";
import {
  HeadBlend,
  HEAD_BLEND_PARENT_SLIDERS,
  HEAD_BLEND_MIX_SLIDERS,
} from "@/lib/appearance";

interface FaceBodyTabProps {
  headBlend: HeadBlend;
  onChange: (headBlend: HeadBlend) => void;
}

/** "Face Shape - Parent 1" reads as noise once the group header already says "Face Shape". */
const shortLabel = (label: string) => label.split(" - ").at(-1) ?? label;

const SHAPE = HEAD_BLEND_PARENT_SLIDERS.filter((s) => s.key.startsWith("shape"));
const SKIN = HEAD_BLEND_PARENT_SLIDERS.filter((s) => s.key.startsWith("skin"));

const GROUPS = {
  shape: {
    title: "Face Shape",
    description:
      "Pick up to three parent faces. The game blends their bone structure into yours - the mix sliders decide how much of each one shows through.",
    sliders: SHAPE,
    max: 45,
    step: 1,
  },
  skin: {
    title: "Skin Tone",
    description:
      "The same three-parent system, but for complexion. Skin and shape are chosen independently, so any tone can sit on any face.",
    sliders: SKIN,
    max: 45,
    step: 1,
  },
  blend: {
    title: "Heritage Mix",
    description:
      "How strongly each parent pulls. 0 is all parent one, 1 is all parent two; third-parent mix layers the last one on top.",
    sliders: HEAD_BLEND_MIX_SLIDERS,
    max: 1,
    step: 0.1,
  },
} as const;

type GroupId = keyof typeof GROUPS;

const NAV: NavItem[] = [
  { id: "shape", label: "Face Shape", icon: "head" },
  { id: "skin", label: "Skin Tone", icon: "droplet" },
  { id: "blend", label: "Heritage Mix", icon: "dna" },
];

export default function FaceBodyTab({ headBlend, onChange }: FaceBodyTabProps) {
  const [group, setGroup] = useState<GroupId>("shape");
  const set = (key: keyof HeadBlend, value: number) => onChange({ ...headBlend, [key]: value });

  const active = GROUPS[group];
  const nav = NAV.map((item) => ({
    ...item,
    dot: GROUPS[item.id as GroupId].sliders.some((s) => headBlend[s.key] !== 0),
  }));

  return (
    <TabLayout
      nav={<SectionNav header="Heritage" items={nav} active={group} onSelect={(id) => setGroup(id as GroupId)} />}
      title={active.title}
      description={active.description}
    >
      <div className="divide-y divide-hairline">
        {active.sliders.map((s) => (
          <Slider
            key={s.key}
            label={shortLabel(s.label)}
            value={headBlend[s.key]}
            min={0}
            max={active.max}
            step={active.step}
            onChange={(v) => set(s.key, v)}
          />
        ))}
      </div>
    </TabLayout>
  );
}
