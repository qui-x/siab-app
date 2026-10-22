"""Substitui os ícones e a tela de abertura padrão do Capacitor pelo ícone do SIAB.
Uso: python tools/gen_android_icons.py <pasta res do android> <icone.png>"""
import sys, glob, os
from PIL import Image, ImageDraw

res, icon_path = sys.argv[1], sys.argv[2]
icon = Image.open(icon_path).convert("RGBA")
BG = icon.getpixel((2, 2))[:3]          # cor de fundo do próprio ícone (#0c1520)

def square(size):
    return icon.resize((size, size), Image.LANCZOS)

def masked(size, shape):
    im = square(size)
    m = Image.new("L", (size * 4, size * 4), 0)
    d = ImageDraw.Draw(m)
    box = [0, 0, size * 4 - 1, size * 4 - 1]
    if shape == "circle":
        d.ellipse(box, fill=255)
    else:
        d.rounded_rectangle(box, radius=int(size * 4 * 0.22), fill=255)
    im.putalpha(m.resize((size, size), Image.LANCZOS))
    return im

n = 0
for path in glob.glob(os.path.join(res, "mipmap-*", "ic_launcher*.png")):
    size = Image.open(path).size[0]
    name = os.path.basename(path)
    if name == "ic_launcher_foreground.png":
        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        inner = int(size * 66 / 108)          # zona segura do ícone adaptativo
        out.paste(square(inner), ((size - inner) // 2,) * 2)
    elif name == "ic_launcher_round.png":
        out = masked(size, "circle")
    else:
        out = masked(size, "rounded")
    out.save(path); n += 1

for path in glob.glob(os.path.join(res, "drawable*", "splash.png")):
    w, h = Image.open(path).size
    out = Image.new("RGB", (w, h), BG)
    s = int(min(w, h) * 0.38)
    out.paste(square(s).convert("RGB"), ((w - s) // 2, (h - s) // 2))
    out.save(path); n += 1

hexbg = "#%02x%02x%02x" % BG
with open(os.path.join(res, "values", "ic_launcher_background.xml"), "w") as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
            f'    <color name="ic_launcher_background">{hexbg}</color>\n</resources>\n')
print(f"{n} imagens substituídas; fundo {hexbg}")
