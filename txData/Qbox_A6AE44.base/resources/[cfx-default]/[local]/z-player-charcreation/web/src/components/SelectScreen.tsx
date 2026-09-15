"use client";

import { useEffect, useState } from "react";
import { fetchNui } from "@/lib/nui";
import { Gender } from "@/lib/appearance";
import Button from "./ui/Button";
import Icon from "./ui/Icon";
import ScreenFrame from "./ui/ScreenFrame";

export interface CharacterSummary {
  citizenid: string;
  firstname: string;
  lastname: string;
  gender: Gender;
}

interface SelectScreenProps {
  characters: CharacterSummary[];
  maxSlots: number;
}

function initials(c: CharacterSummary) {
  return `${c.firstname.charAt(0)}${c.lastname.charAt(0)}`.toUpperCase() || "??";
}

export default function SelectScreen({ characters, maxSlots }: SelectScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Held as an id rather than a boolean so that when Lua re-sends `init` after a delete and
  // this list comes back shorter, the confirm state can't survive on a character that's gone.
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Derived, not stored: the roster is replaced wholesale by `init`, so resolving the
  // selection at render time keeps it valid without an effect that re-syncs state.
  const selected = characters.find((c) => c.citizenid === selectedId) ?? characters[0] ?? null;
  const confirmingDelete = selected !== null && confirmDeleteId === selected.citizenid;
  const canCreate = characters.length < maxSlots;

  // Lua already previews the first character on its own when this screen opens; this just keeps
  // the 3D preview in sync as the player clicks through the roster.
  useEffect(() => {
    if (selected) fetchNui("previewCharacter", { citizenid: selected.citizenid });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.citizenid]);

  const play = (citizenid: string) => {
    setBusy(true);
    fetchNui("selectCharacter", { citizenid });
  };
  const remove = (citizenid: string) => {
    setConfirmDeleteId(null);
    fetchNui("deleteCharacter", { citizenid });
  };
  const startCreation = () => fetchNui("startCreation");
  const quit = () => fetchNui("quit");

  return (
    <ScreenFrame
      chips={
        <>
          <span className="chip">
            <Icon name="user" size={13} />
            Roster
          </span>
          <span className={`chip ${canCreate ? "chip-accent" : ""}`}>
            <span className="t-num">
              {String(characters.length).padStart(2, "0")} / {String(maxSlots).padStart(2, "0")}
            </span>
            Slots
          </span>
        </>
      }
    >
      <div className="panel anim-rise flex max-h-full w-[716px] flex-col">
        {/* ---- panel header ---- */}
        <div className="flex items-end justify-between gap-6 border-b border-hairline px-6 py-5">
          <div>
            <div className="t-eyebrow">Character Roster</div>
            <h1 className="t-display mt-2 text-[30px] leading-none">Select Character</h1>
          </div>
          <p className="max-w-[250px] pb-1 text-right text-[12.5px] leading-snug text-white/40">
            Choose who you&apos;re bringing into Los Santos, or start a new life.
          </p>
        </div>

        {/* ---- roster + detail ---- */}
        <div className="grid min-h-0 flex-1 gap-4 p-5" style={{ gridTemplateColumns: "minmax(0,1fr) 232px" }}>
          <div className="scroll-thin flex min-h-0 flex-col gap-2 overflow-y-auto pr-1.5">
            {characters.map((c, i) => (
              <button
                key={c.citizenid}
                className="card flex items-center gap-3.5 px-3.5 py-3 text-left"
                data-active={c.citizenid === selected?.citizenid}
                onClick={() => {
                  setSelectedId(c.citizenid);
                  setConfirmDeleteId(null);
                }}
                onDoubleClick={() => play(c.citizenid)}
              >
                <span
                  className={`t-display grid h-11 w-11 shrink-0 place-items-center rounded-lg border text-[15px] ${
                    c.citizenid === selected?.citizenid
                      ? "border-accent/50 bg-accent/15 text-accent"
                      : "border-white/10 bg-black/40 text-white/60"
                  }`}
                >
                  {initials(c)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="t-display block truncate text-[16px] text-white">
                    {c.firstname} {c.lastname}
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-[11.5px] text-white/40">
                    <span className="t-num tracking-wide">{c.citizenid}</span>
                    <span className="h-2.5 w-px bg-white/15" />
                    <span className="uppercase tracking-[0.12em]">{c.gender}</span>
                  </span>
                </span>
                <span className="t-eyebrow shrink-0 !tracking-[0.2em]">
                  Slot {String(i + 1).padStart(2, "0")}
                </span>
              </button>
            ))}

            {canCreate && (
              <button
                onClick={startCreation}
                className="group flex items-center gap-3.5 rounded-[10px] border border-dashed border-white/15 px-3.5 py-3 text-left transition-colors hover:border-accent/60 hover:bg-accent/[0.06]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-dashed border-white/15 text-white/40 transition-colors group-hover:border-accent/60 group-hover:text-accent">
                  <Icon name="plus" size={18} />
                </span>
                <span>
                  <span className="t-display block text-[15px] text-white/70 transition-colors group-hover:text-accent">
                    New Character
                  </span>
                  <span className="mt-0.5 block text-[11.5px] text-white/35">
                    {maxSlots - characters.length} slot
                    {maxSlots - characters.length === 1 ? "" : "s"} remaining
                  </span>
                </span>
              </button>
            )}
          </div>

          {/* ---- secondary detail panel ---- */}
          <aside className="well flex min-h-0 flex-col p-4">
            {selected ? (
              confirmingDelete ? (
                <div className="anim-fade flex h-full flex-col">
                  <Icon name="alert" size={22} className="text-danger" />
                  <div className="t-display mt-3 text-[15px] text-white">Delete Character?</div>
                  <p className="mt-2 text-[12px] leading-snug text-white/45">
                    <span className="text-white/80">
                      {selected.firstname} {selected.lastname}
                    </span>{" "}
                    and everything they own will be gone for good. This can&apos;t be undone.
                  </p>
                  <div className="mt-auto flex flex-col gap-2 pt-4">
                    <Button
                      variant="danger"
                      size="sm"
                      icon="trash"
                      onClick={() => remove(selected.citizenid)}
                    >
                      Delete Forever
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>
                      Keep
                    </Button>
                  </div>
                </div>
              ) : (
                <div key={selected.citizenid} className="anim-fade flex h-full flex-col">
                  <div className="t-eyebrow">Selected</div>
                  <div className="t-display mt-3 grid h-16 w-16 place-items-center rounded-xl border border-accent/40 bg-accent/10 text-[22px] text-accent shadow-[0_0_30px_-10px_rgba(46,230,200,.8)]">
                    {initials(selected)}
                  </div>
                  <div className="t-display mt-4 text-[18px] leading-tight text-white">
                    {selected.firstname}
                    <br />
                    {selected.lastname}
                  </div>
                  <dl className="mt-4 space-y-2 border-t border-hairline pt-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="t-label !text-[10px]">Citizen ID</dt>
                      <dd className="t-num text-[12px] text-white/75">{selected.citizenid}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="t-label !text-[10px]">Gender</dt>
                      <dd className="text-[12px] uppercase tracking-wide text-white/75">
                        {selected.gender}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-auto pt-4 text-[11px] leading-snug text-white/30">
                    Double-click a character to jump straight in.
                  </p>
                </div>
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Icon name="user" size={26} className="text-white/20" />
                <div className="t-display mt-3 text-[14px] text-white/50">No Characters</div>
                <p className="mt-2 text-[11.5px] leading-snug text-white/30">
                  Create your first character to get started.
                </p>
              </div>
            )}
          </aside>
        </div>

        {/* ---- action bar ---- */}
        <div className="flex items-center gap-2.5 border-t border-hairline px-5 py-4">
          <Button
            variant="primary"
            icon="play"
            disabled={!selected || busy}
            onClick={() => selected && play(selected.citizenid)}
            className="min-w-[168px]"
          >
            {busy ? "Loading..." : "Play"}
          </Button>
          <Button
            variant="danger"
            icon="trash"
            disabled={!selected || confirmingDelete}
            onClick={() => selected && setConfirmDeleteId(selected.citizenid)}
          >
            Delete
          </Button>
          <span className="flex-1" />
          <Button variant="ghost" icon="power" onClick={quit}>
            Quit
          </Button>
        </div>
      </div>
    </ScreenFrame>
  );
}
