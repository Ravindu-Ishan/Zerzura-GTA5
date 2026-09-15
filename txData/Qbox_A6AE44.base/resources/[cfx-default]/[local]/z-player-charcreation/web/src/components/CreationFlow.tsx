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

export default function CreationFlow() {
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
        </>
      }
    >
      <div className="panel anim-rise flex h-[660px] max-h-full w-[860px] flex-col">
        {/* ---- panel header ---- */}
        <div className="flex items-end justify-between gap-6 border-b border-hairline px-6 pt-5 pb-4">
          <div>
            <div className="t-eyebrow">New Resident</div>
            <h1 className="t-display mt-2 text-[27px] leading-none">Character Creator</h1>
          </div>
          <Button variant="ghost" size="sm" icon="back" onClick={cancel}>
            Back to Roster
          </Button>
        </div>

        {/* ---- tab bar ---- */}
        <div className="scroll-thin flex items-center gap-1 overflow-x-auto border-b border-hairline px-4 py-2.5">
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
                <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-danger shadow-[0_0_8px_rgba(255,85,102,.9)]" />
              )}
            </button>
          ))}
        </div>

        {/* ---- tab body ---- */}
        <div className="flex min-h-0 flex-1 flex-col p-5">
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

        {/* ---- action bar ---- */}
        <div className="flex items-center gap-3 border-t border-hairline px-5 py-4">
          {error ? (
            <p className="anim-fade flex min-w-0 flex-1 items-center gap-2 text-[12.5px] text-danger">
              <Icon name="alert" size={15} />
              <span className="truncate">{error}</span>
            </p>
          ) : (
            <p className="min-w-0 flex-1 truncate text-[12px] text-white/35">
              {detailsComplete
                ? "Looking good. Create when you're happy with the mirror."
                : "Fill in the Details tab to unlock character creation."}
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
