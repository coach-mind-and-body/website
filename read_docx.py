import sys
import zipfile
import xml.etree.ElementTree as ET

# Ensure stdout uses utf-8
sys.stdout.reconfigure(encoding='utf-8')

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.XML(xml_content)
            namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            paragraphs = []
            for paragraph in tree.iterfind('.//w:p', namespace):
                texts = [node.text for node in paragraph.iterfind('.//w:t', namespace) if node.text]
                if texts:
                    paragraphs.append(''.join(texts))
            return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error reading {docx_path}: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        for file_path in sys.argv[1:]:
            print(f"--- CONTENT OF {file_path} ---")
            print(extract_text_from_docx(file_path))
            print("\n")
