"""Run on ssh z370 only: inspect source-map registration without modifying DEM.
Usage: venv/bin/python event-map-registration-20260913.py <repo>
"""
import json, sys, hashlib
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from pyproj import Transformer

repo = Path(sys.argv[1])
data = json.loads((repo / 'public/data/site-features.json').read_text())
out = repo / 'docs/evidence'
transform = Transformer.from_crs(4326, 26915, always_xy=True)
def pixel(lat, lon):
    e,n = transform.transform(lon,lat)
    return [e-726300,4212510-n]

# Three climbing-map point-symbol centres paired with independently published MP pins.
# These are crowd-contributed pins, NOT survey ground control.
fit = [
    {'id':'beaver','mapPixel':[523,219],'lat':38.0238,'lon':-90.41195,
     'url':'https://www.mountainproject.com/area/125747984/beaver-boulders'},
    {'id':'harmony','mapPixel':[821,80],'lat':38.02691,'lon':-90.40461,
     'url':'https://www.mountainproject.com/area/125747076/harmony-creek-boulders'},
    {'id':'stage-right','mapPixel':[778,339],'lat':38.02206,'lon':-90.40534,
     'url':'https://www.mountainproject.com/area/125747997/stage-right-boulders'},
]
for p in fit: p['naipPixelFromPublishedPin'] = pixel(p['lat'],p['lon'])
a = np.array([p['mapPixel']+[1] for p in fit])
b = np.array([p['naipPixelFromPublishedPin'] for p in fit])
m = np.linalg.solve(a,b)
checks = [
    {'id':'old-blue-published-pin','mapPixel':[797,181], 'naipPixel':pixel(38.02511,-90.40509),
     'source':'https://www.mountainproject.com/area/125747087/old-blue-boulder', 'use':'withheld source-map consistency; not surveyed'},
    {'id':'stage-roof-centre','mapPixel':[672,323],'naipPixel':[1181,1120],
     'source':'NAIP 2022 visible roof centre independently selected', 'use':'withheld map-icon versus visible-building check'},
    {'id':'north-house-roof','mapPixel':[559,200],'naipPixel':[967,904],
     'source':'NAIP 2022 visible roof centre independently selected', 'use':'withheld map-icon versus visible-building check; identity approximate'},
]
for p in checks:
    q = np.array(p['mapPixel']+[1]) @ m
    p['predictedNaipPixel'] = q.tolist()
    p['residualM'] = float(np.linalg.norm(q-np.array(p['naipPixel'])))
evidence = {'runHost':'ssh z370','runId':'site-registration-20260913-v1',
 'crs':'EPSG:26915','naipPixelTransform':data['pixelTransform'],
 'climbingMapDimensions':[1022,771], 'fitControls':fit,'affineMatrix':m.tolist(),'withheldChecks':checks,
 'decision':'Reject direct global map-icon georeferencing for precise POIs. Place visible roofs and clearing boundaries from georeferenced NAIP; use event-map topology only for names and broad use areas.',
 'limits':'Source-pin/map-symbol consistency is not absolute surveyed accuracy. Per-feature allowances are judgemental planning bounds, not statistical accuracy. Sentinel 10 m acquisitions support broad clearing correspondence only.',
 'terrainSha256':hashlib.sha256((repo/'public/data/terrain.json').read_bytes()).hexdigest(),
 'pointGeographicCoordinates':[{**p,'latLon':list(Transformer.from_crs(26915,4326,always_xy=False).transform(726300+p['pixel'][0],4212510-p['pixel'][1]))} for p in data['points']]}
(out/'event-map-registration-20260913.json').write_text(json.dumps(evidence,indent=2)+'\n')

# Same EPSG:26915 crop in three distinct acquisitions; do not warp any source to match drawings.
crop=(800,400,1900,1200); panel=(550,400)
sheet=Image.new('RGB',(1650,460),'#151b20'); draw=ImageDraw.Draw(sheet)
for index,(name,scale,label) in enumerate([
 ('naip-20220618.jpg',1,'NAIP aerial 2022-06-18 / 0.6m native'),
 ('sentinel-20240613.jpg',5,'Sentinel-2 2024-06-13 / 10m native'),
 ('sentinel-20241110.jpg',5,'Sentinel-2 2024-11-10 / 10m native')]):
    im=Image.open(repo/'public/imagery'/name)
    im=im.crop(tuple(v/scale for v in crop)).resize(panel,Image.Resampling.NEAREST)
    d=ImageDraw.Draw(im)
    def xy(p):return ((p[0]-crop[0])*.5,(p[1]-crop[1])*.5)
    for area in data['targetAreas']:
        points=[xy(p) for p in area['pixels']]
        d.line(points+[points[0]],fill='#ffe15b',width=1)
    for p in data['points']:
        x,y=xy(p['pixel'])
        if 0<=x<550 and 0<=y<400:
            d.ellipse((x-3,y-3,x+3,y+3),fill='#ff6778')
            d.text((x+5,y-4),p['id'],fill='white',stroke_width=1,stroke_fill='black')
    sheet.paste(im,(550*index,30));draw.text((550*index+8,8),label,fill='white')
draw.text((10,440),'Yellow: inferred event-use areas. Red: estimated POIs. Same metric frame; no DEM edits. Not surveyed.',fill='white')
sheet.save(out/'event-map-registration-20260913.jpg',quality=90)
print(json.dumps({'runHost':'ssh z370','runId':evidence['runId'],'checks':checks},indent=2))
