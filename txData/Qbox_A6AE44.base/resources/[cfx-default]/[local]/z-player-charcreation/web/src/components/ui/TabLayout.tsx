"use client";

import { ReactNode } from "react";
import Icon, { IconName } from "./Icon";

/**
 * Shared inner chrome for the creation tabs: a left category rail (bold header +
 * icon-labelled rows) and a right detail pane.
 *
 * Every slider-heavy tab uses this, so the eye always lands in the same two places -
 * pick a group on the left, tune it on the right - instead of scrolling one long
 * undifferentiated list of 20+ sliders.
 */

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  /** Small right-aligned counter, e.g. number of active overlays in that group. */
  badge?: number;
  /** Accent dot, for "this group has been changed from default". */
  dot?: boolean;
}

interface SectionNavProps {
  header: string;
  items: NavItem[];
  active: string;
  onSelect: (id: string) => void;
}

export function SectionNav({ header, items, active, onSelect }: SectionNavProps) {
  return (
    <nav className="well flex min-h-0 flex-col p-2">
      <div className="t-eyebrow px-2 pt-1.5 pb-2.5">{header}</div>
      <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-[3px] overflow-y-auto pr-0.5">
        {items.map((item) => (
          <button
            key={item.id}
            className="navrow"
            data-active={active === item.id}
            onClick={() => onSelect(item.id)}
          >
            <Icon name={item.icon} size={15} />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="t-num rounded bg-accent/15 px-1.5 py-[1px] text-[10px] font-semibold text-accent">
                {item.badge}
              </span>
            )}
            {item.dot && item.badge === undefined && (
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(46,230,200,.9)]" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

interface TabLayoutProps {
  nav?: ReactNode;
  title: string;
  description?: string;
  /** Right-aligned content in the pane header - counters, per-group actions. */
  action?: ReactNode;
  /** Rendered directly under the pane header, outside the scroll area (search fields). */
  sticky?: ReactNode;
  children: ReactNode;
}

export default function TabLayout({
  nav,
  title,
  description,
  action,
  sticky,
  children,
}: TabLayoutProps) {
  return (
    <div
      className="grid min-h-0 flex-1 gap-4"
      style={{ gridTemplateColumns: nav ? "204px minmax(0,1fr)" : "minmax(0,1fr)" }}
    >
      {nav}
      <section className="flex min-h-0 flex-col">
        <div className="flex items-start justify-between gap-4 pb-3">
          <div className="min-w-0">
            <h3 className="t-display text-[17px] text-white">{title}</h3>
            {description && (
              <p className="mt-1 text-[12.5px] leading-snug text-white/45">{description}</p>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
        {sticky}
        <div key={title} className="anim-fade scroll-thin min-h-0 flex-1 overflow-y-auto pr-2">
          {children}
        </div>
      </section>
    </div>
  );
}
