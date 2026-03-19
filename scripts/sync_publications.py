#!/usr/bin/env python3
"""Sync publications.json bibtex fields from jmathys.bib and detect new entries."""

import json
import re
import sys
from pathlib import Path

import bibtexparser
from bibtexparser.bparser import BibTexParser
from bibtexparser.customization import convert_to_unicode

ROOT = Path(__file__).resolve().parent.parent
BIB_PATH = ROOT / "jmathys.bib"
JSON_PATH = ROOT / "data" / "publications.json"

MONTH_MAP = {
    "jan": "January", "feb": "February", "mar": "March", "apr": "April",
    "may": "May", "jun": "June", "jul": "July", "aug": "August",
    "sep": "September", "oct": "October", "nov": "November", "dec": "December",
}


def extract_raw_entries(bib_text):
    """Extract raw bibtex strings per entry key from the bib file text."""
    raw = {}
    # Split on @ that starts an entry, keeping the @
    parts = re.split(r'(?=^@)', bib_text, flags=re.MULTILINE)
    for part in parts:
        part = part.strip()
        if not part:
            continue
        # Extract the entry key
        m = re.match(r'@\w+\{([^,]+),', part)
        if m:
            key = m.group(1).strip()
            # Remove file field (contains local paths)
            cleaned = re.sub(r',?\s*file\s*=\s*\{[^}]*\}', '', part)
            # Remove urldate field
            cleaned = re.sub(r',?\s*urldate\s*=\s*\{[^}]*\}', '', cleaned)
            raw[key] = cleaned.strip()
    return raw


def clean_title(title):
    """Normalize a title for comparison: lowercase, strip braces/punctuation/special chars."""
    t = title.lower()
    t = re.sub(r'[^a-z0-9\s]', ' ', t)  # replace all non-alphanumeric with spaces
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def parse_authors(author_str):
    """Convert bibtex author string to list of 'First Last' names."""
    authors = []
    for part in author_str.split(' and '):
        part = part.strip()
        if ',' in part:
            last, first = part.split(',', 1)
            authors.append(f"{first.strip()} {last.strip()}")
        else:
            authors.append(part)
    return authors


def main():
    bib_text = BIB_PATH.read_text(encoding="utf-8")

    # Parse with bibtexparser for structured data
    parser = BibTexParser(common_strings=True)
    parser.customization = convert_to_unicode
    bib_db = bibtexparser.loads(bib_text, parser=parser)

    # Extract raw entry strings (for bibtex display)
    raw_entries = extract_raw_entries(bib_text)

    # Load existing publications.json
    with open(JSON_PATH, encoding="utf-8") as f:
        pub_data = json.load(f)
    publications = pub_data["publications"]

    # Build lookup of existing publications by cleaned title
    title_to_pub = {}
    for pub in publications:
        ct = clean_title(pub["title"])
        title_to_pub[ct] = pub

    matched = []
    new_entries = []

    for entry in bib_db.entries:
        key = entry.get("ID", "")
        bib_title = entry.get("title", "")
        ct = clean_title(bib_title)

        raw_bib = raw_entries.get(key, "")

        if ct in title_to_pub:
            # Match found — fill bibtex
            title_to_pub[ct]["bibtex"] = raw_bib
            matched.append((key, title_to_pub[ct]["title"]))
        else:
            # No match — create stub
            authors = parse_authors(entry.get("author", ""))
            year = int(entry.get("year", 0))
            month_raw = entry.get("month", "").strip().lower()
            month = MONTH_MAP.get(month_raw, month_raw.capitalize() if month_raw else "January")

            # Conference from booktitle
            booktitle = entry.get("booktitle", "")
            conference = re.sub(r'[{}]', '', booktitle) if booktitle else "preprint"

            # arxiv URL from eprint
            eprint = entry.get("eprint", "")
            arxiv = f"https://arxiv.org/abs/{eprint}" if eprint else None

            # Clean title for display
            display_title = re.sub(r'\{\{(.+?)\}\}', r'\1', bib_title)
            display_title = re.sub(r'[{}]', '', display_title)

            stub = {
                "id": key,
                "title": display_title,
                "authors": authors,
                "tldr": "",
                "conference": conference,
                "date": {"month": month, "year": year},
                "arxiv": arxiv,
                "bibtex": raw_bib,
                "image": None,
                "website": None,
                "selected": False,
            }
            new_entries.append(stub)
            print(f"  NEW: {key} — \"{display_title}\"")

    # Report matches
    print(f"\nMatched {len(matched)} entries:")
    for key, title in matched:
        print(f"  {key} -> \"{title}\"")

    if new_entries:
        print(f"\nCreated {len(new_entries)} new stub(s) (fill in tldr, image, conference):")
        for stub in new_entries:
            print(f"  {stub['id']} — \"{stub['title']}\"")
        publications.extend(new_entries)
    else:
        print("\nNo new entries found.")

    # Check for publications with no bibtex match
    unmatched = [p for p in publications if not p.get("bibtex")]
    if unmatched:
        print(f"\nWARNING: {len(unmatched)} publication(s) have no matching bib entry:")
        for p in unmatched:
            print(f"  {p['id']} — \"{p['title']}\"")

    # Write back
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(pub_data, f, indent=2, ensure_ascii=False)
    print(f"\nUpdated {JSON_PATH}")


if __name__ == "__main__":
    main()
