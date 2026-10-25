"""Static layout drawings for handoff. No event handlers or game implementation."""
from pathlib import Path
import base64, subprocess, html, json
from PIL import Image, ImageDraw, ImageFont
R=Path(__file__).resolve().parents[1]; A=R/'assets/ui'; M=R/'mockups'
layouts=[]
def text(x,y,t,size=16,color='#F4F7FC',weight=400,anchor='start',serif=False):
 return f'<text x="{x}" y="{y}" fill="{color}" font-size="{size}" font-family="{chr(71)+"eorgia" if serif else "DejaVu Sans"}" font-weight="{weight}" text-anchor="{anchor}">{html.escape(t)}</text>'
def img(path,x,y,w,h):
 p=A/path; typ='image/png' if p.suffix=='.png' else 'image/svg+xml'
 return f'<image x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="none" xlink:href="data:{typ};base64,{base64.b64encode(p.read_bytes()).decode()}"/>'
def rect(x,y,w,h,color='#101E32',r=12,stroke='#42566E'):
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{color}" stroke="{stroke}"/>'
def panel(x,y,w,h):return img(Path('common/panel-glass.svg'),x,y,w,h)
def button(x,y,w,label,kind='primary'):
 return img(Path(f'common/button-{kind}.svg'),x,y,w,46)+text(x+w/2,y+29,label,14,'#F4F7FC',600,'middle')
def header(title,sub=''):
 return text(28,36,title,23,weight=500)+text(28,56,sub,11,'#ACBED1')+text(810,36,'GP 12,500',14,'#F2D68C',anchor='end')
def nav(active):
 out=img(Path('common/nav-bar.svg'),20,332,804,54)
 names=['HOME','PLAY','CARDS','GACHA','CHAT','SETTINGS']
 for i,n in enumerate(names):
  x=20+i*134
  if n==active:out+=img(Path('common/nav-selected.svg'),x,333,134,52)
  out+=img(Path(f'icons/{n.lower()}.svg'),x+57,338,20,20)+text(x+67,376,n,10,'#74F4CA' if n==active else '#CBD7E7',500,'middle')
 return out
def photo(x,y,w,h):
 if w>=800:return rect(x,y,w,h,'url(#photo)',0,'none')
 return rect(x,y,w,h,'url(#photo)',10,'#53647B')+img(Path('icons/wallpaper.svg'),x+w/2-12,y+h/2-12,24,24)+text(x+w/2,y+h-15,'EXISTING PHOTO',9,'#ACBED1',anchor='middle')
def card(x,y,w,rank='s'):
 h=w*1.4
 return photo(x+w*.05,y+h*(30/840),w*.9,h*(750/840))+img(Path(f'cards/frame-{rank}.png'),x,y,w,h)+text(x+w/2,y+h-6,rank.upper(),12,'#F4F7FC',600,'middle')
def finish(name,title,body,active='',note=''):
 defs='<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#08111F"/><stop offset=".55" stop-color="#182D46"/><stop offset="1" stop-color="#201E3C"/></linearGradient><linearGradient id="photo" x2="1" y2="1"><stop stop-color="#29495A"/><stop offset="1" stop-color="#1C243D"/></linearGradient></defs>'
 bg='<rect width="844" height="390" fill="url(#bg)"/>'+img(Path('effects/edge-aurora.svg'),0,0,844,390)
 if active:body+=nav(active)
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1688" height="780" viewBox="0 0 844 390">{defs}{bg}{body}</svg>'
 p=M/f'{name}-layout.svg';p.write_text(svg)
 subprocess.run(['inkscape',str(p),'--export-type=png',f'--export-filename={p.with_suffix(".png")}'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
 layouts.append(dict(name=name,title=title,file=str(p.with_suffix('.png').relative_to(R)),logical_size=[844,390],note=note))

finish('title','TITLE',photo(0,0,844,390)+img(Path('title/logo-ornament.svg'),198,83,448,131)+text(422,148,'GREEN ROOM',37,anchor='middle',serif=True)+text(422,178,'E N G L I S H',15,'#74F4CA',anchor='middle')+img(Path('title/start-ornament.svg'),262,263,320,44)+text(422,291,'TAP TO START',14,anchor='middle'))
b=photo(0,0,844,390)+text(30,36,'GREEN ROOM',23,serif=True)+text(31,56,'E N G L I S H',10,'#74F4CA')+img(Path('home/status-bar.svg'),405,15,411,44)+text(427,43,'NENE',14)+text(540,43,'GP 12,500',14,'#F2D68C')+text(686,43,'HEART 240',13,'#FF9DD4')
b+=panel(28,188,260,130)+text(45,213,'CURRENT LESSON',10,'#ACBED1')+text(45,240,'01  Be verbs',22)+button(44,257,226,'CONTINUE')
b+=img(Path('home/member-chip.svg'),430,73,300,40)+text(580,98,'MEMBER 01  •  SELECTED',12,'#FF9DD4',anchor='middle')
for j,ic in enumerate(['wallpaper','gift','bell']):b+=panel(764,86+j*70,48,48)+img(Path(f'icons/{ic}.svg'),776,98+j*70,24,24)
finish('home','HOME',b,'HOME')
b=header('WALLPAPER','Choose from your 20 existing photos')
for i in range(8):
 x=28+(i%4)*198;y=76+(i//4)*118
 b+=photo(x,y,184,102)
 if i==0:b+=img(Path('home/wallpaper-selected.svg'),x,y,184,102)
finish('wallpaper','WALLPAPER',b,'HOME',note='4×2 thumbnails; list internally scrolls to 20. thumbnail height may shrink to 84px on short devices.')
b=header('PLAY','60 grammar topics • 3 topics per wallpaper')+panel(28,72,388,248)+panel(430,72,386,248)
for i,t in enumerate(['01  Be verbs','02  General verbs','03  Questions','04  Present continuous']):
 y=82+i*55;b+=img(Path('play/grammar-selected.svg' if i==0 else 'play/grammar-row.svg'),38,y,368,48)+text(54,y+29,t,16)
 if i<2:b+=img(Path('play/clear-mark.svg'),370,y+12,24,24)
b+=text(449,101,'01  BE VERBS',19)+text(449,126,'Choose difficulty',12,'#ACBED1')
for i,d in enumerate(['easy','normal','hard','master']):
 x=449+(i%2)*175;y=140+(i//2)*53;b+=img(Path(f'play/difficulty-{d}.svg'),x,y,164,46)+text(x+82,y+28,d.upper(),12,anchor='middle')
b+=text(449,262,'BEST 9,250   •   3 / 4 CLEARED',11,'#ACBED1')+button(449,273,348,'START')
finish('grammar','GRAMMAR',b,'PLAY')
for d in ['easy','normal','hard','master']:
 b=header('PLAY',f'01  Be verbs  /  {d.upper()}  /  04 of 10')
 b+=img(Path('play/progress-track.svg'),28,63,788,5)+img(Path('play/progress-fill.svg'),28,63,315,5)
 b+=panel(28,79,788,112)+text(48,105,'Japanese prompt area • illustrative English annotation',12,'#ACBED1')+text(48,140,'He ___ a singer.' if d=='easy' else 'Say that he is a singer.',23)+text(48,170,'Choose the missing word.' if d=='easy' else 'Build the English sentence below.',12,'#74F4CA')
 if d=='easy':
  for i,t in enumerate(['am','is','are','be']):
   x=28+i*199;b+=img(Path('play/word-tile.svg'),x,205,188,48)+text(x+94,235,t,18,anchor='middle')
 elif d in ['normal','hard']:
  b+=img(Path('play/answer-area.svg'),28,199,788,48)+text(48,230,'He   |   is   |   …',17,'#ACBED1')
  tiles=['a','singer','.']+(['are','an'] if d=='hard' else [])
  tw=92 if d=='hard' else 130
  for i,t in enumerate(tiles):
   x=28+i*(tw+8);b+=img(Path('play/word-tile.svg'),x,257,tw,46)+text(x+tw/2,286,t,16,anchor='middle')
  b+=button(654,257,162,'CHECK')
 else:
  b+=img(Path('play/answer-area.svg'),28,205,566,50)+text(45,237,'Type the full English sentence…',17,'#ACBED1')+button(610,207,206,'CHECK')+text(30,281,'Keyboard opens: collapse navigation; keep prompt + input visible.',12,'#ACBED1')
 finish(f'play-{d}',f'PLAY / {d.upper()}',b,'PLAY',note='English annotations mark Japanese text placement; real prompt: 彼は歌手です。Normal/hard show a partially composed answer after two taps. Used tokens disappear from bank. Actual Japanese is rendered by system fonts on iPhone.')
b=header('LESSON CLEAR','01 Be verbs • NORMAL')+card(68,77,170,'s')+panel(282,76,534,244)+text(304,107,'SCORE',12,'#ACBED1')+text(304,154,'9,250',46,'#F2D68C',500)+img(Path('result/rank-s-emblem.svg'),690,86,94,94)+text(737,145,'S',37,'#F2D68C',500,'middle')
b+=text(304,190,'9 / 10 CORRECT',15)+text(493,190,'GP +250',15,'#F2D68C')+text(655,190,'HEART +30',15,'#FF9DD4')+text(304,220,'AFFECTION',11,'#ACBED1')+img(Path('result/affection-track.svg'),304,230,486,12)+img(Path('result/affection-fill.svg'),304,230,340,12)
for i,t in enumerate(['RETRY','NEXT','HOME']):b+=button(302+i*163,262,152,t,'primary' if i==1 else 'secondary')
finish('result','RESULT',b,'PLAY')
b=header('CARDS','C Offshots  /  B Artist  /  A Live  /  S Concept')
for i,(lab,rank) in enumerate(zip(['C','B','A','S','LOCKED','C'],['c','b','a','s',None,'c'])):
 x=28+i*132;b+=card(x,90,126,rank) if rank else img(Path('cards/unowned-card.svg'),x,90,126,176.4)
 b+=text(x+63,291,lab,12,'#ACBED1',anchor='middle')
finish('cards','CARDS',b,'CARDS')
b=header('GACHA','PHOTO COLLECTION • sample prices')+img(Path('gacha/reveal-s-ring.png'),30,118,410,205)+img(Path('gacha/card-back.svg'),159,76,162,226.8)+panel(463,78,353,242)+text(489,111,'COLLECT YOUR MOMENTS',16)+text(489,143,'C  /  B  /  A  /  S',22,'#F2D68C')+button(485,177,310,'DRAW ×1    GP 300','secondary')+button(485,238,310,'DRAW ×10    GP 3,000','gold')
finish('gacha','GACHA',b,'GACHA')
b=header('10 DRAWS','Horizontally swipe to view all 10 results')
for i,k in enumerate(['c','b','c','a','s','b']):b+=card(28+i*132,91,126,k)
b+=text(422,308,'1 — 6  /  10     •     horizontal scroll',12,'#ACBED1',anchor='middle')
finish('gacha-ten','10 DRAW RESULT',b,'GACHA',note='A single row scrolls horizontally. Do not squeeze ten cards into 2 short unreadable rows.')
b=header('CHAT','Prewritten messages unlock with affection')+panel(28,75,260,247)+panel(302,75,514,247)
for i,n in enumerate(['MEMBER 01','MEMBER 02','MEMBER 03']):
 y=87+i*72;b+=img(Path('chat/conversation-selected.svg' if i==0 else 'chat/conversation-row.svg'),38,y,240,62)+img(Path('icons/portrait.svg'),48,y+16,28,28)+text(87,y+28,n,13)+text(87,y+46,'New message' if i==0 else 'Locked' if i==2 else 'Read',11,'#ACBED1')
b+=img(Path('common/notification-badge.svg'),252,102,14,14)+img(Path('icons/lock.svg'),249,249,20,20)
b+=text(322,103,'MEMBER 01',15)+text(795,103,'HEART 240',12,'#FF9DD4',anchor='end')
b+=img(Path('chat/bubble-incoming.svg'),319,121,270,57)+text(341,154,'Great work today!',16)+img(Path('chat/bubble-incoming.svg'),319,187,265,57)+text(341,220,'One more lesson?',16)+img(Path('chat/bubble-outgoing.svg'),610,254,188,52)+text(704,286,'Let’s do it!',16,anchor='middle')
finish('chat','CHAT',b,'CHAT',note='Scripted sample only. No live message generation or real-person claim. Conversation list and thread scroll separately.')
b=header('LOGIN BONUS','Sample 7-day cycle • rewards are configuration data')+panel(28,75,788,245)
for i in range(7):
 x=45+i*109;b+=img(Path('login/day-today.svg' if i==2 else 'login/day-claimed.svg' if i<2 else 'login/day-frame.svg'),x,110,100,128)+text(x+50,134,f'DAY {i+1}',12,anchor='middle')+text(x+50,219,'GP 100',12,'#F2D68C',anchor='middle')
b+=button(285,260,274,'CLAIM','gold')
finish('login','LOGIN BONUS',b,'HOME')
b=header('SETTINGS','Music • effects • wallpaper • save data')+panel(28,76,788,245)
for i,label in enumerate(['BGM','SOUND EFFECTS']):
 y=108+i*64;b+=text(49,y+18,label,14)+img(Path('settings/slider-track.svg'),240,y+7,340,12)+img(Path('settings/slider-fill.svg'),240,y+7,220,12)+img(Path('settings/slider-thumb.svg'),445,y-2,30,30)+text(610,y+18,'65%',14)+img(Path('settings/switch-on.svg'),711,y-4,60,36)
b+=button(47,258,230,'WALLPAPER','secondary')+button(294,258,230,'EXPORT SAVE','secondary')+button(541,258,252,'IMPORT SAVE','secondary')
finish('settings','SETTINGS',b,'SETTINGS')
(R/'design/layout-manifest.json').write_text(json.dumps(layouts,ensure_ascii=False,indent=2))
# Review contact sheet from exact layouts, never from generated concepts.
major=['home','play-normal','result','cards','gacha','chat']
board=Image.new('RGB',(1688,3*430),'#08111f');draw=ImageDraw.Draw(board)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
for i,n in enumerate(major):
 im=Image.open(M/f'{n}-layout.png').convert('RGB');im.thumbnail((824,381));x=12+(i%2)*844;y=12+(i//2)*430
 board.paste(im,(x,y));draw.text((x+8,y+387),n.upper(),font=font,fill='#ACBED1')
board.save(M/'major-screens-overview.png')
print(f'{len(layouts)} exact static layouts exported')
