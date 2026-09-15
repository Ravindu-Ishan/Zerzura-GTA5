"use client";

import { useMemo, useState } from "react";
import Slider from "./Slider";
import Button from "./ui/Button";
import TabLayout, { NavItem, SectionNav } from "./ui/TabLayout";
import { FaceFeatures, FACE_FEATURES } from "@/lib/appearance";
import { IconName } from "./ui/Icon";

interface FaceAdjustmentsTabProps {
  faceFeatures: FaceFeatures;
  onChange: (faceFeatures: FaceFeatures) => void;
}

/**
 * Twenty bipolar sliders in one scroll column is unusable, so they're grouped by the part
 * of the face they actually move.
 *
 * Grouping is by FACE_FEATURES *key* (the illenium-appearance field name), never by index -
 * and anything not listed here falls through to "Other", so adding a feature upstream
 * degrades to "shows up in the wrong group" rather than "silently disappears".
 */
const GROUPS: { id: string; label: string; icon: IconName; description: string; keys: string[] }[] =
  [
    {
      id: "nose",
      label: "Nose",
      icon: "nose",
      description: "Bridge, tip and width. Small moves here change a face more than anything else.",
      keys: [
        "noseWidth",
        "nosePeakHigh",
        "nosePeakSize",
        "noseBoneHigh",
        "nosePeakLowering",
        "noseBoneTwist",
      ],
    },
    {
      id: "eyes",
      label: "Eyes & Brows",
      icon: "eye",
      description: "Brow line and eyelid opening - the main lever on how alert or heavy a face reads.",
      keys: ["eyeBrownHigh", "eyeBrownForward", "eyesOpening"],
    },
    {
      id: "cheeks",
      label: "Cheeks",
      icon: "cheek",
      description: "Cheekbone height and width, plus the soft tissue over them.",
      keys: ["cheeksBoneHigh", "cheeksBoneWidth", "cheeksWidth"],
    },
    {
      id: "jaw",
      label: "Jaw & Chin",
      icon: "jaw",
      description: "The lower silhouette - jaw width and depth, chin length, projection and cleft.",
      keys: [
        "jawBoneWidth",
        "jawBoneBackSize",
        "chinBoneLowering",
        "chinBoneLenght",
        "chinBoneSize",
        "chinHole",
      ],
    },
    {
      id: "mouth",
      label: "Mouth & Neck",
      icon: "mouth",
      description: "Lip fullness and neck thickness.",
      keys: ["lipsThickness", "neckThickness"],
    },
  ];

const GROUPED_KEYS = new Set(GROUPS.flatMap((g) => g.keys));

export default function FaceAdjustmentsTab({ faceFeatures, onChange }: FaceAdjustmentsTabProps) {
  const [group, setGroup] = useState(GROUPS[0].id);

  const groups = useMemo(() => {
    const leftovers = FACE_FEATURES.filter((f) => !GROUPED_KEYS.has(f.key)).map((f) => f.key);
    const all = [...GROUPS];
    if (leftovers.length > 0) {
      all.push({
        id: "other",
        label: "Other",
        icon: "sliders",
        description: "Features not yet sorted into a group.",
        keys: leftovers,
      });
    }
    return all.map((g) => ({
      ...g,
      // Preserve FACE_FEATURES' own order/labels within a group.
      features: FACE_FEATURES.filter((f) => g.keys.includes(f.key)),
    }));
  }, []);

  const active = groups.find((g) => g.id === group) ?? groups[0];
  const touchedInGroup = (keys: string[]) => keys.filter((k) => (faceFeatures[k] ?? 0) !== 0).length;
  const totalTouched = FACE_FEATURES.filter((f) => (faceFeatures[f.key] ?? 0) !== 0).length;

  const set = (key: string, value: number) => onChange({ ...faceFeatures, [key]: value });

  const resetGroup = () => {
    const next = { ...faceFeatures };
    for (const f of active.features) next[f.key] = 0;
    onChange(next);
  };

  const nav: NavItem[] = groups.map((g) => ({
    id: g.id,
    label: g.label,
    icon: g.icon,
    badge: touchedInGroup(g.keys),
  }));

  return (
    <TabLayout
      nav={<SectionNav header="Face Regions" items={nav} active={active.id} onSelect={setGroup} />}
      title={active.label}
      description={active.description}
      action={
        <>
          <span className="t-label !text-[10px]">
            <span className={totalTouched ? "text-accent" : ""}>{totalTouched}</span> edited
          </span>
          <Button
            size="sm"
            icon="x"
            onClick={resetGroup}
            disabled={touchedInGroup(active.keys) === 0}
          >
            Reset
          </Button>
        </>
      }
    >
      <div className="divide-y divide-hairline">
        {active.features.map((f) => (
          <Slider
            key={f.key}
            label={f.label}
            value={faceFeatures[f.key] ?? 0}
            min={-1}
            max={1}
            step={0.1}
            neutral={0}
            onChange={(v) => set(f.key, v)}
          />
        ))}
      </div>
    </TabLayout>
  );
}
