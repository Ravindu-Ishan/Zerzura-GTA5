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
  muted: boolean;
  onToggleMuted: () => void;
}

/**
 * The roster screen, rebuilt against the reference screenshot.
 *
 * Structurally this is no longer "one bordered card containing a list and a detail pane".
 * It is a STACK OF SEPARATE FLAT BLOCKS - a header plate, then one block per character,
 * then an action row - with real gaps between them and nothing wrapping the lot. That
 * discrete-blocks composition is most of why the reference reads as game chrome rather
 * than as a dialog.
 *
 * Consequences of that, deliberately:
 *   - the 232px right-hand detail aside is gone. Everything it showed (citizen id, gender)
 *     now lives in the row's own subtitle line, exactly like the reference's "Sri Lankan"
 *     under "JOHN DOE". Nothing is lost and the panel gets much narrower.
 *   - the initials avatar tile is gone. The reference has no avatar, and the 3D ped preview
 *     to the right of the screen is already a far better picture of the character.
 *
 * PANEL_WIDTH is down from the old 716px to 520px. Narrower is always safe for the ped
 * framing (the camera pushes the character to the right of screen and the widest panel,
 * CreationFlow's 860px, is what Config.PreviewCamera.screenShift is tuned against) - this
 * only ever opens up MORE clear space, never less.
 */
const PANEL_WIDTH = 520;

export default function SelectScreen({ characters, maxSlots, muted, onToggleMuted }: SelectScreenProps) {
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
  const slotsLeft = maxSlots - characters.length;

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
          <button className="chip" onClick={onToggleMuted} aria-pressed={muted}>
            <Icon name={muted ? "volumeOff" : "volumeOn"} size={13} />
          </button>
        </>
      }
    >
      {/* self-center: ScreenFrame stretches its child by default (so CreationFlow can be
          full-height). The roster is short and reads better centred, so it opts out. */}
      <div
        className="anim-rise flex max-h-full flex-col gap-2.5 self-center"
        style={{ width: PANEL_WIDTH }}
      >
        {/* ---- header plate ----
            A solid navy slab with the title set tight and heavy, and its own short lighter
            strip underneath. Not a <h1> with a border-bottom: the strip is a separate bar,
            which is what makes it read as a stamped HUD plate. */}
        <div className="shrink-0">
          <div className="band px-6 py-5">
            <h1 className="t-display text-[36px] leading-none text-white">Select Character</h1>
          </div>
          <div className="band-underline" />
        </div>

        {/* ---- roster ---- */}
        <div className="scroll-thin flex min-h-0 flex-col gap-2.5 overflow-y-auto">
          {characters.map((c, i) => (
            <button
              key={c.citizenid}
              className="card flex shrink-0 items-center gap-4 px-5 py-3.5 text-left"
              data-active={c.citizenid === selected?.citizenid}
              onClick={() => {
                setSelectedId(c.citizenid);
                setConfirmDeleteId(null);
              }}
              onDoubleClick={() => play(c.citizenid)}
            >
              <span className="min-w-0 flex-1">
                <span className="t-display block truncate text-[20px] text-white">
                  {c.firstname} {c.lastname}
                </span>
                <span className="mt-1 flex items-center gap-2 text-[12.5px] leading-none text-white/45">
                  <span className="t-num">{c.citizenid}</span>
                  <span className="h-3 w-px bg-white/20" />
                  <span>{c.gender}</span>
                </span>
              </span>
              <span
                className={`t-display shrink-0 text-[17px] ${
                  c.citizenid === selected?.citizenid ? "text-accent" : "text-white/55"
                }`}
              >
                Slot {String(i + 1).padStart(2, "0")}
              </span>
            </button>
          ))}

          {canCreate && (
            <button
              onClick={startCreation}
              className="card group flex shrink-0 items-center gap-4 px-5 py-3.5 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="t-display block text-[20px] text-white/85 transition-colors group-hover:text-accent">
                  New Character
                </span>
                <span className="mt-1 block text-[12.5px] leading-none text-white/45">
                  {slotsLeft} slot{slotsLeft === 1 ? "" : "s"} remaining
                </span>
              </span>
              <Icon
                name="plus"
                size={20}
                className="shrink-0 text-white/40 transition-colors group-hover:text-accent"
              />
            </button>
          )}

          {characters.length === 0 && (
            <div className="shrink-0 border border-hairline bg-black/40 px-5 py-6">
              <div className="t-display text-[17px] text-white/70">No Characters Yet</div>
              <p className="mt-2 text-[12.5px] leading-snug text-white/40">
                Create your first character to get started in Los Santos.
              </p>
            </div>
          )}
        </div>

        {/* ---- delete confirmation ----
            Inline block rather than the old side panel, so the destructive path has the same
            flat-block language as everything else and sits right where the eye already is. */}
        {selected && confirmingDelete && (
          <div className="anim-fade shrink-0 border-l-[3px] border-danger bg-danger/15 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Icon name="alert" size={17} className="shrink-0 text-danger" />
              <span className="t-display text-[17px] text-white">Delete Character?</span>
            </div>
            <p className="mt-2 text-[12.5px] leading-snug text-white/60">
              <span className="text-white">
                {selected.firstname} {selected.lastname}
              </span>{" "}
              and everything they own will be gone for good. This can&apos;t be undone.
            </p>
            <div className="mt-3.5 flex items-center gap-2">
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
        )}

        {/* ---- action row ----
            The reference splits these to the two bottom corners of the screen; here they stay
            inside the left column, because the bottom-right of the frame is where the ped's
            legs are. Severity colour-coding and the flat hard-edged shape are kept exactly:
            muted for the neutral exit, red for destructive, teal for the primary confirm. */}
        {characters.length > 0 && !confirmingDelete && (
          <p className="shrink-0 text-[11.5px] leading-none text-white/30">
            Double-click a character to jump straight in.
          </p>
        )}

        <div className="flex shrink-0 items-center gap-2.5">
          <Button variant="ghost" icon="power" onClick={quit}>
            Leave
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
          <Button
            variant="primary"
            icon="play"
            disabled={!selected || busy}
            onClick={() => selected && play(selected.citizenid)}
            className="min-w-[160px]"
          >
            {busy ? "Loading..." : "Begin"}
          </Button>
        </div>
      </div>
    </ScreenFrame>
  );
}
