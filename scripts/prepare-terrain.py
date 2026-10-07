"""Run only on z370 in isolated rasterio/pyproj environment. Raw source stays there."""
import os,json,math,hashlib,requests
import numpy as np
import rasterio
from rasterio.warp import reproject,Resampling
from rasterio.transform import from_origin
from pyproj import Transformer
from PIL import Image
os.makedirs('output/data',exist_ok=True);os.makedirs('output/imagery',exist_ok=True)
def sha(p):
 h=hashlib.sha256()
 with open(p,'rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
t=Transformer.from_crs(4326,26915,always_xy=True)
pts=[t.transform(x,y) for x in [-90.4215,-90.399] for y in [38.0135,38.0315]]
west=math.floor(min(p[0] for p in pts)/10)*10;north=math.ceil(max(p[1] for p in pts)/10)*10
cols=math.ceil((max(p[0] for p in pts)-west)/10)+1;rows=math.ceil((north-min(p[1] for p in pts))/10)+1
transform=from_origin(west-5,north+5,10,10)
with rasterio.open('source.tif') as src:
 arr=np.full((rows,cols),np.nan,dtype='float32')
 reproject(rasterio.band(src,1),arr,src_transform=src.transform,src_crs=src.crs,dst_transform=transform,dst_crs='EPSG:26915',resampling=Resampling.bilinear,dst_nodata=np.nan)
 assert np.isfinite(arr).all()
 manifest={'version':'usgs-2021-10m-v1','sourceId':'65fe634fd34e64ff1548db4e','sourceTitle':'USGS 1 Meter 15 x72y422 MO_Northern_SEMO_2021_D21','sourceUrl':'https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/1m/Projects/MO_Northern_SEMO_2021_D21/TIFF/USGS_1M_15_x72y422_MO_Northern_SEMO_2021_D21.tif','sourceSha256':sha('source.tif'),'sourceCrs':str(src.crs),'sourceTransform':list(src.transform)[:6],'sourceResolution':list(src.res),'sourceBounds':list(src.bounds),'sourceNodata':src.nodata,'verticalDatum':'NAVD88 metres','license':'USGS public domain','crs':'EPSG:26915','westCenter':west,'northCenter':north,'cols':cols,'rows':rows,'cellM':10,'transform':list(transform)[:6],'resampling':'GDAL bilinear downsampling from 1m source; no fabricated heights','minM':float(arr.min()),'maxM':float(arr.max()),'rawSourceHost':'z370:/home/jamie/ridgemesh-terrain-20260912/source.tif','accuracy':'Source accuracy not independently surveyed; 10m analysis omits subcell obstructions','landcover':'Legacy inferred masks, unverified; not remotely classified or surveyed'}
 samples=[]
 for x,y in [(10,10),(cols-11,10),(cols//2,rows//2),(10,rows-11),(cols-11,rows-11)]:
  e,n=west+x*10,north-y*10
  z=float(next(src.sample([(e,n)]))[0]);samples.append({'x':x,'y':y,'easting':e,'northing':n,'sourceNearest1m':z,'analysis10m':float(arr[y,x]),'aggregationDifferenceM':float(arr[y,x])-z})
 manifest['sourceSamples']=samples
 with rasterio.open('analysis-10m.tif','w',driver='GTiff',height=rows,width=cols,count=1,dtype='float32',crs='EPSG:26915',transform=transform) as dst:dst.write(arr,1)
json.dump({'metadata':manifest,'heights':np.round(arr,3).ravel().tolist()},open('output/data/terrain.json','w'),separators=(',',':'))
json.dump(manifest,open('output/data/terrain-manifest.json','w'),indent=2)
views=[]
scenes=json.load(open('scenes.json'))['features'];naips=json.load(open('naip.json'))['features']
chosen=[next(f for f in scenes if f['id']=='S2A_15SYC_20240613_0_L2A'),next(f for f in scenes if f['id']=='S2A_15SYC_20241110_0_L2A'),naips[0]]
for f in chosen:
 naip=f['collection']=='naip';url=f['assets']['image' if naip else 'visual']['href'];readurl=url
 if naip:
  r=requests.get('https://planetarycomputer.microsoft.com/api/sas/v1/sign',params={'href':url},timeout=60);r.raise_for_status();readurl=r.json()['href']
 scale=1 if naip else 5;w=(cols-1)*10//scale;h=(rows-1)*10//scale
 # Texture edges are exactly first/last DEM vertex centres, not half-pixel outside.
 tx=from_origin(west,north,scale,scale);rgb=np.zeros((3,h,w),dtype='uint8')
 with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR',CPL_VSIL_CURL_ALLOWED_EXTENSIONS='.tif'):
  with rasterio.open(readurl) as src:
   for b in range(3):reproject(rasterio.band(src,b+1),rgb[b],src_transform=src.transform,src_crs=src.crs,dst_transform=tx,dst_crs='EPSG:26915',resampling=Resampling.bilinear)
   crs=str(src.crs);res=list(src.res)
 assert np.mean(rgb)>5
 ident='naip-20220618' if naip else 'sentinel-'+f['properties']['datetime'][:10].replace('-','')
 p='output/imagery/'+ident+'.jpg';Image.fromarray(np.moveaxis(rgb,0,-1)).save(p,quality=92)
 views.append({'id':ident,'label':'NAIP aerial 2022' if naip else 'Sentinel-2 '+f['properties']['datetime'][:10],'date':f['properties']['datetime'][:10],'url':'/imagery/'+ident+'.jpg','kind':'aerial' if naip else 'satellite','attribution':'USDA NAIP / Microsoft Planetary Computer' if naip else 'Contains modified Copernicus Sentinel data 2024 / Element 84 Earth Search','resolutionM':res[0],'sourceId':f['id'],'sourceUrl':url,'sourceCrs':crs,'license':'Public domain USDA NAIP' if naip else 'Copernicus Sentinel free and open data','sha256':sha(p),'width':w,'height':h,'crs':'EPSG:26915','transform':list(tx)[:6],'registration':'CRS/geotransform registration only; independent ground control residuals unmeasured','accuracy':'Not independently verified; native resolution is not horizontal accuracy'})
 json.dump(f,open('output/data/'+ident+'-stac.json','w'),indent=2)
 print(ident,w,h,flush=True)
json.dump(views,open('output/data/imagery-manifest.json','w'),indent=2)
print(json.dumps(manifest),flush=True)
