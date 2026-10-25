from pathlib import Path
import json,csv,hashlib,re,xml.etree.ElementTree as ET
from PIL import Image,ImageDraw,ImageFont,ImageChops
R=Path(__file__).resolve().parents[1];Q=R/'qa';M=R/'mockups'
records=json.loads((R/'design/asset-manifest.json').read_text())
for rec in records:
 p=R/(rec['png'] or rec['file']);rec['png_width'],rec['png_height']=Image.open(p).size
(R/'design/asset-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
fields=['file','png','width','height','png_width','png_height','screen','purpose','recommended_css_size','layer','animation','css','nine_slice','origin']
with (R/'docs/asset-inventory.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');w.writeheader();w.writerows(records)
out=['# 素材一覧','', '117種類。SVGとPNGは同デザインの代替形式。寸法欄はSVGのviewBox/PNG実pixel。表示サイズはCSS px。レイヤーは画面rootの推奨値で、親パネル内では相対順として扱う。','']
for folder in ['common','title','home','play','result','cards','gacha','chat','login','settings','effects','icons']:
 out += [f'## {folder}','','|ファイル（assets/ui/以下）|用途|SVG / PNG寸法|推奨表示|z|動き|CSS/SVG補完|','|---|---|---|---|---|---|---|']
 for rec in [r for r in records if r['screen']==folder]:
  p=Path(rec['file']);dim=f'{rec["width"]}×{rec["height"]} / {rec["png_width"]}×{rec["png_height"]}'
  out.append(f'|{folder}/{p.stem} (.svg/.png)' if rec['png'] else f'|{folder}/{p.name}')
  out[-1]+=f'|{rec["purpose"]}|{dim}|{rec["recommended_css_size"]}|{rec["layer"]}|{rec["animation"]}|{rec["css"]}|'
 out+=['']
(R/'docs/asset-inventory.md').write_text('\n'.join(out))

colors={'night':'#08111F','panel':'#101E32','text':'#F4F7FC','muted':'#ACBED1','silver':'#CBD7E7','mint':'#74F4CA','blue':'#72B9FF','violet':'#BC9BFF','rose':'#FF9DD4','gold':'#F2D68C','error':'#FF939E'}
tokens={'version':1,'workingTitle':'GREEN ROOM ENGLISH','colors':colors,'referenceViewport':{'width':844,'height':390},'radius':{'panel':16,'button':12,'tile':10,'pill':999},'spacing':[4,8,12,16,24,32],'minimumTapTarget':44,'typeSize':{'body':16,'question':22,'heading':24,'caption':12,'nav':11,'score':44},'opacity':{'panel':.9,'quietPanel':.82,'flashMax':.12},'card':{'width':600,'height':840,'photo':{'x':30,'y':30,'width':540,'height':750,'radius':18}},'durationMs':{'press':100,'tab':160,'panel':220,'correct':450,'incorrect':180,'reward':800,'gachaNormal':900,'gachaA':1500,'gachaS':2200}}
(R/'design/tokens.json').write_text(json.dumps(tokens,ensure_ascii=False,indent=2))
css=['/* Design tokens only. No game implementation. */',':root {']+[f'  --gr-{k}: {v};' for k,v in colors.items()]+['  --gr-radius-panel: 16px;','  --gr-radius-button: 12px;','  --gr-radius-tile: 10px;','  --gr-tap-min: 44px;','  --gr-font: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif;','  --gr-ease: cubic-bezier(.2,.7,.2,1);','  --gr-motion-tab: 160ms;','  --gr-motion-panel: 220ms;','}']
(R/'design/tokens.css').write_text('\n'.join(css)+'\n')
motion={'version':1,'implementation':'CSS/Canvas to be implemented by Codex','reducedMotion':{'durationMs':120,'particles':False,'rotation':False,'flash':False},'maximumParticles':40,'effects':[{'id':r['animation'],'asset':r['file']} for r in records if r['animation']!='none'],'sReveal':{'durationMs':2200,'ring':'assets/ui/gacha/reveal-s-ring.png','flashMaxOpacity':.12,'flashCount':1,'keyEventsMs':{'ringStart':0,'particles':450,'flipStart':700,'flipEnd':1200,'ringExpand':1200,'fadeOut':1700,'finish':2200}},'details':'docs/animation-spec.md'}
(R/'design/motion-spec.json').write_text(json.dumps(motion,ensure_ascii=False,indent=2))
integration={'version':1,'note':'テンプレート。nullは未受領/未確定。実在ファイル名や値を推測しない。','backgrounds':[{'id':f'background-{i:02d}','file':None,'focalPoint':None,'grammarNumbers':list(range(i*3-2,i*3+1))} for i in range(1,21)],'homeWallpaperId':None,'members':[],'cards':[],'cardRecordExample':{'id':None,'memberId':None,'rank':'C','photoFile':None,'photoPosition':None,'caption':None},'audio':{'bgm':None,'sfx':{'tap':None,'correct':None,'incorrect':None,'gachaNormal':None,'gachaA':None,'gachaS':None,'reward':None}},'gameConfig':{'grammarCount':60,'questionsPerPlay':10,'difficulties':['EASY','NORMAL','HARD','MASTER'],'gachaCostOne':None,'gachaCostTen':None,'gachaRates':None,'duplicatePolicy':None,'scoreRankThresholds':None,'loginCycleDays':None,'loginTimezone':None},'chatScripts':[]}
(R/'docs/integration-template.json').write_text(json.dumps(integration,ensure_ascii=False,indent=2))
with (R/'docs/background-assignment.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(['grammar-number','background-id']);w.writerows((i,f'background-{(i-1)//3+1:02d}') for i in range(1,61))

results=[];failures=[]
for rec in records:
 p=R/(rec['png'] or rec['file']);im=Image.open(p).convert('RGBA');a=im.getchannel('A');hist=a.histogram()
 item={'file':str(p.relative_to(R)),'size':im.size,'alphaMin':a.getextrema()[0],'alphaMax':a.getextrema()[1],'transparentPixels':hist[0],'semiTransparentPixels':sum(hist[1:255]),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 if hist[0]==0:failures.append(f'No transparency: {p}')
 if not p.exists():failures.append(f'Missing file: {p}')
 if rec['png']:
  ET.parse(R/rec['file'])
 if p.stem in [f'frame-{x}' for x in 'cbas']:
  mask=Image.new('L',im.size,0);ImageDraw.Draw(mask).rounded_rectangle((33,33,567,777),radius=15,fill=255)
  maxalpha=ImageChops.multiply(a,mask).getextrema()[1];item['photoWindowMaxAlpha']=maxalpha
  if im.size!=(600,840) or maxalpha!=0:failures.append(f'Invalid card aperture: {p}')
 results.append(item)
for p in R.rglob('*'):
 if p.is_file() and not re.fullmatch(r'[a-z0-9-]+\.[a-z0-9]+',p.name):failures.append(f'Filename: {p.name}')
report={'logicalAssetCount':len(records),'productionPngCount':len(list((R/'assets').rglob('*.png'))),'productionSvgCount':len(list((R/'assets').rglob('*.svg'))),'allPngHaveActualTransparency':all(x['transparentPixels']>0 for x in results),'cardApertureIdentical':all(x.get('photoWindowMaxAlpha',0)==0 for x in results),'failures':failures,'checks':results,'scope':'Static material validation only. No device gameplay tests.'}
(Q/'validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',12)
for start in range(0,len(records),20):
 batch=records[start:start+20];board=Image.new('RGB',(1280,5*146),'#1B2330');d=ImageDraw.Draw(board)
 for j,rec in enumerate(batch):
  x=(j%4)*320;y=(j//4)*146;name=f'{rec["screen"]}/{Path(rec["file"]).stem}'
  d.text((x+4,y+5),name,font=font,fill='white')
  for side,bg in enumerate(['#08111F','#EEF2F6']):
   d.rectangle((x+side*158+3,y+25,x+side*158+155,y+139),fill=bg)
   im=Image.open(R/(rec['png'] or rec['file'])).convert('RGBA');im.thumbnail((144,104),Image.Resampling.LANCZOS)
   board.paste(im,(x+side*158+7+(144-im.width)//2,y+30+(104-im.height)//2),im)
 board.save(Q/f'asset-check-{start//20+1:02d}.png')
for bg,name in [('#08111F','dark'),('#EEF2F6','light')]:
 board=Image.new('RGB',(1280,520),bg);d=ImageDraw.Draw(board)
 for i,k in enumerate('cbas'):
  im=Image.open(R/f'assets/ui/cards/frame-{k}.png').convert('RGBA');im.thumbnail((300,420),Image.Resampling.LANCZOS);board.paste(im,(i*320+10,30),im);d.text((i*320+20,470),k.upper(),font=font,fill='#ACBED1' if name=='dark' else '#08111F')
 board.save(Q/f'card-frames-{name}.png')
names=['home','play','result','cards','gacha','chat'];board=Image.new('RGB',(1688,1290),'#08111F');d=ImageDraw.Draw(board)
font2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
for i,n in enumerate(names):
 im=Image.open(M/f'{n}-concept.png').convert('RGB');im.thumbnail((824,381),Image.Resampling.LANCZOS);x=12+i%2*844;y=12+i//2*430;board.paste(im,(x,y));d.text((x+8,y+387),n.upper(),font=font2,fill='#ACBED1')
board.save(M/'concept-screens-overview.png')
extra=['title','wallpaper','grammar','play-easy','play-hard','play-master','gacha-ten','login','settings']
for start in range(0,len(extra),4):
 board=Image.new('RGB',(1688,860),'#08111F');d=ImageDraw.Draw(board)
 for j,n in enumerate(extra[start:start+4]):
  im=Image.open(M/f'{n}-layout.png').convert('RGB');im.thumbnail((824,381),Image.Resampling.LANCZOS);x=12+j%2*844;y=12+j//2*430;board.paste(im,(x,y));d.text((x+8,y+387),n,font=font2,fill='#ACBED1')
 board.save(Q/f'layout-check-{start//4+1:02d}.png')
print(json.dumps({k:v for k,v in report.items() if k!='checks'},ensure_ascii=False))
if failures:raise SystemExit(1)
