import docx2txt
import os
import shutil

os.makedirs('images', exist_ok=True)

files = [
    r"C:\Users\carte\Downloads\Reset 6-Week “Mind & Body Reset” .docx",
    r"C:\Users\carte\Downloads\_Reclaim Your Body 6 week.docx",
    r"C:\Users\carte\Downloads\It’s not because your weak.docx"
]

for f in files:
    try:
        docx2txt.process(f, 'images')
    except:
        pass

print(os.listdir('images'))
