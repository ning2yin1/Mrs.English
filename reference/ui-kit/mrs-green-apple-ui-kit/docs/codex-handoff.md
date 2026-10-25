# Codex向け実装指示書

## 依頼の境界
本キットを使い、別途ゲームを実装する。ここにゲームコードはない。画像生成したモックアップを1枚絵の画面として配置しないこと。写真・文字・部品を別レイヤーにし、学習内容と写真が主役の画面を作る。
仮称GREEN ROOM ENGLISHは置換可能。公式ロゴを追加しない。新しい人物写真を生成しない。ユーザーが用意した写真・WAVのファイルを受け取って対応表を作る。

## 読む順序と正本
1. `design/design-system.md` → `docs/screen-layouts.md`。
2. `mockups/*-concept.png`で目標質感を確認。
3. `mockups/*-layout.png`と`design/layout-manifest.json`で寸法と構成を確認。
4. `design/asset-manifest.json`と`docs/asset-inventory.csv`から部品を選択。
5. `docs/animation-spec.md`で動きと停止時の扱いを確認。

競合時は文章の仕様→デザインシステム→正確な配置図→生成コンセプトの順に優先する。生成コンセプトは文字やアイコンに揺れがある。PLAYコンセプトのBe verbs見出しとlikes例文の不一致、上下に重複して見える単語、CHATの端末外枠は採用しない。正確な配置図は英語の説明文で日本語の位置を示している。実際には「彼は歌手です。」などの日本語をシステムフォントで表示する。

## レイヤー順
数値は各画面のroot内での標準z-index。modalは独立した最前面rootを使う。
|z|内容|
|---|---|
|0|既存の背景写真、cover|
|5|写真にかける局所scrim。写真領域全体を不必要に暗くしない|
|10|端のaurora装飾、pointer-events:none|
|20|カード背面の光、ガチャのリング|
|30|パネル・ボタン・カード写真・吹き出しの地|
|40|カードフレーム・選択線・入力状態の縁|
|50|DOM文字・アイコン・値・ランク字|
|60|正解・GP・好感度獲得など短時間の手前の光|
|70/71/75|ナビの地/選択光/アイコンと文字|
|79|モーダル用scrim。ナビを含め背面への操作を止める|
|80/85/90|モーダル面/モーダルの文字と操作/通知・緊急表示|

素材一覧のlayerは推奨値。共通部品をモーダル内に使う場合は親rootの中で再解釈する。エフェクトにpointer-eventsを持たせない。

## iPhone横画面の基本
基準844×390 CSS px、配置図は2倍の1688×780px。実装は画面全体を一定倍率で縮める方式にせず、flex/gridとminmaxで伸縮させる。
viewportはwidth=device-width, initial-scale=1, viewport-fit=cover。rootの大きさは動的viewportに追従。safe-area-inset-*を読み、左右にsafe inset＋12px、上にsafe inset＋8px、下にsafe inset＋8pxを確保する。
配置図の左右28pxは仮の視覚余白であり、機種固有のsafe insetの代わりにはならない。全ての文字とタップ対象を安全領域の内側に置く。写真・スクリーン・装飾だけを端まで描く。
画面外のbodyスクロールを生まない。文法一覧・カード一覧・会話一覧・解説本文だけを内部スクロールさせる。タップ対象44×44px以上。本文16px以上を基本とする。
横画面ロックは機能検出して試みるが、成功を必須条件にしない。縦向き時は「iPhoneを横向きにしてください」の案内を表示する。OSの回転ロックが必要になる場合も想定する。
タップボタンにはtouch-action:manipulationを検討する。ピンチ拡大を一律に禁止する実装や、全画面touchmove阻止で内部スクロールを壊す実装は行わない。

## 伸縮部品と文字
SVGを優先。半透明のパネルはCSSのborder/background-gradient/backdrop-filterで再現してよい。大きく伸ばす場合はネイティブCSSを使い、PNGを縦横に無制限に引き伸ばさない。
素材一覧のnine_sliceは画像ソースpixelでtop/right/bottom/left。角を保ち、中央領域だけを伸ばす。カード枠・光・アイコン・ロゴは9-sliceしない。
文字は画像にしない。ボタンは単なるimgではなくbutton要素を使い、装飾は背景に置く。空のSVGボタン画像に文字を重ねる。disabled・pressed・focus-visible状態はCSSで補完する。
カード、アイコン、光はPNGとSVGのどちらか一方を選ぶ。カード枠のSVGは生成質感を内包した固定窓マスクで、一般的なUIアイコンより容量が大きい。通常は検査済みPNGを使い、SVGは編集用とする。

## HOME / TITLE
壁紙は20枚のIDから選択。HOMEの壁紙選択はPLAYの背景割り当てと独立した設定として保存する。
タイトルはlogo-ornamentとlogotype-editableの別レイヤー。文字をDOMへ置き換えても同じ比率と中心位置を保つ。TAP TO STARTもDOM文字。端末の最初のタップを音声開始の契機にする。
HOMEは中央の写真を広く見せ、左下に続きの文法、右に壁紙/ログイン/通知。推しメンバーはmember-chip＋portraitで選択可能に。GP/好感度はモックアップの値で固定しない。プラス記号を使う場合、課金を示すUIとして誤認させない。

## PLAY
文法IDは01–60。背景IDは `floor((grammarNumber - 1) / 3) + 1`。01–03→01、04–06→02、58–60→20。難易度で背景を再割り当てしない。
文法選択は左48%一覧、右48%難易度と進捗。全60行を一度に縮小表示せず、一覧を内部スクロール。選択を戻した時はスクロール位置を保持する。
1プレイ10問。EASYは4択穴埋め、NORMALは必要語のみ、HARDはダミー語つき、MASTERは全文入力。文法と難易度は別パラメータ。
NORMAL/HARDは使用したトークンをbankから除き、回答から戻すと同じIDのトークンが戻る。重複するa/theなどは文字列でなく固有IDで管理する。タップで移動・戻しができるようにし、ドラッグは任意の補助操作とする。
長文で文字を縮めない。回答エリアは最大2行、bankは2行まで。狭い場合は写真用の補助領域を省き、解説を重ねる。CHECKは常に44px以上で到達可能にする。
MASTERではVisualViewport resize/scrollを用いてキーボード表示に追従する設計を検討する。ナビと装飾を一時的に畳み、設問の短縮表示、入力欄、CHECKを残す。iPhoneシステムフォント16px以上のinput。入力の評価ロジック・許容表現は別途学習仕様で定義する。
正解/不正解は色だけでなくアイコンと文言を出す。解説はexplanation-panelにDOMで載せ、長ければ内部スクロール。音声ボタンはvolumeアイコン＋ラベル。背景上の光を英文の上で発光させない。

## RESULT
左に選択メンバーの既存写真またはカード、右にSCORE・正解数/10・GP・好感度・ゲージ・評価・RETRY/NEXT/HOME。写真の顔に評価メダルを重ねない。
評価エンブレムは無文字の4色。スコアの評価基準は未決定。カード希少度C/B/A/Sと成績評価のデータを混同しない。
GPと好感度は増加前→増加後をDOMで表示。ゲージは実データに基づいて埋め、画像の横圧縮だけで計算しない。最終60文法のNEXTは次の有効項目に進むか完了案内へ変更する。

## CARDS：重要な写真座標
カード外形600×840、比率5:7。写真窓x30,y30,w540,h750,r18はC/B/A/Sで完全に共通。
外側containerにaspect-ratio:5/7。photoはleft:5%;top:3.571429%;width:90%;height:89.285714%。clipの角丸は実表示サイズに応じて18/600×カード幅。frameをinset:0;width/height:100%で重ねる。
写真のobject-fit:coverとobject-positionをカードIDごとに保持する。ランク変更時に写真の位置・サイズ・object-positionを変更しない。フレームを写真の縦横比に合わせて引き伸ばさない。
ラベルは写真窓の下、y約798–830の領域にDOMで載せる。色だけでなくC/B/A/Sを明記する。Cオフショット/Bアーティスト/Aライブ/S MV・コンセプト。
一覧は1行の横スクロールが基準。1枚の表示100–126px幅程度。詳細は左に180–220px幅カード、右に名前/ランク/分類/獲得情報。育成・覚醒・デッキは作らない。未所持はunowned-card。写真のぼかしで未所持にしない。

## GACHA
card-backと表面frame/photoを別面として回転。通常/A/Sでreveal素材と動きだけを切り替える。Sはreveal-s-ring＋sparkle＋低opacity flashで構成。光の表示を抽選結果決定に使用しない。
1回・10連の価格/確率/天井/重複時の扱いは未定。モックアップ価格300/3000を確定値としない。抽選処理中は連打防止と明確な進行状態を設ける。
10連の結果は同じカード寸法の横1行で全10枚を表示し、内部横スクロールで見る。小さく潰した10枚2段レイアウトを既定にしない。スキップ時も結果と報酬を一度だけ確定し、同じ結果に到達する。

## CHAT / LOGIN / SETTINGS
CHATは左に一覧、右にメッセージ。吹き出しはCSSを推奨し、SVGは質感/尾の見本として使用する。未読はnotification-badgeを再利用。ロックはlocked-chat＋lockアイコン＋解放条件のDOM文言。添付がないため会話本文一式は未制作。モックアップの英語は仮文。固定会話を想定し、実在メンバー本人が返信していると誤認する表示は避ける。
LOGINはサンプル7日。day-frame/day-today/day-claimedを共通寸法で切替。日数・報酬額はDOM。実際の日付境界/連続扱い/受領済み判定はゲーム側で確定する。
SETTINGSはBGM/SFXの音量、壁紙変更、データexport/import。sliderはネイティブrange、switchはbutton＋aria-checked。インポート時は確認ダイアログで既存データの扱いを説明する。保存できた時だけ成功表示。破損/空データのエラー表示も作る。

## 完成時の確認項目
- Safariとホーム画面起動の両方。ノッチの左右両方向。844×390/852×393/932×430と狭い667×375のレイアウト検査。
- 明るい/暗い写真、顔が左右/中央にある写真。主要人物の焦点位置を写真ごとに調整。
- MASTERのキーボード、長い日本語・英文、長い単語、60項目/大量カードの内部スクロール。
- C/B/A/Sを切り替えて写真が1pxも動かないこと。透明PNGに黒/白のマットが出ないこと。
- 正解/誤答、disabled/focus、未読/ロック、ガチャスキップ、低モーション。
- GPU負荷、モーダル背面操作禁止、連打、音声再生中の遷移、保存データの持ち出し。

## 技術参照（2026-10-25確認）
- WebKit, Designing Websites for iPhone X — safe-area / viewport-fit: https://webkit.org/blog/7929/designing-websites-for-iphone-x/
- MDN, ScreenOrientation.lock — 対応を前提にしない: https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock
- MDN, VisualViewport — キーボードと可視領域: https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport
これらは設計根拠。今回の静的素材検査は、iPhone実機での動作保証を意味しない。
