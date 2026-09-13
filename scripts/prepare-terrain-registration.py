"""Remote image-content diagnostic; does not estimate surveyed positional accuracy."""
import json,numpy as np
from PIL import Image,ImageDraw
from pathlib import Path
root=Path('output/imagery');ids=['naip-20220618','sentinel-20240613','sentinel-20241110']
images=[Image.open(root/(s+'.jpg')).resize((204,206),Image.Resampling.BOX) for s in ids]
def edge(im):
 a=np.asarray(im,dtype=float).mean(axis=2);dy,dx=np.gradient(a);return np.hypot(dx,dy)
edges=[edge(im) for im in images];out=[]
# All 9 patches are held out: zero translation or warping is fitted/applied.
for k in [1,2]:
 patches=[]
 for cy in [40,103,166]:
  for cx in [40,102,164]:
   a=edges[0][cy-18:cy+18,cx-18:cx+18];a=a-a.mean();scores=[]
   for dy in range(-4,5):
    for dx in range(-4,5):
     b=edges[k][cy-18+dy:cy+18+dy,cx-18+dx:cx+18+dx];b=b-b.mean();corr=float(np.sum(a*b)/(np.linalg.norm(a)*np.linalg.norm(b)+1e-12));scores.append((corr,dx,dy))
   scores.sort(reverse=True);score,dx,dy=scores[0];zero=next(c for c,x,y in scores if x==0 and y==0)
   patches.append(dict(centerGrid=[cx,cy],bestShiftM=[dx*10,dy*10],residualM=float(np.hypot(dx,dy)*10),correlation=score,zeroShiftCorrelation=zero,peakGap=scores[0][0]-scores[1][0],reliable=bool(score>=.35 and abs(dx)<4 and abs(dy)<4)))
 good=[p for p in patches if p['reliable']];out.append(dict(reference=ids[0],view=ids[k],patches=patches,reliablePatches=len(good),rmsResidualM=float(np.sqrt(np.mean([p['residualM']**2 for p in good]))) if good else None))
report=dict(host='z370',runId='ridgemesh-terrain-registration-20260912',method='Nine distributed held-out 360m patches; 10m grayscale gradient magnitude normalized correlation over +/-40m. Zero fitted transformation. Descriptive texture alignment; canopy, land-use and seasonal changes confound this test.',toleranceM=20,toleranceRationale='Two native Sentinel-2 pixels; diagnostic display tolerance only, not survey/CE90 accuracy.',groundLandmarks='Not independently identified. Patch correlations must not be called measured ground-control residuals.',results=out)
json.dump(report,open('registration.json','w'),indent=2)
# Comparison artifact: source images share extent, with projected-source contours and check patches.
d=json.load(open('output/data/terrain.json'));h=np.array(d['heights']).reshape(207,205)
canvas=Image.new('RGB',(1260,500),'white');draw=ImageDraw.Draw(canvas)
for k,im in enumerate(images):
 im=im.resize((408,412));canvas.paste(im,(k*420,45));draw.text((k*420+5,8),ids[k],fill='black')
 for level in range(190,281,10):
  for y in range(206):
   for x in range(204):
    if (h[y,x]<=level<h[y,x+1]) or (h[y,x+1]<=level<h[y,x]):draw.point((k*420+x*2,45+y*2),fill='#ffea00')
 for cy in [40,103,166]:
  for cx in [40,102,164]:draw.rectangle((k*420+(cx-18)*2,45+(cy-18)*2,k*420+(cx+18)*2,45+(cy+18)*2),outline='cyan',width=1)
draw.text((5,475),'10m DEM contour crossings (yellow); held-out image patches (cyan). North = projected grid north.',fill='black');canvas.save('registration-comparison.jpg',quality=92)
print(json.dumps(report))
