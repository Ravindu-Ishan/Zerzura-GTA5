"use client";

import { ReactNode } from "react";
import { CharacterDetails, Gender } from "@/lib/appearance";
import Icon from "./ui/Icon";
import TabLayout from "./ui/TabLayout";

interface DetailsTabProps {
  details: CharacterDetails;
  onChange: (details: CharacterDetails) => void;
  onGenderChange: (gender: Gender) => void;
}

function Field({
  label,
  hint,
  filled,
  children,
}: {
  label: string;
  hint?: string;
  filled: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="t-label mb-1.5 flex items-center gap-1.5">
        {label}
        {!filled && <span className="h-1 w-1 rounded-full bg-danger/80" />}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-white/25">{hint}</span>}
    </label>
  );
}

const GENDERS: { value: Gender; caption: string }[] = [
  { value: "Male", caption: "mp_m_freemode_01" },
  { value: "Female", caption: "mp_f_freemode_01" },
];

export default function DetailsTab({ details, onChange, onGenderChange }: DetailsTabProps) {
  return (
    <TabLayout
      title="Identity"
      description="This is the paperwork - the name on your licence, and the body you'll wake up in. Everything here is written to your citizen record."
    >
      <div className="grid gap-5" style={{ gridTemplateColumns: "minmax(0,1fr) 216px" }}>
        {/* ---- paperwork ---- */}
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" filled={!!details.firstname}>
              <input
                className="field"
                placeholder="Jane"
                maxLength={32}
                value={details.firstname}
                onChange={(e) => onChange({ ...details, firstname: e.target.value })}
              />
            </Field>
            <Field label="Last Name" filled={!!details.lastname}>
              <input
                className="field"
                placeholder="Doe"
                maxLength={32}
                value={details.lastname}
                onChange={(e) => onChange({ ...details, lastname: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Nationality" filled={!!details.nationality}>
            <input
              className="field"
              placeholder="American"
              maxLength={48}
              value={details.nationality}
              onChange={(e) => onChange({ ...details, nationality: e.target.value })}
            />
          </Field>

          <Field
            label="Date of Birth"
            hint="Used on your ID and by anyone who checks it."
            filled={!!details.birthdate}
          >
            <input
              type="date"
              className="field"
              value={details.birthdate}
              onChange={(e) => onChange({ ...details, birthdate: e.target.value })}
            />
          </Field>
        </div>

        {/* ---- body model ---- */}
        <div>
          <span className="t-label mb-1.5 block">Body</span>
          <div className="flex flex-col gap-2">
            {GENDERS.map((g) => {
              const active = details.gender === g.value;
              return (
                <button
                  key={g.value}
                  className="card flex items-center gap-3 px-3 py-3 text-left"
                  data-active={active}
                  onClick={() => {
                    if (active) return;
                    // Order matters: the ped model swap is what resets hair/overlay ranges,
                    // so the parent re-queries getModelRanges off the back of this call.
                    onChange({ ...details, gender: g.value });
                    onGenderChange(g.value);
                  }}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${
                      active
                        ? "border-accent/50 bg-accent/15 text-accent"
                        : "border-white/10 bg-black/40 text-white/45"
                    }`}
                  >
                    <Icon name="user" size={17} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`t-display block text-[14px] ${active ? "text-accent" : "text-white/80"}`}
                    >
                      {g.value}
                    </span>
                    <span className="t-num block truncate text-[10.5px] text-white/30">
                      {g.caption}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] leading-snug text-white/30">
            Switching body swaps the ped model and reloads the hair and overlay catalogues, so do
            this first.
          </p>
        </div>
      </div>
    </TabLayout>
  );
}
