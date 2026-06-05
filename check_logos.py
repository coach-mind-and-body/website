import struct
import shutil
import os

def get_image_size(fname):
    with open(fname, 'rb') as f:
        head = f.read(24)
        if len(head) != 24: return None
        if head[:8] == b'\x89PNG\r\n\x1a\n':
            check = struct.unpack('>i', head[4:8])[0]
            if check != 0x0d0a1a0a: return None
            width, height = struct.unpack('>ii', head[16:24])
            return width, height
    return None

f1 = r"C:\Users\carte\Downloads\ChatGPT Image May 21, 2026, 11_32_56 AM.png"
f2 = r"C:\Users\carte\Downloads\ChatGPT Image May 21, 2026, 11_31_55 AM.png"

s1 = get_image_size(f1)
s2 = get_image_size(f2)

print(f"{f1}: {s1}")
print(f"{f2}: {s2}")

if s1 and s2:
    w1, h1 = s1
    w2, h2 = s2
    
    # The circular one is likely square (width == height) or close to it
    if w1 == h1 or abs(w1/h1 - 1.0) < abs(w2/h2 - 1.0):
        print(f"Circular: {f1}")
        shutil.copy(f1, r"c:\Users\carte\Downloads\mind-body-reset-portal\client\public\logo-circular.png")
        print(f"Wide: {f2}")
        shutil.copy(f2, r"c:\Users\carte\Downloads\mind-body-reset-portal\client\public\logo-wide.png")
    else:
        print(f"Circular: {f2}")
        shutil.copy(f2, r"c:\Users\carte\Downloads\mind-body-reset-portal\client\public\logo-circular.png")
        print(f"Wide: {f1}")
        shutil.copy(f1, r"c:\Users\carte\Downloads\mind-body-reset-portal\client\public\logo-wide.png")
