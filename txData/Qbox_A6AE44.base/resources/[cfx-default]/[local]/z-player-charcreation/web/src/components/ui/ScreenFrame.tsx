"use client";

import { ReactNode } from "react";
import Icon, { IconName } from "./Icon";

/**
 * The persistent screen furniture that sits *around* the panel: wordmark top-left,
 * status chips top-right, camera hints bottom-left.
 *
 * Nothing in here paints a full-screen fill - the page is composited over the live
 * game world and the ped has to stay visible. Everything is either text, a small
 * translucent chip, or the panel itself.
 *
 * The children slot is aligned to the LEFT (items-start on the cross axis is handled by
 * each screen's own panel width). The 3D ped preview is framed deliberately into the RIGHT
 * of the screen by client/main.lua's aimPointFor + Config.PreviewCamera.screenShift, so
 * nothing in here may grow to fill the frame or the character ends up behind the UI.
 */

export interface Hint {
  icon: IconName;
  label: string;
  keys: string;
}

interface ScreenFrameProps {
  chips?: ReactNode;
  hints?: Hint[];
  children: ReactNode;
}

export default function ScreenFrame({ chips, hints, children }: ScreenFrameProps) {
  return (
    <div className="relative flex h-full w-full flex-col justify-between p-6 xl:p-9">
      <header className="flex items-start justify-between gap-6">
        {/* Flat accent slab + tight wordmark. The old version was a glowing rounded pill next
            to 0.34em-tracked text with a drop-shadow - three separate web-app tells. */}
        <div className="anim-fade flex items-stretch gap-3">
          <span className="w-[4px] shrink-0 bg-accent" />
          <div className="py-[2px]">
            <div className="t-display text-[24px] leading-none tracking-[0.12em] text-white">
              Zerzura
            </div>
            <div className="t-eyebrow mt-1.5">Los Santos Roleplay</div>
          </div>
        </div>
        {chips && <div className="anim-fade flex items-center gap-2">{chips}</div>}
      </header>

      {/* items-stretch, so a screen that wants the full height between the wordmark and the
          footer can just say h-full. Screens that would rather stay their natural size and sit
          centred opt out per-screen with `self-center` (SelectScreen does). */}
      <div className="flex min-h-0 flex-1 items-stretch py-5">{children}</div>

      <footer className="flex items-end justify-between gap-6">
        {hints && hints.length > 0 ? (
          <div className="anim-fade flex flex-wrap items-center gap-x-5 gap-y-2">
            {hints.map((h) => (
              <div key={h.label} className="flex items-center gap-2 text-white/45">
                <Icon name={h.icon} size={15} className="text-accent/70" />
                <span className="t-label !text-[11px] text-white/55">{h.label}</span>
                <span className="border border-white/15 bg-black/55 px-1.5 py-[1px] font-display text-[11px] font-semibold uppercase tracking-[0.04em] text-white/75">
                  {h.keys}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span />
        )}
      </footer>
    </div>
  );
}
