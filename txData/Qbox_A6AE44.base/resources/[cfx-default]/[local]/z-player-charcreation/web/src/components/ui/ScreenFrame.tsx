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
        <div className="anim-fade flex items-center gap-3">
          <span className="h-9 w-[3px] rounded-full bg-accent shadow-[0_0_14px_rgba(46,230,200,.85)]" />
          <div>
            <div className="t-display text-[22px] leading-none tracking-[0.34em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.9)]">
              Zerzura
            </div>
            <div className="t-eyebrow mt-1.5">Los Santos Roleplay</div>
          </div>
        </div>
        {chips && <div className="anim-fade flex items-center gap-2">{chips}</div>}
      </header>

      <div className="flex min-h-0 flex-1 items-center py-5">{children}</div>

      <footer className="flex items-end justify-between gap-6">
        {hints && hints.length > 0 ? (
          <div className="anim-fade flex flex-wrap items-center gap-x-5 gap-y-2">
            {hints.map((h) => (
              <div key={h.label} className="flex items-center gap-2 text-white/45">
                <Icon name={h.icon} size={15} className="text-accent/70" />
                <span className="t-label !text-[10.5px] !tracking-[0.16em] text-white/55">
                  {h.label}
                </span>
                <span className="rounded border border-white/15 bg-black/50 px-1.5 py-[1px] font-display text-[10px] uppercase tracking-[0.1em] text-white/70">
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
