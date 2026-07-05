from pypdf import PdfReader


reader = PdfReader("output/documents/BaoCao_TLCN_CaoHienStudio.pdf")
print("pages", len(reader.pages))

markers = [
    "PHẦN 1",
    "PHẦN 2",
    "CHƯƠNG 1",
    "CHƯƠNG 2",
    "CHƯƠNG 3",
    "CHƯƠNG 4",
    "PHẦN 3",
    "TÀI LIỆU THAM KHẢO",
    "MỤC LỤC",
    "DANH MỤC HÌNH",
    "DANH MỤC BẢNG",
]

for i, page in enumerate(reader.pages, start=1):
    text = (page.extract_text() or "").replace("\n", " | ")
    hits = [m for m in markers if m in text]
    if hits:
        print(i, hits, text[:350])
