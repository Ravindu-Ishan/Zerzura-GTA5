"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchNui } from "@/lib/nui";
import { TattooEntry, TattoosData } from "@/lib/appearance";
import Button from "./ui/Button";
import Icon, { IconName } from "./ui/Icon";
import TabLayout, { NavItem, SectionNav } from "./ui/TabLayout";

interface TattoosTabProps {
  applied: TattoosData;
  onChange: (tattoos: TattoosData) => void;
}

type Catalog = Record<string, TattooEntry[]>;

const ZONES: { id: string; label: string; icon: IconName }[] = [
  { id: "ZONE_HEAD", label: "Head", icon: "head" },
  { id: "ZONE_HAIR", label: "Scalp", icon: "scissors" },
  { id: "ZONE_TORSO", label: "Torso", icon: "user" },
  { id: "ZONE_LEFT_ARM", label: "Left Arm", icon: "ink" },
  { id: "ZONE_RIGHT_ARM", label: "Right Arm", icon: "ink" },
  { id: "ZONE_LEFT_LEG", label: "Left Leg", icon: "ink" },
  { id: "ZONE_RIGHT_LEG", label: "Right Leg", icon: "ink" },
];

// Maps each body zone to the matching client/main.lua CAMERA_FOCUS preset. Framing only -
// undressing is tab-wide (the setTattoosMode effect below), not per-zone, so there is nothing
// zone-specific to do here beyond picking the right key.
const FOCUS_FOR_ZONE: Record<string, string> = {
  ZONE_HEAD: "face",
  ZONE_HAIR: "face",
  ZONE_TORSO: "torso",
  ZONE_LEFT_ARM: "leftArm",
  ZONE_RIGHT_ARM: "rightArm",
  ZONE_LEFT_LEG: "leftLeg",
  ZONE_RIGHT_LEG: "rightLeg",
};

const MOCK_CATALOG: Catalog = {
  ZONE_TORSO: [
    {
      name: "TAT_MOCK_000",
      label: "Mock Tattoo",
      zone: "ZONE_TORSO",
      collection: "mock_overlays",
      hashMale: "Mock_M",
      hashFemale: "Mock_F",
    },
  ],
};

function tattooKey(t: TattooEntry) {
  return `${t.collection}:${t.hashMale}`;
}

export default function TattoosTab({ applied, onChange }: TattoosTabProps) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [zone, setZone] = useState("ZONE_TORSO");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchNui<Catalog>("getTattooCatalog", {}, MOCK_CATALOG).then(setCatalog);
  }, []);

  // Undress for the whole time this tab is open (every zone needs it, not just the one
  // currently focused) and re-dress on the way out - mount/unmount, not per-zone.
  useEffect(() => {
    fetchNui("setTattoosMode", { active: true });
    return () => {
      fetchNui("setTattoosMode", { active: false });
    };
  }, []);

  // Re-frames the camera on whichever body part this zone covers every time it changes
  // (including the initial zone on mount, so opening straight into Tattoos still focuses).
  useEffect(() => {
    fetchNui("setCameraFocus", { focus: FOCUS_FOR_ZONE[zone] ?? "default" });
  }, [zone]);

  const appliedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const zoneTattoos of Object.values(applied)) {
      for (const t of zoneTattoos) keys.add(`${t.collection}:${t.hashMale}`);
    }
    return keys;
  }, [applied]);

  const visible = useMemo(() => {
    if (!catalog) return [];
    const list = catalog[zone] ?? [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((t) => t.label.toLowerCase().includes(q));
  }, [catalog, zone, search]);

  const toggle = (t: TattooEntry) => {
    const key = tattooKey(t);
    const zoneList = applied[t.zone] ?? [];
    const isApplied = zoneList.some((a) => `${a.collection}:${a.hashMale}` === key);

    const nextZoneList = isApplied
      ? zoneList.filter((a) => `${a.collection}:${a.hashMale}` !== key)
      : [
          ...zoneList,
          { collection: t.collection, hashMale: t.hashMale, hashFemale: t.hashFemale, opacity: 1 },
        ];

    onChange({ ...applied, [t.zone]: nextZoneList });
  };

  const clearZone = () => onChange({ ...applied, [zone]: [] });

  const totalApplied = appliedKeys.size;
  const zoneCount = (applied[zone] ?? []).length;
  const zoneLabel = ZONES.find((z) => z.id === zone)?.label ?? zone;
  const zoneTotal = catalog?.[zone]?.length ?? 0;

  const nav: NavItem[] = ZONES.map((z) => ({
    id: z.id,
    label: z.label,
    icon: z.icon,
    badge: (applied[z.id] ?? []).length,
  }));

  return (
    <TabLayout
      nav={
        <SectionNav
          header={`Body Zones - ${totalApplied} inked`}
          items={nav}
          active={zone}
          onSelect={(id) => {
            setZone(id);
            setSearch("");
          }}
        />
      }
      title={zoneLabel}
      description={
        catalog
          ? `${zoneTotal} design${zoneTotal === 1 ? "" : "s"} available in this zone. Pick as many as you like - they stack.`
          : "Loading the tattoo catalogue from the game..."
      }
      action={
        <Button size="sm" icon="x" onClick={clearZone} disabled={zoneCount === 0}>
          Clear Zone
        </Button>
      }
      sticky={
        <div className="relative mb-3">
          <Icon
            name="search"
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            className="field pl-9"
            placeholder={`Search ${zoneLabel.toLowerCase()} designs...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-white/35 hover:bg-white/10 hover:text-white"
            >
              <Icon name="x" size={13} />
            </button>
          )}
        </div>
      }
    >
      {!catalog && <p className="text-[12.5px] text-white/35">Loading catalogue...</p>}

      {catalog && visible.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Icon name="search" size={22} className="text-white/20" />
          <p className="mt-3 text-[12.5px] text-white/40">
            {search ? `Nothing in ${zoneLabel} matches "${search}".` : "No designs in this zone."}
          </p>
        </div>
      )}

      {catalog && visible.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {visible.map((t) => {
            const on = appliedKeys.has(tattooKey(t));
            return (
              <button
                key={tattooKey(t)}
                onClick={() => toggle(t)}
                data-active={on}
                className="card flex items-center gap-2.5 px-2.5 py-2 text-left"
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center border transition-colors ${
                    on
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-white/20 bg-black/40 text-transparent"
                  }`}
                >
                  <Icon name="check" size={12} strokeWidth={2.6} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-[12.5px] leading-tight ${on ? "text-accent" : "text-white/80"}`}
                  >
                    {t.label}
                  </span>
                  <span className="t-num block truncate text-[10px] leading-tight text-white/25">
                    {t.collection}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </TabLayout>
  );
}
