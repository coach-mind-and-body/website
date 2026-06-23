import docx2txt
import json

files = [
    r"C:\Users\carte\Downloads\Reset 6-Week “Mind & Body Reset” .docx",
    r"C:\Users\carte\Downloads\_Reclaim Your Body 6 week.docx",
    r"C:\Users\carte\Downloads\It’s not because your weak.docx"
]

res = []
for f in files:
    try:
        text = docx2txt.process(f)
        res.append({"file": f, "text": text})
    except Exception as e:
        res.append({"file": f, "error": str(e)})

with open("docs_out.json", "w", encoding="utf-8") as out:
    json.dump(res, out, ensure_ascii=False, indent=2)

print("Done")
