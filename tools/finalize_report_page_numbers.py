import re
import sys
import unicodedata
from pathlib import Path

import pdfplumber
from docx import Document

from update_booking_report_docx import (
    OUTPUT_DOCX,
    collect_body_captions,
    rebuild_static_lists,
)


PDF_PATH = Path(r"D:\22110097_HoVuAnh\TLCN_KLTN\TLCN\caohienstudio\output\documents\CNPM_CLC_Nhom05_BaoCaoTLCN_DaSua_Booking.pdf")
FRONT_MATTER_LAST_PAGE = 14


def normalize(text):
    text = unicodedata.normalize("NFC", text or "")
    text = text.replace("\u00a0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()


def map_pages(captions):
    page_texts = []
    with pdfplumber.open(PDF_PATH) as pdf:
        for page_no, page in enumerate(pdf.pages, start=1):
            if page_no <= FRONT_MATTER_LAST_PAGE:
                continue
            page_texts.append((page_no, normalize(page.extract_text() or "")))

    result = {}
    missing = []
    for caption in captions:
        needle = normalize(caption)
        found = None
        for page_no, text in page_texts:
            if needle in text:
                found = page_no
                break
        if found is None:
            missing.append(caption)
        else:
            result[caption] = found
    return result, missing


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    doc = Document(OUTPUT_DOCX)
    figure_captions, table_captions = collect_body_captions(doc)

    figure_pages, missing_figures = map_pages(figure_captions)
    table_pages, missing_tables = map_pages(table_captions)

    rebuild_static_lists(doc, figure_captions, table_captions, figure_pages, table_pages)
    doc.save(OUTPUT_DOCX)

    print(f"Updated: {OUTPUT_DOCX}")
    print(f"Figure pages mapped: {len(figure_pages)}/{len(figure_captions)}")
    print(f"Table pages mapped: {len(table_pages)}/{len(table_captions)}")
    if missing_figures:
        print("Missing figures:")
        for item in missing_figures:
            print(f"- {item}")
    if missing_tables:
        print("Missing tables:")
        for item in missing_tables:
            print(f"- {item}")


if __name__ == "__main__":
    main()
