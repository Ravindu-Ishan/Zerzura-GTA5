"use client";

import { useEffect, useState } from "react";
import { fetchNui } from "@/lib/nui";
import {
  CharacterDetails,
  EMPTY_DETAILS,
  HeadBlend,
  DEFAULT_HEAD_BLEND,
  FaceFeatures,
  DEFAULT_FACE_FEATURES,
  HairData,
  DEFAULT_HAIR,
  OverlaysData,
  DEFAULT_OVERLAYS,
  TattoosData,
  Gender,
} from "@/lib/appearance";
import DetailsTab from "./DetailsTab";
import FaceBodyTab from "./FaceBodyTab";
import FaceAdjustmentsTab from "./FaceAdjustmentsTab";
import HairEyesTab from "./HairEyesTab";
import OverlaysTab from "./OverlaysTab";
import TattoosTab from "./TattoosTab";
import Button from "./ui/Button";
import Icon, { IconName } from "./ui/Icon";
import ScreenFrame, { Hint } from "./ui/ScreenFrame";

type Tab = "details" | "facebody" | "faceadjustments" | "hair" | "overlays" | "tattoos";

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "details", label: "Details", icon: "idCard" },
  { id: "facebody", label: "Face & Body", icon: "head" },
  { id: "faceadjustments", label: "Face Adjust", icon: "sliders" },
  { id: "hair", label: "Hair & Eyes", icon: "scissors" },
  { id: "overlays", label: "Overlays", icon: "sparkle" },
  { id: "tattoos", label: "Tattoos", icon: "ink" },
];

/**
 * Bottom-left control legend.
 *
 * HEADS UP: still off. The camera now auto-focuses per tab (see FOCUS_FOR_TAB below and
 * client/main.lua's setCameraFocus), but there's no manual orbit/rotate/zoom input - these
 * hints describe controls that don't exist yet. Flip SHOW_CAMERA_HINTS to true once/if that's
 * actually built.
 */
const SHOW_CAMERA_HINTS = false;
const CAMERA_HINTS: Hint[] = [
  { icon: "mouse", label: "Move Camera", keys: "RMB" },
  { icon: "rotate", label: "Rotate", keys: "A / D" },
  { icon: "zoom", label: "Zoom", keys: "Scroll" },
  { icon: "target", label: "Focus", keys: "F" },
];

// Which camera preset (client/main.lua's CAMERA_FOCUS) each tab frames on. "tattoos" is
// intentionally absent - TattoosTab drives its own focus per body zone instead of one fixed shot.
const FOCUS_FOR_TAB: Partial<Record<Tab, string>> = {
  details: "default",
  facebody: "face",
  faceadjustments: "face",
  hair: "face",
  overlays: "face",
};

interface ModelRanges {
  hairStyleMax: number;
  overlayMax: Record<string, number>;
}

const DEFAULT_RANGES: ModelRanges = { hairStyleMax: 0, overlayMax: {} };

interface CreationFlowProps {
  muted: boolean;
  onToggleMuted: () => void;
}

export default function CreationFlow({ muted, onToggleMuted }: CreationFlowProps) {
  const [tab, setTab] = useState<Tab>("details");
  const [details, setDetails] = useState<CharacterDetails>(EMPTY_DETAILS);
  const [headBlend, setHeadBlendState] = useState<HeadBlend>(DEFAULT_HEAD_BLEND);
  const [faceFeatures, setFaceFeaturesState] = useState<FaceFeatures>(DEFAULT_FACE_FEATURES);
  const [hair, setHairState] = useState<HairData>(DEFAULT_HAIR);
  const [eyeColor, setEyeColorState] = useState(0);
  const [overlays, setOverlaysState] = useState<OverlaysData>(DEFAULT_OVERLAYS);
  const [tattoos, setTattoosState] = useState<TattoosData>({});
  const [ranges, setRanges] = useState<ModelRanges>(DEFAULT_RANGES);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refreshRanges = () =>
    fetchNui<ModelRanges>("getModelRanges", {}, DEFAULT_RANGES).then(setRanges);

  useEffect(() => {
    refreshRanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tattoos tab drives its own per-zone focus (see TattoosTab) - skip it here so we don't
  // fight it with a fixed shot every time `tab` happens to still say "tattoos".
  useEffect(() => {
    const focus = FOCUS_FOR_TAB[tab];
    if (focus) fetchNui("setCameraFocus", { focus });
  }, [tab]);

  const onGenderChange = async (gender: Gender) => {
    await fetchNui("setGender", { gender });
    refreshRanges();
  };

  const onHeadBlendChange = (next: HeadBlend) => {
    setHeadBlendState(next);
    fetchNui("setHeadBlend", next);
  };

  const onFaceFeaturesChange = (next: FaceFeatures) => {
    setFaceFeaturesState(next);
    fetchNui("setFaceFeatures", next);
  };

  const onHairChange = (next: HairData) => {
    setHairState(next);
    fetchNui("setHair", next);
  };

  const onEyeColorChange = (next: number) => {
    setEyeColorState(next);
    fetchNui("setEyeColor", { eyeColor: next });
  };

  const onOverlaysChange = (next: OverlaysData) => {
    setOverlaysState(next);
    fetchNui("setHeadOverlays", next);
  };

  const onTattoosChange = (next: TattoosData) => {
    setTattoosState(next);
    fetchNui("setTattoos", next);
  };

  const cancel = () => fetchNui("cancelCreation");

  const detailsComplete = Boolean(
    details.firstname && details.lastname && details.nationality && details.birthdate
  );

  const submit = async () => {
    setError(null);
    if (!detailsComplete) {
      setTab("details");
      setError("All identity fields are required before you can create this character.");
      return;
    }

    setSubmitting(true);
    const result = await fetchNui<{ success: boolean }>(
      "submitNewCharacter",
      { details },
      { success: true }
    );
    setSubmitting(false);

    if (!result.success) {
      setTab("details");
      setError("Couldn't create character - check your details and try again.");
    }
  };

  const stepIndex = TABS.findIndex((t) => t.id === tab) + 1;
  const fullName = [details.firstname, details.lastname].filter(Boolean).join(" ");

  return (
    <ScreenFrame
      hints={SHOW_CAMERA_HINTS ? CAMERA_HINTS : undefined}
      chips={
        <>
          <span className="chip">
            <Icon name="user" size={13} />
            {details.gender}
          </span>
          <span className={`chip ${detailsComplete ? "chip-accent" : ""}`}>
            {fullName || "Unnamed"}
          </span>
          <span className="chip">
            <span className="t-num">
              {String(stepIndex).padStart(2, "0")} / {String(TABS.length).padStart(2, "0")}
            </span>
          </span>
          <button className="chip" onClick={onToggleMuted} aria-pressed={muted}>
            <Icon name={muted ? "volumeOff" : "volumeOn"} size={13} />
          </button>
        </>
      }
    >
      {/* WIDTH IS LOAD-BEARING: 860px is the widest footprint on any screen, and
          Config.PreviewCamera.screenShift (0.42) in client/config.lua is tuned against exactly
          this number so the 3D ped clears it on the right of a 1920-wide display. Changing it
          means retuning that value - see the comment above it. Still 860 after this rebuild:
          the screen got TALLER and lost its enclosure, it did not get wider.

          There is deliberately no single wrapper surface here. This is a gapped stack of
          separate flat blocks - header plate, tab strip, body, action row - exactly like
          SelectScreen. Wrapping it in one .panel is what made it read as a form on a
          background instead of part of the game. */}
      <div className="anim-rise flex h-full w-[860px] flex-col gap-2.5">
        {/* ---- header plate ----
            Flat navy band + its own lighter underline strip, matching the reference's
            "SELECT CHARACTER" plate - and identical to the one SelectScreen uses. */}
        <div className="shrink-0">
          <div className="band flex items-center justify-between gap-6 px-6 py-4">
            <h1 className="t-display text-[28px] leading-none text-white">Character Creator</h1>
            <Button variant="ghost" size="sm" icon="back" onClick={cancel}>
              Back to Roster
            </Button>
          </div>
          <div className="band-underline" />
        </div>

        {/* ---- tab strip ----
            Its own block now rather than a rule drawn inside the old enclosure. Flat segments
            with an accent underline on the active one - no pills, no floating white capsule. */}
        <div className="panel scroll-thin flex shrink-0 items-center overflow-x-auto px-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              className="tab"
              data-active={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
              {t.id === "details" && !detailsComplete && (
                <span className="ml-0.5 h-[5px] w-[5px] shrink-0 bg-danger" />
              )}
            </button>
          ))}
        </div>

        {/* ---- tab body ----
            No padding and no surface of its own: each tab renders through TabLayout, whose
            nav rail and content pane are now their own blocks and carry their own padding. */}
        <div className="flex min-h-0 flex-1 flex-col">
          {tab === "details" && (
            <DetailsTab details={details} onChange={setDetails} onGenderChange={onGenderChange} />
          )}
          {tab === "facebody" && <FaceBodyTab headBlend={headBlend} onChange={onHeadBlendChange} />}
          {tab === "faceadjustments" && (
            <FaceAdjustmentsTab faceFeatures={faceFeatures} onChange={onFaceFeaturesChange} />
          )}
          {tab === "hair" && (
            <HairEyesTab
              hair={hair}
              onHairChange={onHairChange}
              hairStyleMax={ranges.hairStyleMax}
              eyeColor={eyeColor}
              onEyeColorChange={onEyeColorChange}
            />
          )}
          {tab === "overlays" && (
            <OverlaysTab
              overlays={overlays}
              overlayMax={ranges.overlayMax}
              onChange={onOverlaysChange}
            />
          )}
          {tab === "tattoos" && <TattoosTab applied={tattoos} onChange={onTattoosChange} />}
        </div>

        {/* ---- action row ----
            Same shape as SelectScreen's: the buttons are solid self-contained blocks, so they
            sit straight on the game world with no bar behind them. Only the status line needs
            a surface of its own - a 12px sentence over a bright scene is unreadable - so it
            gets a height-matched block. Severity colour-coding is unchanged: muted neutral,
            then the teal primary confirm hard against the right edge. */}
        <div className="flex shrink-0 items-center gap-2.5">
          {error ? (
            <p className="panel anim-fade flex h-10 min-w-0 flex-1 items-center gap-2 border-l-[3px] border-danger px-4 text-[12.5px] text-danger">
              <Icon name="alert" size={15} className="shrink-0" />
              <span className="truncate">{error}</span>
            </p>
          ) : (
            <p className="panel flex h-10 min-w-0 flex-1 items-center px-4 text-[12.5px] text-white/45">
              <span className="truncate">
                {detailsComplete
                  ? "Looking good. Create when you're happy with the mirror."
                  : "Fill in the Details tab to unlock character creation."}
              </span>
            </p>
          )}
          <Button variant="ghost" icon="x" onClick={cancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={submitting ? undefined : "check"}
            disabled={submitting || !detailsComplete}
            onClick={submit}
            className="min-w-[200px]"
          >
            {submitting ? "Creating..." : "Create Character"}
          </Button>
        </div>
      </div>
    </ScreenFrame>
  );
}
