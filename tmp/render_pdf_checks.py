from pathlib import Path

import pypdfium2 as pdfium


pdf_path = Path("output/documents/BaoCao_TLCN_CaoHienStudio.pdf")
out_dir = Path("output/documents/pdf_checks")
out_dir.mkdir(parents=True, exist_ok=True)

pdf = pdfium.PdfDocument(str(pdf_path))
page_count = len(pdf)
print("pages", page_count)

selected = sorted(
    set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 18, 22, 28, 34, 40, 46, 52, page_count - 1])
)

for index in selected:
    if 0 <= index < page_count:
        page = pdf[index]
        image = page.render(scale=1.6).to_pil()
        path = out_dir / f"page_{index + 1:03d}.png"
        image.save(path)
        print(path)
