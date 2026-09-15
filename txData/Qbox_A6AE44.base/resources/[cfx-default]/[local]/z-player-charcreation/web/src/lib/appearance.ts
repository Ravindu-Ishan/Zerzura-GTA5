// Field names/ranges here must match illenium-appearance's own game/constants.lua and the
// ranges its game/customization.lua reports (see that resource's exported setPedHeadBlend /
// setPedFaceFeatures) - not invented, read directly from its source.

export type Gender = "Male" | "Female";

export interface HeadBlend {
  shapeFirst: number;
  shapeSecond: number;
  shapeThird: number;
  skinFirst: number;
  skinSecond: number;
  skinThird: number;
  shapeMix: number;
  skinMix: number;
  thirdMix: number;
}

export const DEFAULT_HEAD_BLEND: HeadBlend = {
  shapeFirst: 0,
  shapeSecond: 0,
  shapeThird: 0,
  skinFirst: 0,
  skinSecond: 0,
  skinThird: 0,
  shapeMix: 0,
  skinMix: 0,
  thirdMix: 0,
};

export const HEAD_BLEND_PARENT_SLIDERS: { key: keyof HeadBlend; label: string }[] = [
  { key: "shapeFirst", label: "Face Shape - Parent 1" },
  { key: "shapeSecond", label: "Face Shape - Parent 2" },
  { key: "shapeThird", label: "Face Shape - Parent 3" },
  { key: "skinFirst", label: "Skin Tone - Parent 1" },
  { key: "skinSecond", label: "Skin Tone - Parent 2" },
  { key: "skinThird", label: "Skin Tone - Parent 3" },
];

export const HEAD_BLEND_MIX_SLIDERS: { key: keyof HeadBlend; label: string }[] = [
  { key: "shapeMix", label: "Shape Mix" },
  { key: "skinMix", label: "Skin Mix" },
  { key: "thirdMix", label: "Third Parent Mix" },
];

export type FaceFeatures = Record<string, number>;

export const FACE_FEATURES: { key: string; label: string }[] = [
  { key: "noseWidth", label: "Nose Width" },
  { key: "nosePeakHigh", label: "Nose Peak Height" },
  { key: "nosePeakSize", label: "Nose Peak Size" },
  { key: "noseBoneHigh", label: "Nose Bone Height" },
  { key: "nosePeakLowering", label: "Nose Peak Lowering" },
  { key: "noseBoneTwist", label: "Nose Bone Twist" },
  { key: "eyeBrownHigh", label: "Eyebrow Height" },
  { key: "eyeBrownForward", label: "Eyebrow Depth" },
  { key: "cheeksBoneHigh", label: "Cheekbone Height" },
  { key: "cheeksBoneWidth", label: "Cheekbone Width" },
  { key: "cheeksWidth", label: "Cheek Width" },
  { key: "eyesOpening", label: "Eye Opening" },
  { key: "lipsThickness", label: "Lip Thickness" },
  { key: "jawBoneWidth", label: "Jaw Width" },
  { key: "jawBoneBackSize", label: "Jaw Back Size" },
  { key: "chinBoneLowering", label: "Chin Lowering" },
  { key: "chinBoneLenght", label: "Chin Length" },
  { key: "chinBoneSize", label: "Chin Size" },
  { key: "chinHole", label: "Chin Hole" },
  { key: "neckThickness", label: "Neck Thickness" },
];

export const DEFAULT_FACE_FEATURES: FaceFeatures = Object.fromEntries(
  FACE_FEATURES.map((f) => [f.key, 0])
);

export interface HairData {
  style: number;
  texture: number;
  color: number;
  highlight: number;
}

export const DEFAULT_HAIR: HairData = { style: 0, texture: 0, color: 0, highlight: 0 };

// GTA5's fixed MP hair/makeup color palette size (native game data, not something
// illenium-appearance defines - safe to hardcode).
export const HAIR_COLOR_MAX = 63;

export const OVERLAY_KEYS = [
  "blemishes",
  "beard",
  "eyebrows",
  "ageing",
  "makeUp",
  "blush",
  "complexion",
  "sunDamage",
  "lipstick",
  "moleAndFreckles",
  "chestHair",
  "bodyBlemishes",
] as const;

export type OverlayKey = (typeof OVERLAY_KEYS)[number];

export interface OverlaySetting {
  style: number;
  opacity: number;
  color: number;
  secondColor: number;
}

export type OverlaysData = Record<OverlayKey, OverlaySetting>;

export const OVERLAY_LABELS: Record<OverlayKey, string> = {
  blemishes: "Blemishes",
  beard: "Beard",
  eyebrows: "Eyebrows",
  ageing: "Ageing",
  makeUp: "Makeup",
  blush: "Blush",
  complexion: "Complexion",
  sunDamage: "Sun Damage",
  lipstick: "Lipstick",
  moleAndFreckles: "Moles & Freckles",
  chestHair: "Chest Hair",
  bodyBlemishes: "Body Blemishes",
};

// Matches illenium-appearance's own colorMap (game/customization.lua) - which overlays take a
// color, and from which palette.
export const OVERLAY_COLOR_PALETTE: Partial<Record<OverlayKey, "hair" | "makeup">> = {
  beard: "hair",
  eyebrows: "hair",
  chestHair: "hair",
  makeUp: "makeup",
  blush: "makeup",
  lipstick: "makeup",
};

export const DEFAULT_OVERLAYS: OverlaysData = Object.fromEntries(
  OVERLAY_KEYS.map((k) => [k, { style: 0, opacity: 0, color: 0, secondColor: 0 }])
) as OverlaysData;

export interface TattooEntry {
  name: string;
  label: string;
  zone: string;
  collection: string;
  hashMale: string;
  hashFemale: string;
}

// One applied tattoo, as illenium-appearance's setPedTattoos expects it (keyed by zone, see
// game/util.lua's setTattoos - it reads collection + hashMale/hashFemale + opacity per entry).
export interface AppliedTattoo {
  collection: string;
  hashMale: string;
  hashFemale: string;
  opacity: number;
}

export type TattoosData = Record<string, AppliedTattoo[]>;

export interface CharacterDetails {
  firstname: string;
  lastname: string;
  nationality: string;
  gender: Gender;
  birthdate: string;
}

export const EMPTY_DETAILS: CharacterDetails = {
  firstname: "",
  lastname: "",
  nationality: "",
  gender: "Male",
  birthdate: "",
};
