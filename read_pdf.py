#!/usr/bin/env python3
import sys

try:
    import PyPDF2
except ImportError:
    print("Installing PyPDF2...")
    import subprocess
    subprocess.run([sys.executable, '-m', 'pip', 'install', 'PyPDF2'], check=True)
    import PyPDF2

def read_pdf(filename):
    try:
        with open(filename, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ''
            print(f"PDF has {len(reader.pages)} pages")
            
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text()
                text += f"\n--- Page {i+1} ---\n{page_text}\n"
            
            return text
    except Exception as e:
        return f"Error reading PDF: {e}"

if __name__ == "__main__":
    pdf_path = "Docs/Advanced ChatGPT Prompt Engineering_Mindstream x HubSpot.pdf"
    content = read_pdf(pdf_path)
    print(content) 