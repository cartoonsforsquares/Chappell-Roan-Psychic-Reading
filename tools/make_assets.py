"""Turn Assets/ (plus the lace card from Photos/) into trimmed WebPs + a layout manifest.

Run from the Chappell Roan_Fortune folder:  /usr/bin/python3 tools/make_assets.py

Layout is set in "reference" coordinates: the 1872x1872 layout picture (Chappell over the
orb, table, lace card underneath). Each piece gets a scale and the spot where the top-left of
its trimmed image lands, so the game can place everything exactly like the reference.
"""
from PIL import Image
import json, os, sys

OUT = 'img'
S = 0.4                      # export scale (of the original art)
os.makedirs(OUT, exist_ok=True)
man = {'export': S, 'pieces': {}}

# piece: (file, scale into reference, (tx, ty) where the original's (0,0) lands in reference)
PIECES = {
    'body':      ('Assets/Character/Chappell_Roan_Main.png', 0.4504, (260, 46)),
    'glowY':     ('Assets/Background/Crystal Glow_Yellow.png', 0.215, None),
    'glowP':     ('Assets/Background/Crystal Glow_Pink.png', 0.215, None),
    'table':     ('Assets/Background/Table.png', 0.324, (497, 828)),
    'orb':       ('Assets/Background/Crystal Ball.png', 0.1864, (680, 423)),
    'handTop':   ('Assets/Character/Right Hand.png', 0.305, (901, 390)),
    'handLow':   ('Assets/Character/Left Hand.png', 0.2864, (482, 726)),
}
ORB_C = (978, 720)


def save(img, name, q=88):
    img.save(f'{OUT}/{name}.webp', 'WEBP', quality=q, method=6)
    print(name, img.size)


ref_pieces = {}
for name, (f, s, t) in PIECES.items():
    im = Image.open(f).convert('RGBA')
    bb = im.getbbox()
    if t is None:            # glows: centre them on the orb
        cx, cy = 1600, 1590
        t = (ORB_C[0] - cx * s, ORB_C[1] - cy * s)
    c = im.crop(bb)
    save(c.resize((round(c.width * S), round(c.height * S)), Image.LANCZOS), name)
    man['pieces'][name] = {'x': round(t[0] + bb[0] * s, 1), 'y': round(t[1] + bb[1] * s, 1),
                           'w': round(c.width * s, 1), 'h': round(c.height * s, 1)}
    ref_pieces[name] = (c, s, man['pieces'][name])

# body: where her eyes are (reference coords) so the game knows how far to sink her
man['eyesY'] = round(46 + 600 * 0.4504, 1)
man['orb'] = {'cx': ORB_C[0], 'cy': ORB_C[1], 'r': round(1748 / 2 * 0.1864, 1)}

# lace card: key out the dark backdrop (the lace holes go see-through too)
lp = Image.open('Photos/Lace Paper.png').convert('RGBA')
px = lp.load()
for y in range(lp.height):
    for x in range(lp.width):
        r, g, b, a = px[x, y]
        lum = (r + g + b) / 3
        if lum < 70:
            px[x, y] = (r, g, b, 0)
        elif lum < 120:
            px[x, y] = (r, g, b, int(255 * (lum - 70) / 50))
bb = lp.getbbox(); card = lp.crop(bb).transpose(Image.ROTATE_90)
cs = 985 / card.width
save(card.resize((round(card.width * S * 0.75), round(card.height * S * 0.75)), Image.LANCZOS), 'card')
man['pieces']['card'] = {'x': 480, 'y': 1120, 'w': 985, 'h': round(card.height * cs, 1)}
ref_pieces['card'] = (card, cs, man['pieces']['card'])

# lace curtain strip + background
lace = Image.open('Assets/Background/Lace.png').convert('RGBA')
lace = lace.crop(lace.getbbox())
save(lace.resize((round(lace.width * 0.3), round(lace.height * 0.3)), Image.LANCZOS), 'lace')
man['lace'] = {'aspect': round(lace.height / lace.width, 3)}
bg = Image.open('Assets/Background/Background_Pink.png').convert('RGB')
save(bg.resize((1920, 1080), Image.LANCZOS), 'background', 80)

with open(f'{OUT}/manifest.json', 'w') as fh:
    json.dump(man, fh, indent=1)
print(json.dumps(man, indent=1))

# check picture: our layout next to the reference
if len(sys.argv) > 1:
    chk = Image.new('RGBA', (1872, 1872), (40, 12, 34, 255))
    for name in ['body', 'table', 'glowY', 'orb', 'handLow', 'handTop', 'card']:
        c, s, p = ref_pieces[name]
        chk.alpha_composite(c.resize((round(p['w']), round(p['h']))), (round(p['x']), round(p['y'])))
    ref = Image.open(sys.argv[1]).convert('RGBA').resize((1872, 1872))
    both = Image.new('RGB', (1872 * 2, 1872)); both.paste(chk.convert('RGB'), (0, 0)); both.paste(ref.convert('RGB'), (1872, 0))
    both.thumbnail((1600, 800)); both.save(sys.argv[2])
