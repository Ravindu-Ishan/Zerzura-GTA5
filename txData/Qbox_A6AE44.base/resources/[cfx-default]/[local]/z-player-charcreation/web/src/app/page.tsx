"use client";

import { useEffect, useRef, useState } from "react";
import { useNuiEvent } from "@/lib/nui";
import SelectScreen, { CharacterSummary } from "@/components/SelectScreen";
import CreationFlow from "@/components/CreationFlow";

type Mode = "select" | "creating";

interface InitPayload {
  characters: CharacterSummary[];
  maxSlots: number;
}

// So the screen is visible/testable in a plain browser during `next dev`.
const MOCK_INIT: InitPayload = {
  maxSlots: 3,
  characters: [
    { citizenid: "ABC12345", firstname: "Jane", lastname: "Doe", gender: "Female" },
  ],
};

export default function Page() {
  const [visible, setVisible] = useState(true);
  const [mode, setMode] = useState<Mode>("select");
  const [characters, setCharacters] = useState<CharacterSummary[]>(MOCK_INIT.characters);
  const [maxSlots, setMaxSlots] = useState(MOCK_INIT.maxSlots);

  // Ambient background audio, same track as z-ui-loadingscreen (web/public/audio/theme.mp3 -
  // a separate copy, since each FiveM resource is its own sandboxed bundle with no shared
  // asset store). Owned here rather than inside either screen so it keeps playing across a
  // Details <-> Select mode switch instead of restarting, and stops the instant the NUI is
  // actually hidden (closeUiAndSpawn on the Lua side) rather than continuing under gameplay.
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!visible) return;
    // Autoplay works unmuted inside FiveM's CEF (confirmed via z-ui-loadingscreen); still
    // caught here rather than left to throw, since `next dev` in a plain browser tab may
    // block it until the user interacts with the page at all.
    audioRef.current?.play().catch(() => {});
  }, [visible]);

  const toggleMuted = () => setMuted((m) => !m);

  useNuiEvent<InitPayload>("init", (payload) => {
    setCharacters(payload.characters);
    setMaxSlots(payload.maxSlots);
    setMode("select");
    setVisible(true);
  });

  useNuiEvent("openCreation", () => {
    setMode("creating");
    setVisible(true);
  });

  useNuiEvent<{ visible: boolean }>("setVisible", (payload) => {
    setVisible(payload.visible);
  });

  return (
    <>
      <audio ref={audioRef} src="audio/theme.mp3" loop muted={muted} className="hidden" />
      {!visible ? null : (
        // Each screen brings its own ScreenFrame (wordmark, status chips, control hints) so it
        // can set chrome that actually describes that screen. Nothing here paints a background -
        // the live game world has to stay visible behind everything.
        <main className="h-full w-full overflow-hidden">
          {mode === "select" ? (
            <SelectScreen
              characters={characters}
              maxSlots={maxSlots}
              muted={muted}
              onToggleMuted={toggleMuted}
            />
          ) : (
            <CreationFlow muted={muted} onToggleMuted={toggleMuted} />
          )}
        </main>
      )}
    </>
  );
}
