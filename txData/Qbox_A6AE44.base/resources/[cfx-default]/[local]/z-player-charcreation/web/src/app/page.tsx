"use client";

import { useState } from "react";
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

  if (!visible) return null;

  // Each screen brings its own ScreenFrame (wordmark, status chips, control hints) so it can
  // set chrome that actually describes that screen. Nothing here paints a background - the
  // live game world has to stay visible behind everything.
  return (
    <main className="h-full w-full overflow-hidden">
      {mode === "select" ? (
        <SelectScreen characters={characters} maxSlots={maxSlots} />
      ) : (
        <CreationFlow />
      )}
    </main>
  );
}
