import type { Metadata } from "next";
import { Oswald, Barlow } from "next/font/google";
import "./globals.css";

/* next/font resolves these at BUILD time and emits real .woff2 files into the static
   export (out/_next/static/media/*.woff2), referenced from the bundled CSS by a plain
   relative url(../media/...). So the shipped page never touches the network at runtime,
   which matters because the game client has no internet guarantee.

   Do NOT replace this with a <link href="fonts.googleapis.com"> - that would be a runtime
   fetch and would silently fall back to a system font in-game. */

/* Oswald: bold condensed grotesque - the header/label voice. Close in spirit to GTA's own
   condensed UI type without being a vanilla GTA Online reskin. */
const display = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-face",
  display: "swap",
});

/* Barlow: slightly narrow humanist grotesque - reads cleanly at 12-14px for values,
   names and body copy, and sits naturally next to Oswald. */
const sans = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-face",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZERZURA - Character Creation",
  description: "Custom character selection and creation UI",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full ${display.variable} ${sans.variable}`}>
      {/* Transparent by default - this NUI page is overlaid on top of the live game world,
          only the elements we render should ever paint anything. */}
      <body className="h-full bg-transparent text-fg antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
