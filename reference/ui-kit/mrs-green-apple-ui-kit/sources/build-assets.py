"""Design asset authoring only; no game logic. Run from kit root with Python/Pillow/Inkscape."""
from pathlib import Path
import json, csv, base64, subprocess, shutil, math
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'assets/ui'
records=[]
C={'silver':'#CBD7E7','mint':'#74F4CA','blue':'#72B9FF','violet':'#BC9BFF','rose':'#FF9DD4','gold':'#F2D68C','error':'#FF939E'}

def defs(color='#CBD7E7'):
 return f'''<defs>
 <linearGradient id="glass" x2=".2" y2="1"><stop stop-color="#53647B" stop-opacity=".85"/><stop offset=".3" stop-color="#182A43" stop-opacity=".9"/><stop offset="1" stop-color="#0A1425" stop-opacity=".96"/></linearGradient>
 <linearGradient id="edge" x2=".8" y2="1"><stop stop-color="#F1F6FF" stop-opacity=".9"/><stop offset=".4" stop-color="{color}" stop-opacity=".35"/><stop offset="1" stop-color="{color}" stop-opacity=".8"/></linearGradient>
 <linearGradient id="accent" x2=".8" y2="1"><stop stop-color="{color}"/><stop offset=".5" stop-color="{color}" stop-opacity=".45"/><stop offset="1" stop-color="#152A3D"/></linearGradient>
 <linearGradient id="rainbow"><stop stop-color="#F2D68C"/><stop offset=".22" stop-color="#FF9DD4"/><stop offset=".46" stop-color="#BC9BFF"/><stop offset=".68" stop-color="#72E4FF"/><stop offset=".85" stop-color="#E1FFDB"/><stop offset="1" stop-color="#F2D68C"/></linearGradient>
 <radialGradient id="halo"><stop stop-color="{color}" stop-opacity=".55"/><stop offset=".4" stop-color="{color}" stop-opacity=".16"/><stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient>
 </defs>'''

def rr(w,h,r=20,fill='url(#glass)',stroke='url(#edge)',sw=2):
 return f'<rect x="2" y="2" width="{w-4}" height="{h-4}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'

def save(folder,name,w,h,body,color='silver',purpose='',size='',layer=30,anim='none',css='DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。',slice_=None,kind='svg'):
 d=A/folder;d.mkdir(parents=True,exist_ok=True)
 col=C.get(color,color)
 s=f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{defs(col)}{body}</svg>'
 p=d/f'{name}.svg';p.write_text(s)
 records.append(dict(file=str(p.relative_to(ROOT)),png=str(p.with_suffix('.png').relative_to(ROOT)),width=w,height=h,screen=folder,purpose=purpose or name,recommended_css_size=size or f'{w/2:g}×{h/2:g}px',layer=layer,animation=anim,css=css,nine_slice=slice_,origin='svg-authored'))

def panel(folder,name,w,h,color='silver',r=28,purpose='',size='',slice_=None):
 body=rr(w,h,r)+f'<path d="M {r+8} 9 H {w-r-8}" fill="none" stroke="white" stroke-opacity=".2"/>'
 save(folder,name,w,h,body,color,purpose,size,slice_=slice_ or [32,32,32,32])

def button(folder,name,color='mint',w=400,h=96):
 body=rr(w,h,24,'url(#accent)')+f'<path d="M26 10 H{w-26}" stroke="white" stroke-opacity=".45"/>'
 save(folder,name,w,h,body,color,size=f'{w//2}×{h//2}px',anim='press-100',slice_=[28,28,28,28])

def ring(folder,name,color='mint',w=640,h=240):
 body=f'<ellipse cx="{w/2}" cy="{h/2}" rx="{w*.48}" ry="{h*.45}" fill="url(#halo)"/><ellipse cx="{w/2}" cy="{h/2}" rx="{w*.38}" ry="{h*.25}" fill="none" stroke="url(#edge)" stroke-width="2"/>'
 save(folder,name,w,h,body,color,layer=20,anim='pulse-once',css='opacity/transformだけをアニメーション。pointer-events:none。')

# Common, in screen order.
panel('common','nav-bar',1600,112,size='safe width×56px',r=24)
save('common','nav-selected',240,104,rr(240,104,20,'url(#halo)','none')+'<path d="M20 98 H220" stroke="#74F4CA" stroke-width="4" stroke-linecap="round"/>','mint',size='1タブ幅×52px',anim='tab-160')
save('common','notification-badge',40,40,'<circle cx="20" cy="20" r="16" fill="#FF9DD4" stroke="#101E32" stroke-width="4"/>','rose',size='10×10px',css='数字はDOM。未読はアクセシブル名も更新。')
panel('common','panel-glass',640,320)
panel('common','panel-quiet',640,320,color='blue')
panel('common','modal-frame',1120,560)
button('common','button-primary','mint')
button('common','button-secondary','silver')
button('common','button-gold','gold')
panel('common','tab-chip',200,88,r=42,size='100×44px')
save('common','tab-selected',200,88,rr(200,88,42,'url(#accent)'),'mint',size='100×44px')
save('common','divider',640,8,'<path d="M2 4 H638" stroke="url(#edge)" stroke-width="1"/>',size='可変幅×1px')
save('common','focus-ring',400,96,rr(400,96,24,'none','#F4F7FC',4),'mint',css='キーボードfocus-visible。色だけで状態を示さない。',slice_=[28]*4)
save('title','logo-ornament',960,280,'<ellipse cx="480" cy="140" rx="442" ry="98" fill="none" stroke="url(#edge)" stroke-width="2"/><path d="M40 220 H370 M590 220 H920" stroke="url(#rainbow)" stroke-width="2"/><path d="M480 196 L488 220 L480 244 L472 220 Z" fill="url(#rainbow)"/>','mint',size='360–440×105–128px',css='タイトル文字は別DOM。仮称GREEN ROOM ENGLISH。')
save('title','logotype-editable',960,280,'<text x="480" y="136" text-anchor="middle" font-family="Georgia,serif" font-size="82" letter-spacing="2" fill="#F4F7FC">GREEN ROOM</text><text x="480" y="196" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" letter-spacing="14" fill="#74F4CA">ENGLISH</text>','mint',size='装飾と同じ位置・同じ寸法',css='唯一の文字入り素材。仮称の編集可能ロゴ文字レイヤー。DOM描画を優先、公式ロゴではない。')
save('title','start-ornament',640,88,'<path d="M20 44 H180 M460 44 H620" stroke="url(#edge)"/><path d="M12 44 L20 36 L28 44 L20 52Z M612 44 L620 36 L628 44 L620 52Z" fill="#74F4CA"/>','mint',size='320×44px',anim='gentle-breathe')
ring('title','title-halo','mint',1200,560)

panel('home','status-bar',1000,96,r=46,size='可変幅×48px')
panel('home','lesson-summary',560,280,color='mint')
panel('home','wallpaper-thumb',304,168,r=14,size='152×84px')
save('home','wallpaper-selected',304,168,rr(304,168,14,'none','#74F4CA',5)+'<circle cx="278" cy="26" r="16" fill="#74F4CA"/><path d="M270 26 L276 32 L287 20" stroke="#08111F" stroke-width="3" fill="none"/>','mint',size='152×84px',css='枠を写真に重ねる。写真全体はクリック可能に。')
panel('home','member-chip',280,88,color='rose',r=42)

panel('play','grammar-list',660,500,color='blue')
panel('play','grammar-row',612,96,r=16,size='306×48px')
save('play','grammar-selected',612,96,rr(612,96,16,'url(#accent)')+'<path d="M8 22 V74" stroke="#74F4CA" stroke-width="5"/>','mint',size='306×48px')
for difficulty,color in [('easy','mint'),('normal','blue'),('hard','violet'),('master','gold')]:
 body=rr(240,88,20,'url(#glass)')
 for i in range(['easy','normal','hard','master'].index(difficulty)+1):
  body+=f'<path d="M{18+i*10} 65 L{23+i*10} 55 L{28+i*10} 65Z" fill="{C[color]}"/>'
 save('play',f'difficulty-{difficulty}',240,88,body,color,size='120×44px',css='難易度名はDOM。下部に1–4本の刻印で識別。',slice_=[24]*4)
save('play','clear-mark',64,64,'<circle cx="32" cy="32" r="27" fill="#112E2C" stroke="#74F4CA" stroke-width="2"/><path d="M18 32 L28 42 L47 22" stroke="#74F4CA" stroke-width="4" fill="none"/>','mint',size='24×24px')
button('play','start-button','mint')
panel('play','question-panel',1100,300,color='blue',size='可変幅×150px')
panel('play','answer-area',1056,112,r=20,size='可変幅×56px')
panel('play','word-tile',240,96,color='blue',r=18,size='内容幅×48px',slice_=[24]*4)
save('play','word-selected',240,96,rr(240,96,18,'url(#accent)'),'mint',size='内容幅×48px',slice_=[24]*4)
save('play','answer-correct',1100,300,rr(1100,300,28,'none','#74F4CA',4),'mint',anim='correct-450',css='正解ラベルとチェックをDOM/SVGで併記。',slice_=[32]*4)
save('play','answer-incorrect',1100,300,rr(1100,300,28,'none','#FF939E',4),'error',anim='incorrect-180',css='赤枠を一度表示。大きい揺れや点滅なし。',slice_=[32]*4)
panel('play','explanation-panel',1280,480,color='mint',size='可変幅×240px')
panel('play','progress-track',960,24,r=10,size='可変幅×12px',slice_=[12]*4)
save('play','progress-fill',960,24,rr(960,24,10,'url(#accent)','none'),'mint',size='可変幅×12px',css='widthまたはclip-pathで0–100%。固定画像を圧縮しない。',slice_=[12]*4)

panel('result','result-panel',1000,500,color='gold')
save('result','result-ornament',1000,500,'<path d="M30 80 V30 H160 M840 30 H970 V80 M30 420 V470 H160 M840 470 H970 V420" stroke="url(#rainbow)" stroke-width="2" fill="none"/>','gold',size='結果パネル全体',layer=35)
for rank,color in [('c','silver'),('b','blue'),('a','violet'),('s','gold')]:
 pts=' '.join(f'{120+90*math.cos(math.pi/8+i*math.pi/4):.1f},{120+90*math.sin(math.pi/8+i*math.pi/4):.1f}' for i in range(8))
 save('result',f'rank-{rank}-emblem',240,240,f'<circle cx="120" cy="120" r="116" fill="url(#halo)"/><polygon points="{pts}" fill="url(#glass)" stroke="url(#edge)" stroke-width="4"/><circle cx="120" cy="120" r="65" fill="none" stroke="url(#edge)" stroke-width="1"/>',color,size='72–104px正方形',anim='rank-enter',css='評価文字はDOM。カード希少度と評価基準は別設定。')
panel('result','affection-track',720,32,color='rose',r=14,size='360×16px',slice_=[16]*4)
save('result','affection-fill',720,32,rr(720,32,14,'url(#accent)','none'),'rose',size='0–360×16px',css='可変ゲージ。現在値をラベルで併記。',slice_=[16]*4)
ring('result','gp-gain','gold')
ring('result','affection-up','rose')

# Raster generated frames are fitted as a continuous texture into one exact aperture.
# SVG uses a mask, so no generated pixels can leak into the photo window.
for rank in ['c','b','a','s']:
 p=ROOT/'sources'/f'frame-{rank}-generated.png'
 im=Image.open(p).convert('RGBA'); alpha=im.getchannel('A')
 bbox=alpha.point(lambda v:255 if v>180 else 0).getbbox(); x0,y0,x3,y3=bbox
 midy=(y0+y3)//2; midx=(x0+x3)//2
 xs=[x for x in range(x0,x3) if alpha.getpixel((x,midy))>180]
 ys=[y for y in range(y0,y3) if alpha.getpixel((midx,y))>180]
 x1=max(x for x in xs if x<midx)+3; x2=min(x for x in xs if x>midx)-3
 y1=max(y for y in ys if y<(y0+y3)/2)+3; y2=min(y for y in ys if y>(y0+y3)/2)-3
 sx=[x0,x1,x2,x3];sy=[y0,y1,y2,y3];dx=[2,30,570,598];dy=[2,30,780,838]
 uri='data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()
 body='<defs><mask id="aperture" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="840"><rect width="600" height="840" rx="24" fill="white"/><rect x="30" y="30" width="540" height="750" rx="18" fill="black"/></mask></defs><g mask="url(#aperture)">'
 # Fill behind edge only; all production frames share identical transparent opening.
 body+='<rect x="2" y="2" width="596" height="836" rx="24" fill="url(#accent)"/>'
 body+=f'<svg x="2" y="2" width="596" height="836" viewBox="{x0} {y0} {x3-x0} {y3-y0}" preserveAspectRatio="none"><image xlink:href="{uri}" width="{im.width}" height="{im.height}"/></svg>'
 body+='</g><rect x="30" y="30" width="540" height="750" rx="18" fill="none" stroke="url(#edge)" stroke-width="1"/>'
 save('cards',f'frame-{rank}',600,840,body,dict(c='silver',b='blue',a='violet',s='gold')[rank],purpose=f'{rank.upper()}ランク共通窓フレーム',size='一覧100×140px／詳細180×252px',layer=40,css='写真x5%,y3.571429%,w90%,h89.285714%。半径3%。枠は固定比率で全体縮小。ラベルはDOM。')
 records[-1]['origin']='imagegen-texture-svg-aperture-mask'; records[-1]['photo_aperture']={'x':30,'y':30,'width':540,'height':750,'radius':18}; records[-1]['source_bounds']=[x0,y0,x3,y3]
panel('cards','collection-panel',1500,500,color='violet',size='一覧領域全体')
save('cards','collection-ornament',1500,500,'<path d="M20 470 Q750 380 1480 470 M30 30 H240 M1260 30 H1470" stroke="url(#edge)" stroke-width="2" fill="none"/>','violet',layer=20,size='一覧領域全体')
save('cards','unowned-card',600,840,rr(600,840,24)+'<rect x="30" y="30" width="540" height="750" rx="18" fill="#0B1424" stroke="#43536A"/><path d="M250 395 V365 A50 50 0 0 1 350 365 V395 M238 395 H362 V485 H238Z" fill="none" stroke="#697B93" stroke-width="8"/>','silver',size='100×140px',css='未所持は写真を表示しない。カードIDとランクの表示方針はデータ側。')
panel('cards','detail-panel',720,520,color='violet')

ring('gacha','stage-orbit','gold',1200,500)
button('gacha','draw-one','silver',560,96)
button('gacha','draw-ten','gold',560,96)
body=rr(600,840,24)+ '<rect x="22" y="22" width="556" height="796" rx="18" fill="none" stroke="url(#edge)" stroke-width="2"/>'
for rx,ry in [(180,280),(180,110),(115,280)]:
 body+=f'<ellipse cx="300" cy="420" rx="{rx}" ry="{ry}" fill="none" stroke="url(#edge)" stroke-width="1.5"/>'
body+='<path d="M300 340 L318 402 L380 420 L318 438 L300 500 L282 438 L220 420 L282 402Z" fill="url(#rainbow)"/><circle cx="300" cy="140" r="7" fill="#F2D68C"/><circle cx="300" cy="700" r="7" fill="#F2D68C"/>'
save('gacha','card-back',600,840,body,'gold',size='180×252px',anim='card-flip',css='rotateYする表裏を別要素で重ね、backface-visibility:hidden。')
for name,col in [('reveal-normal','blue'),('reveal-a','violet')]:ring('gacha',name,col,1000,500)
panel('gacha','ten-result-panel',1500,500,color='gold',size='全幅×250px')
panel('gacha','ten-result-slot',200,280,color='gold',r=10,size='100×140px')

panel('chat','conversation-panel',540,500,color='rose')
panel('chat','conversation-row',500,120,r=18,size='250×60px')
save('chat','conversation-selected',500,120,rr(500,120,18,'url(#glass)','#74F4CA',3),'mint',size='250×60px',slice_=[24]*4)
save('chat','bubble-incoming',560,160,'<path d="M28 4 H532 Q552 4 552 24 V128 Q552 148 532 148 H36 L8 158 L16 128 V24 Q16 4 36 4Z" fill="url(#glass)" stroke="url(#edge)" stroke-width="2"/>','silver',size='内容幅×内容高',css='伸縮はCSS吹き出しを推奨。左右padding16px、尾は疑似要素。文章はDOM。')
save('chat','bubble-outgoing',560,160,'<path d="M28 4 H524 Q544 4 544 24 V128 L552 158 L524 148 H28 Q8 148 8 128 V24 Q8 4 28 4Z" fill="url(#accent)" stroke="url(#edge)" stroke-width="2"/>','mint',size='内容幅×内容高',css='伸縮はCSS吹き出し推奨。濃色背景なので文字は白、淡色へ変える時は濃紺。')
panel('chat','locked-chat',500,120,color='silver',r=18,size='250×60px')
ring('chat','message-unlock','rose')

panel('login','bonus-panel',1280,500,color='gold')
panel('login','day-frame',144,184,color='silver',r=20,size='72×92px')
save('login','day-today',144,184,rr(144,184,20,'url(#accent)')+'<path d="M22 14 H122" stroke="#F2D68C" stroke-width="4"/>','gold',size='72×92px',css='DAY・報酬額はDOM。当日はラベルと線で示す。',slice_=[24]*4)
save('login','day-claimed',144,184,rr(144,184,20,'url(#glass)')+'<path d="M48 94 L65 111 L100 69" fill="none" stroke="#74F4CA" stroke-width="6"/>','mint',size='72×92px')
ring('login','reward-claim','gold')

panel('settings','settings-panel',1280,500,color='silver')
panel('settings','confirmation-dialog',900,420,color='silver')
panel('settings','slider-track',640,24,color='silver',r=10,size='320×12px',slice_=[12]*4)
save('settings','slider-fill',640,24,rr(640,24,10,'url(#accent)','none'),'mint',size='可変幅×12px',css='input[type=range]で実装。画像は見本。',slice_=[12]*4)
save('settings','slider-thumb',64,64,'<circle cx="32" cy="32" r="25" fill="url(#glass)" stroke="url(#edge)" stroke-width="3"/><circle cx="32" cy="32" r="8" fill="#74F4CA"/>','mint',size='24×24px／当たり44px',css='ドラッグ操作はネイティブrange。')
for state,col,cx in [('on','mint',84),('off','silver',36)]:
 save('settings',f'switch-{state}',120,72,rr(120,72,34,'url(#accent)')+f'<circle cx="{cx}" cy="36" r="25" fill="#F4F7FC"/>',col,size='60×36px／当たり60×44px',css='button role=switch、aria-checked、ON/OFFをDOMで併記。')

# Small unified line icons, no labels baked in.
paths={
 'home':'<path d="M3 10L12 3l9 7v11H7V11h10v10"/>',
 'play':'<path d="M8 4l12 8-12 8Z"/>',
 'cards':'<rect x="7" y="4" width="13" height="17" rx="2"/><path d="M5 18L2 5l12-2"/>',
 'gacha':'<path d="M12 2l2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z"/>',
 'chat':'<path d="M4 4h16v12H9l-5 5Z"/><path d="M8 9h8M8 12h5"/>',
 'settings':'<path d="M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z"/><circle cx="12" cy="12" r="3"/>',
 'bell':'<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5Z M10 21h4"/>',
 'wallpaper':'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="2"/><path d="M4 18l5-5 4 3 4-6 4 8"/>',
 'gift':'<rect x="3" y="9" width="18" height="4" rx="1"/><path d="M5 13v8h14v-8M12 9v12M12 9C0 10 5-2 12 9c7-11 12 1 0 0Z"/>',
 'heart':'<path d="M12 21L3 12C-2 3 8-1 12 6c4-7 14-3 9 6Z"/>',
 'gp':'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6"/><path d="M12 7l3 5-3 5-3-5Z"/>',
 'back':'<path d="M15 4l-8 8 8 8"/>',
 'next':'<path d="M9 4l8 8-8 8"/>',
 'close':'<path d="M5 5l14 14M19 5L5 19"/>',
 'check':'<path d="M4 12l5 5L20 6"/>',
 'lock':'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
 'volume':'<path d="M3 9h4l5-4v14l-5-4H3ZM16 8q4 4 0 8M19 5q7 7 0 14"/>',
 'music':'<path d="M9 17V5l11-2v12M9 7l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>',
 'save':'<path d="M4 3h13l4 4v14H3V3ZM7 3v6h9V3M7 21v-8h10v8"/>',
 'upload':'<path d="M12 16V3M7 8l5-5 5 5M4 15v6h16v-6"/>',
 'download':'<path d="M12 3v13M7 11l5 5 5-5M4 15v6h16v-6"/>',
 'search':'<circle cx="10" cy="10" r="6"/><path d="M15 15l6 6"/>',
 'reset':'<path d="M4 7v6h6M4 12a8 8 0 1 0 3-6"/>',
 'help':'<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 1 1 5 3l-2 2v2M12 18h.01"/>',
 'portrait':'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 'rotate':'<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M3 6L1 10l4 1M21 18l2-4-4-1"/>',
}
for name,body in paths.items():
 col='gold' if name=='gp' else 'rose' if name=='heart' else 'silver'
 body=f'<g fill="none" stroke="{C[col]}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">{body}</g>'
 save('icons',name,24,24,body,col,size='20–24px／当たり44×44px',css='単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。')

# Low-cost exact VFX building blocks.
save('effects','sparkle',96,96,'<path d="M48 8L56 40L88 48L56 56L48 88L40 56L8 48L40 40Z" fill="url(#rainbow)"/>','gold',size='8–24px',anim='particle-800',layer=60,css='上限40個。輝点の点滅ループは禁止。')
ring('effects','soft-flare','gold',640,320)
ring('effects','affection-halo','rose',640,320)
save('effects','edge-aurora',1600,720,'<path d="M4 640 Q180 300 4 80 M1596 80 Q1410 300 1596 640" stroke="url(#rainbow)" stroke-width="6" opacity=".06" fill="none"/><path d="M8 650 Q320 500 540 700 M1592 650 Q1280 500 1060 700" stroke="url(#edge)" stroke-width="1" opacity=".2" fill="none"/>','mint',size='全画面',layer=10,css='写真上の装飾。設問付近では非表示。')

def main():
 for rec in records:
  p=ROOT/rec['file']; out=ROOT/rec['png']
  args=['inkscape',str(p),'--export-type=png',f'--export-filename={out}','--export-background-opacity=0']
  if rec['screen']=='icons':args+=['--export-width=96','--export-height=96']
  if p.stem=='nav-bar':rec['layer']=70
  if p.stem=='nav-selected':rec['layer']=71
  if p.stem=='notification-badge':rec['layer']=90
  if p.stem in ['modal-frame','confirmation-dialog','bonus-panel']:rec['layer']=80
  if rec['screen']=='icons':rec['layer']=50
  subprocess.run(args,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  rec['png_width'],rec['png_height']=Image.open(out).size
 for folder,name,purpose,anim in [('gacha','reveal-s-ring','S確定ホログラムリング','s-reveal-2200'),('effects','correct-sweep','正解時の光','correct-450')]:
  p=A/folder/f'{name}.png'; im=Image.open(p)
  records.append(dict(file=str(p.relative_to(ROOT)),png=None,width=im.width,height=im.height,screen=folder,purpose=purpose,recommended_css_size='幅320–480px、比率維持',layer=20,animation=anim,css='透明PNG。opacity/transformを別途実装。',nine_slice=None,origin='imagegen'))
 (ROOT/'design/asset-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
 fields=['file','png','width','height','png_width','png_height','screen','purpose','recommended_css_size','layer','animation','css','nine_slice','origin']
 with (ROOT/'docs/asset-inventory.csv').open('w',newline='',encoding='utf-8-sig') as f:
  w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');w.writeheader();w.writerows(records)
 print(f'{len(records)} logical assets exported')

if __name__=='__main__': main()
