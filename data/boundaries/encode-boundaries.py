"""Packs the boundary GeoJSON in this folder into the compact files the map loads.

Each ring becomes one string in Google's polyline encoding: coordinates rounded to four decimals
(about 11 metres, as in the source), stored as deltas from the previous point. The points are the
same as the source's; the files are about a fifth of the size. Writes src/lib/data/*.poly.json, decoded by src/lib/components/charts/geo.js.

bengaluru-ac.json is the 28 Bengaluru seats at full detail, for the map's magnified lens, cut from
KGIS's AC_Boundary shapefile (kgis.ksrsac.in/kgis/downloads.aspx) with mapshaper:

  mapshaper -i AC_Boundary.shp -filter 'Number(AC_CODE) >= 150 && Number(AC_CODE) <= 177' -proj wgs84 \
    -simplify interval=35 keep-shapes -clean -each 'ac = Number(AC_CODE), name = AC_NAME' \
    -filter-fields ac,name -o format=geojson precision=0.0001 bengaluru-ac.json

35 metres is under a pixel at the lens's largest zoom; mapshaper keeps the borders seats share.
Its rings come out counter-clockwise (RFC 7946); each was then reversed to the clockwise order d3
expects, as in the other two files.

usage: python3 data/boundaries/encode-boundaries.py
"""
import json
from pathlib import Path

HERE = Path(__file__).parent


def enc(v):
    v = ~(v << 1) if v < 0 else (v << 1)
    out = ''
    while v >= 0x20:
        out += chr((0x20 | (v & 0x1F)) + 63)
        v >>= 5
    return out + chr(v + 63)


def ring(coords):
    s, px, py = '', 0, 0
    for x, y in coords:
        X, Y = round(x * 1e4), round(y * 1e4)
        s += enc(X - px) + enc(Y - py)
        px, py = X, Y
    return s


for name in ['karnataka-ac', 'karnataka-state', 'bengaluru-ac']:
    src = json.loads((HERE / f'{name}.json').read_text())
    out = []
    for f in src['features']:
        g = f['geometry']
        multi = g['type'] == 'MultiPolygon'
        polys = g['coordinates'] if multi else [g['coordinates']]
        out.append({'p': f['properties'], 'm': multi, 'g': [[ring(r) for r in poly] for poly in polys]})
    (HERE.parent.parent / 'src/lib/data' / f'{name}.poly.json').write_text(json.dumps(out, separators=(',', ':')))
    print(name, len(out), 'features')
