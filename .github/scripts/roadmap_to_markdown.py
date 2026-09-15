#!/usr/bin/env python3
"""Converts ledger-build-checklist.html into a GitHub-wiki-friendly Markdown page.

Why this exists instead of a generic converter: pandoc (and every other HTML->Markdown
tool tried) does not recognise a checkbox as a GFM task-list item unless it's already
sitting in pandoc's own internal task-list AST node - a real <input type=checkbox> inside
an <li>, or a bare <div>, is silently dropped, checked state and all (verified locally
before writing this: `pandoc -f html+task_lists` still drops it). Since the whole point of
the checklist is showing done/not-done, a converter that drops that is worse than useless.

This script knows the checklist's exact structure (one <div class="item"> per line, one
<section id="pN"> per phase) because that HTML is hand-authored to match it. It is
intentionally NOT a general HTML parser - if the checklist's markup shape changes, this
needs a matching update, same as any other tightly-coupled generator/consumer pair.
"""
import html
import re
import sys

TITLE_RE = re.compile(r"<title>(.*?)</title>")
INTRO_RE = re.compile(r'<div class="masthead-left">.*?<p>(.*?)</p>', re.DOTALL)
PROGRESS_NOTE_RE = re.compile(r'<div class="note">(.*?)</div>')
PROGRESS_PCT_RE = re.compile(r'<div class="pct">(.*?)</div>')
CALLOUT_RE = re.compile(r'<div class="callout">(.*?)<div class="layout">', re.DOTALL)
CALLOUT_LABEL_RE = re.compile(r'<div class="label">(.*?)</div>')
CALLOUT_P_RE = re.compile(r"<p>(.*?)</p>", re.DOTALL)
SECTION_RE = re.compile(r'<section id="(p\d+)">(.*?)</section>', re.DOTALL)
NUM_H2_RE = re.compile(r'<span class="num">(\d+)</span><h2>(.*?)</h2>')
DEK_RE = re.compile(r'<p class="dek">(.*?)</p>')
ITEM_RE = re.compile(
    r'<div class="item( done)?">'
    r'<input type="checkbox" class="mark"(?: disabled)?( checked)?>'
    r"<div><div class=\"title-row\"><span class=\"title\">(.*?)</span>"
    r'<span class="tag[^"]*">(.*?)</span></div><p>(.*?)</p></div></div>'
)
SUBNOTE_RE = re.compile(r'<div class="subnote">\s*(.*?)\s*</div>', re.DOTALL)
FOOTER_RE = re.compile(r"<footer>(.*?)</footer>", re.DOTALL)


def clean_inline(text: str) -> str:
    """Strips the small set of inline tags this file actually uses, converts to Markdown."""
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r'<span class="mono">(.*?)</span>', r"`\1`", text)
    text = re.sub(r"<b>(.*?)</b>", r"**\1**", text)
    text = re.sub(r"<[^>]+>", "", text)  # anything else left (e.g. stray spans)
    text = html.unescape(text)
    return text.strip()


def convert(src: str) -> str:
    title = clean_inline(TITLE_RE.search(src).group(1))
    intro = clean_inline(INTRO_RE.search(src).group(1))
    overall_note = clean_inline(PROGRESS_NOTE_RE.search(src).group(1))
    overall_pct = clean_inline(PROGRESS_PCT_RE.search(src).group(1))

    callout_block = CALLOUT_RE.search(src).group(1)
    callout_label = clean_inline(CALLOUT_LABEL_RE.search(callout_block).group(1))
    callout_paras = [clean_inline(p) for p in CALLOUT_P_RE.findall(callout_block)]

    out = [f"# {title}", ""]
    out.append(f"{intro}")
    out.append("")
    out.append(f"**Overall progress: {overall_note} ({overall_pct})**")
    out.append("")
    out.append(f"> **{callout_label}**")
    for p in callout_paras:
        out.append(f">")
        out.append(f"> {p}")
    out.append("")
    out.append("---")
    out.append("")

    for sec_match in SECTION_RE.finditer(src):
        body = sec_match.group(2)
        num, h2 = NUM_H2_RE.search(body).groups()
        h2 = clean_inline(h2)
        dek = clean_inline(DEK_RE.search(body).group(1))

        out.append(f"## {num} — {h2}")
        out.append("")
        out.append(dek)
        out.append("")

        for item_match in ITEM_RE.finditer(body):
            done_class, checked_attr, item_title, tag, desc = item_match.groups()
            box = "[x]" if (done_class or checked_attr) else "[ ]"
            item_title = clean_inline(item_title)
            tag = clean_inline(tag)
            desc = clean_inline(desc)
            tag_suffix = f" *({tag})*" if tag and tag.lower() not in ("done",) else ""
            out.append(f"- {box} **{item_title}**{tag_suffix} — {desc}")
        out.append("")

        subnote_match = SUBNOTE_RE.search(body)
        if subnote_match:
            subnote_text = clean_inline(subnote_match.group(1))
            out.append(f"> {subnote_text}")
            out.append("")

    footer = FOOTER_RE.search(src).group(1)
    footer = re.sub(
        r'<a href="([^"]+)"[^>]*>(.*?)</a>', r"[\2](\1)", footer
    )
    out.append("---")
    out.append("")
    out.append(clean_inline(footer))
    out.append("")

    return "\n".join(out)


if __name__ == "__main__":
    src_path = sys.argv[1] if len(sys.argv) > 1 else "ledger-build-checklist.html"
    dst_path = sys.argv[2] if len(sys.argv) > 2 else "Roadmap.md"
    with open(src_path, "r", encoding="utf-8") as f:
        source = f.read()
    markdown = convert(source)
    with open(dst_path, "w", encoding="utf-8") as f:
        f.write(markdown)
    print(f"Wrote {dst_path} ({len(markdown)} bytes)")
