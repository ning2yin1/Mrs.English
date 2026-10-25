# 素材一覧

117種類。SVGとPNGは同デザインの代替形式。寸法欄はSVGのviewBox/PNG実pixel。表示サイズはCSS px。レイヤーは画面rootの推奨値で、親パネル内では相対順として扱う。

## common

|ファイル（assets/ui/以下）|用途|SVG / PNG寸法|推奨表示|z|動き|CSS/SVG補完|
|---|---|---|---|---|---|---|
|common/nav-bar (.svg/.png)|nav-bar|1600×112 / 1600×112|safe width×56px|70|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|common/nav-selected (.svg/.png)|nav-selected|240×104 / 240×104|1タブ幅×52px|71|tab-160|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|common/notification-badge (.svg/.png)|notification-badge|40×40 / 40×40|10×10px|90|none|数字はDOM。未読はアクセシブル名も更新。|
|common/panel-glass (.svg/.png)|panel-glass|640×320 / 640×320|320×160px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|common/panel-quiet (.svg/.png)|panel-quiet|640×320 / 640×320|320×160px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|common/modal-frame (.svg/.png)|modal-frame|1120×560 / 1120×560|560×280px|80|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|common/button-primary (.svg/.png)|button-primary|400×96 / 400×96|200×48px|30|press-100|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|common/button-secondary (.svg/.png)|button-secondary|400×96 / 400×96|200×48px|30|press-100|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|common/button-gold (.svg/.png)|button-gold|400×96 / 400×96|200×48px|30|press-100|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|common/tab-chip (.svg/.png)|tab-chip|200×88 / 200×88|100×44px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|common/tab-selected (.svg/.png)|tab-selected|200×88 / 200×88|100×44px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|common/divider (.svg/.png)|divider|640×8 / 640×8|可変幅×1px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|common/focus-ring (.svg/.png)|focus-ring|400×96 / 400×96|200×48px|30|none|キーボードfocus-visible。色だけで状態を示さない。|

## title

|ファイル（assets/ui/以下）|用途|SVG / PNG寸法|推奨表示|z|動き|CSS/SVG補完|
|---|---|---|---|---|---|---|
|title/logo-ornament (.svg/.png)|logo-ornament|960×280 / 960×280|360–440×105–128px|30|none|タイトル文字は別DOM。仮称GREEN ROOM ENGLISH。|
|title/logotype-editable (.svg/.png)|logotype-editable|960×280 / 960×280|装飾と同じ位置・同じ寸法|30|none|唯一の文字入り素材。仮称の編集可能ロゴ文字レイヤー。DOM描画を優先、公式ロゴではない。|
|title/start-ornament (.svg/.png)|start-ornament|640×88 / 640×88|320×44px|30|gentle-breathe|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|title/title-halo (.svg/.png)|title-halo|1200×560 / 1200×560|600×280px|20|pulse-once|opacity/transformだけをアニメーション。pointer-events:none。|

## home

|ファイル（assets/ui/以下）|用途|SVG / PNG寸法|推奨表示|z|動き|CSS/SVG補完|
|---|---|---|---|---|---|---|
|home/status-bar (.svg/.png)|status-bar|1000×96 / 1000×96|可変幅×48px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|home/lesson-summary (.svg/.png)|lesson-summary|560×280 / 560×280|280×140px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|home/wallpaper-thumb (.svg/.png)|wallpaper-thumb|304×168 / 304×168|152×84px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|home/wallpaper-selected (.svg/.png)|wallpaper-selected|304×168 / 304×168|152×84px|30|none|枠を写真に重ねる。写真全体はクリック可能に。|
|home/member-chip (.svg/.png)|member-chip|280×88 / 280×88|140×44px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|

## play

|ファイル（assets/ui/以下）|用途|SVG / PNG寸法|推奨表示|z|動き|CSS/SVG補完|
|---|---|---|---|---|---|---|
|play/grammar-list (.svg/.png)|grammar-list|660×500 / 660×500|330×250px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|play/grammar-row (.svg/.png)|grammar-row|612×96 / 612×96|306×48px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|play/grammar-selected (.svg/.png)|grammar-selected|612×96 / 612×96|306×48px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|play/difficulty-easy (.svg/.png)|difficulty-easy|240×88 / 240×88|120×44px|30|none|難易度名はDOM。下部に1–4本の刻印で識別。|
|play/difficulty-normal (.svg/.png)|difficulty-normal|240×88 / 240×88|120×44px|30|none|難易度名はDOM。下部に1–4本の刻印で識別。|
|play/difficulty-hard (.svg/.png)|difficulty-hard|240×88 / 240×88|120×44px|30|none|難易度名はDOM。下部に1–4本の刻印で識別。|
|play/difficulty-master (.svg/.png)|difficulty-master|240×88 / 240×88|120×44px|30|none|難易度名はDOM。下部に1–4本の刻印で識別。|
|play/clear-mark (.svg/.png)|clear-mark|64×64 / 64×64|24×24px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|play/start-button (.svg/.png)|start-button|400×96 / 400×96|200×48px|30|press-100|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|play/question-panel (.svg/.png)|question-panel|1100×300 / 1100×300|可変幅×150px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|play/answer-area (.svg/.png)|answer-area|1056×112 / 1056×112|可変幅×56px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|play/word-tile (.svg/.png)|word-tile|240×96 / 240×96|内容幅×48px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|play/word-selected (.svg/.png)|word-selected|240×96 / 240×96|内容幅×48px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|play/answer-correct (.svg/.png)|answer-correct|1100×300 / 1100×300|550×150px|30|correct-450|正解ラベルとチェックをDOM/SVGで併記。|
|play/answer-incorrect (.svg/.png)|answer-incorrect|1100×300 / 1100×300|550×150px|30|incorrect-180|赤枠を一度表示。大きい揺れや点滅なし。|
|play/explanation-panel (.svg/.png)|explanation-panel|1280×480 / 1280×480|可変幅×240px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|play/progress-track (.svg/.png)|progress-track|960×24 / 960×24|可変幅×12px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|play/progress-fill (.svg/.png)|progress-fill|960×24 / 960×24|可変幅×12px|30|none|widthまたはclip-pathで0–100%。固定画像を圧縮しない。|

## result

|ファイル（assets/ui/以下）|用途|SVG / PNG寸法|推奨表示|z|動き|CSS/SVG補完|
|---|---|---|---|---|---|---|
|result/result-panel (.svg/.png)|result-panel|1000×500 / 1000×500|500×250px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|result/result-ornament (.svg/.png)|result-ornament|1000×500 / 1000×500|結果パネル全体|35|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|result/rank-c-emblem (.svg/.png)|rank-c-emblem|240×240 / 240×240|72–104px正方形|30|rank-enter|評価文字はDOM。カード希少度と評価基準は別設定。|
|result/rank-b-emblem (.svg/.png)|rank-b-emblem|240×240 / 240×240|72–104px正方形|30|rank-enter|評価文字はDOM。カード希少度と評価基準は別設定。|
|result/rank-a-emblem (.svg/.png)|rank-a-emblem|240×240 / 240×240|72–104px正方形|30|rank-enter|評価文字はDOM。カード希少度と評価基準は別設定。|
|result/rank-s-emblem (.svg/.png)|rank-s-emblem|240×240 / 240×240|72–104px正方形|30|rank-enter|評価文字はDOM。カード希少度と評価基準は別設定。|
|result/affection-track (.svg/.png)|affection-track|720×32 / 720×32|360×16px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|result/affection-fill (.svg/.png)|affection-fill|720×32 / 720×32|0–360×16px|30|none|可変ゲージ。現在値をラベルで併記。|
|result/gp-gain (.svg/.png)|gp-gain|640×240 / 640×240|320×120px|20|pulse-once|opacity/transformだけをアニメーション。pointer-events:none。|
|result/affection-up (.svg/.png)|affection-up|640×240 / 640×240|320×120px|20|pulse-once|opacity/transformだけをアニメーション。pointer-events:none。|

## cards

|ファイル（assets/ui/以下）|用途|SVG / PNG寸法|推奨表示|z|動き|CSS/SVG補完|
|---|---|---|---|---|---|---|
|cards/frame-c (.svg/.png)|Cランク共通窓フレーム|600×840 / 600×840|一覧100×140px／詳細180×252px|40|none|写真x5%,y3.571429%,w90%,h89.285714%。半径3%。枠は固定比率で全体縮小。ラベルはDOM。|
|cards/frame-b (.svg/.png)|Bランク共通窓フレーム|600×840 / 600×840|一覧100×140px／詳細180×252px|40|none|写真x5%,y3.571429%,w90%,h89.285714%。半径3%。枠は固定比率で全体縮小。ラベルはDOM。|
|cards/frame-a (.svg/.png)|Aランク共通窓フレーム|600×840 / 600×840|一覧100×140px／詳細180×252px|40|none|写真x5%,y3.571429%,w90%,h89.285714%。半径3%。枠は固定比率で全体縮小。ラベルはDOM。|
|cards/frame-s (.svg/.png)|Sランク共通窓フレーム|600×840 / 600×840|一覧100×140px／詳細180×252px|40|none|写真x5%,y3.571429%,w90%,h89.285714%。半径3%。枠は固定比率で全体縮小。ラベルはDOM。|
|cards/collection-panel (.svg/.png)|collection-panel|1500×500 / 1500×500|一覧領域全体|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|cards/collection-ornament (.svg/.png)|collection-ornament|1500×500 / 1500×500|一覧領域全体|20|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|cards/unowned-card (.svg/.png)|unowned-card|600×840 / 600×840|100×140px|30|none|未所持は写真を表示しない。カードIDとランクの表示方針はデータ側。|
|cards/detail-panel (.svg/.png)|detail-panel|720×520 / 720×520|360×260px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|

## gacha

|ファイル（assets/ui/以下）|用途|SVG / PNG寸法|推奨表示|z|動き|CSS/SVG補完|
|---|---|---|---|---|---|---|
|gacha/stage-orbit (.svg/.png)|stage-orbit|1200×500 / 1200×500|600×250px|20|pulse-once|opacity/transformだけをアニメーション。pointer-events:none。|
|gacha/draw-one (.svg/.png)|draw-one|560×96 / 560×96|280×48px|30|press-100|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|gacha/draw-ten (.svg/.png)|draw-ten|560×96 / 560×96|280×48px|30|press-100|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|gacha/card-back (.svg/.png)|card-back|600×840 / 600×840|180×252px|30|card-flip|rotateYする表裏を別要素で重ね、backface-visibility:hidden。|
|gacha/reveal-normal (.svg/.png)|reveal-normal|1000×500 / 1000×500|500×250px|20|pulse-once|opacity/transformだけをアニメーション。pointer-events:none。|
|gacha/reveal-a (.svg/.png)|reveal-a|1000×500 / 1000×500|500×250px|20|pulse-once|opacity/transformだけをアニメーション。pointer-events:none。|
|gacha/ten-result-panel (.svg/.png)|ten-result-panel|1500×500 / 1500×500|全幅×250px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|gacha/ten-result-slot (.svg/.png)|ten-result-slot|200×280 / 200×280|100×140px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|gacha/reveal-s-ring.png|S確定ホログラムリング|1774×887 / 1774×887|幅320–480px、比率維持|20|s-reveal-2200|透明PNG。opacity/transformを別途実装。|

## chat

|ファイル（assets/ui/以下）|用途|SVG / PNG寸法|推奨表示|z|動き|CSS/SVG補完|
|---|---|---|---|---|---|---|
|chat/conversation-panel (.svg/.png)|conversation-panel|540×500 / 540×500|270×250px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|chat/conversation-row (.svg/.png)|conversation-row|500×120 / 500×120|250×60px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|chat/conversation-selected (.svg/.png)|conversation-selected|500×120 / 500×120|250×60px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|chat/bubble-incoming (.svg/.png)|bubble-incoming|560×160 / 560×160|内容幅×内容高|30|none|伸縮はCSS吹き出しを推奨。左右padding16px、尾は疑似要素。文章はDOM。|
|chat/bubble-outgoing (.svg/.png)|bubble-outgoing|560×160 / 560×160|内容幅×内容高|30|none|伸縮はCSS吹き出し推奨。濃色背景なので文字は白、淡色へ変える時は濃紺。|
|chat/locked-chat (.svg/.png)|locked-chat|500×120 / 500×120|250×60px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|chat/message-unlock (.svg/.png)|message-unlock|640×240 / 640×240|320×120px|20|pulse-once|opacity/transformだけをアニメーション。pointer-events:none。|

## login

|ファイル（assets/ui/以下）|用途|SVG / PNG寸法|推奨表示|z|動き|CSS/SVG補完|
|---|---|---|---|---|---|---|
|login/bonus-panel (.svg/.png)|bonus-panel|1280×500 / 1280×500|640×250px|80|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|login/day-frame (.svg/.png)|day-frame|144×184 / 144×184|72×92px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|login/day-today (.svg/.png)|day-today|144×184 / 144×184|72×92px|30|none|DAY・報酬額はDOM。当日はラベルと線で示す。|
|login/day-claimed (.svg/.png)|day-claimed|144×184 / 144×184|72×92px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|login/reward-claim (.svg/.png)|reward-claim|640×240 / 640×240|320×120px|20|pulse-once|opacity/transformだけをアニメーション。pointer-events:none。|

## settings

|ファイル（assets/ui/以下）|用途|SVG / PNG寸法|推奨表示|z|動き|CSS/SVG補完|
|---|---|---|---|---|---|---|
|settings/settings-panel (.svg/.png)|settings-panel|1280×500 / 1280×500|640×250px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|settings/confirmation-dialog (.svg/.png)|confirmation-dialog|900×420 / 900×420|450×210px|80|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|settings/slider-track (.svg/.png)|slider-track|640×24 / 640×24|320×12px|30|none|DOM文字を重ねる。SVGを優先し、単純面はCSS再現可。|
|settings/slider-fill (.svg/.png)|slider-fill|640×24 / 640×24|可変幅×12px|30|none|input[type=range]で実装。画像は見本。|
|settings/slider-thumb (.svg/.png)|slider-thumb|64×64 / 64×64|24×24px／当たり44px|30|none|ドラッグ操作はネイティブrange。|
|settings/switch-on (.svg/.png)|switch-on|120×72 / 120×72|60×36px／当たり60×44px|30|none|button role=switch、aria-checked、ON/OFFをDOMで併記。|
|settings/switch-off (.svg/.png)|switch-off|120×72 / 120×72|60×36px／当たり60×44px|30|none|button role=switch、aria-checked、ON/OFFをDOMで併記。|

## effects

|ファイル（assets/ui/以下）|用途|SVG / PNG寸法|推奨表示|z|動き|CSS/SVG補完|
|---|---|---|---|---|---|---|
|effects/sparkle (.svg/.png)|sparkle|96×96 / 96×96|8–24px|60|particle-800|上限40個。輝点の点滅ループは禁止。|
|effects/soft-flare (.svg/.png)|soft-flare|640×320 / 640×320|320×160px|20|pulse-once|opacity/transformだけをアニメーション。pointer-events:none。|
|effects/affection-halo (.svg/.png)|affection-halo|640×320 / 640×320|320×160px|20|pulse-once|opacity/transformだけをアニメーション。pointer-events:none。|
|effects/edge-aurora (.svg/.png)|edge-aurora|1600×720 / 1600×720|全画面|10|none|写真上の装飾。設問付近では非表示。|
|effects/correct-sweep.png|正解時の光|2172×724 / 2172×724|幅320–480px、比率維持|20|correct-450|透明PNG。opacity/transformを別途実装。|

## icons

|ファイル（assets/ui/以下）|用途|SVG / PNG寸法|推奨表示|z|動き|CSS/SVG補完|
|---|---|---|---|---|---|---|
|icons/home (.svg/.png)|home|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/play (.svg/.png)|play|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/cards (.svg/.png)|cards|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/gacha (.svg/.png)|gacha|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/chat (.svg/.png)|chat|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/settings (.svg/.png)|settings|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/bell (.svg/.png)|bell|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/wallpaper (.svg/.png)|wallpaper|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/gift (.svg/.png)|gift|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/heart (.svg/.png)|heart|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/gp (.svg/.png)|gp|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/back (.svg/.png)|back|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/next (.svg/.png)|next|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/close (.svg/.png)|close|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/check (.svg/.png)|check|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/lock (.svg/.png)|lock|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/volume (.svg/.png)|volume|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/music (.svg/.png)|music|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/save (.svg/.png)|save|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/upload (.svg/.png)|upload|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/download (.svg/.png)|download|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/search (.svg/.png)|search|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/reset (.svg/.png)|reset|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/help (.svg/.png)|help|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/portrait (.svg/.png)|portrait|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
|icons/rotate (.svg/.png)|rotate|24×24 / 96×96|20–24px／当たり44×44px|50|none|単色SVG、CSS maskで状態色変更可能。aria-labelは親ボタンへ。|
