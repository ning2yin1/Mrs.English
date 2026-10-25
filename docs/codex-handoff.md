# Mrs.English — 統合実装指示書 / redesign v2

## 目的と入口
これは素材・デザイン資料の制作キットです。ゲーム本体、問題エンジン、保存処理、抽選処理を実装したものではありません。旧キットよりこのキットを優先してください。最初に本書、design/design-system.md、design/layout-manifest.json、design/asset-manifest.json、design/components.css、docs/motion-spec.mdを読むこと。

採用基準は宇宙と植物が同居するGRAMMAR SELECT。画面端の植物・果実・ガラス、白い紙面、鮮やかな光沢のある立体ボタンを組み合わせます。濃紺の大きい共通パネルを足さず、画面ごとの背景を使います。背景8種は画像生成済み。元PNGと配信用WebPを両方収録しています。元画像の内部にUIや文字を入れず、文字はすべてDOMで配置してください。

## 既存資産との統合
既存の人物写真、音声、問題データ、現在のコードは今回未提供です。画像内のEXISTING PHOTOや仮名MEMBERは配置確認用であり、実アプリに表示しません。既存リポジトリ内の対応素材を特定して置換してください。写真/音声の対応はdocs/media-map-template.csvへ登録。添付音声の実聴・分類完了とは扱わないこと。既存文法数・料金・確率・GP報酬・正解判定・難易度ごとのルール・保存キーは変更しません。サンプルの9,250や+250等はレイアウト確認用で、確定値ではありません。

## 画面構成
座標は844×390 CSS px、CHATは390×844 CSS px。mockups/*.pngは2倍出力です。design/layout-manifest.jsonのregionsが主要領域の[x,y,w,h]。アプリへ固定pxで丸ごと縮小するのではなく、この比率をレイアウトの出発点にし、タッチ領域44px・本文16pxを優先して組み直してください。

- HOME: HOME専用写真を全体に表示。中央に新規パネルを置かない。上下のUIと右下PLAYのみ。推し選択ボタンを追加しない。bg-home-fallbackは写真未選択/エラー時だけ。
- 文法選択: bg-grammar。左は独立スクロールの文法リスト、右は文法情報/難易度2×2/START。選択中はミントと左ライン。EASY緑/NORMAL青/HARD紫/MASTER黄。STARTは右下。
- PLAY: HOME写真を使ってよい。開始950msは背景を広く見せ、START演出後に設問を表示。白い問題帯、解答エリア、単語タイル、CHECKを分離。問題画面に共通ナビを追加しない。日本語の設問は既存問題データから描画すること。
- RESULT: bg-result。左に選択ボイス対応写真、右に評価/スコア/正答数/GP/好感度。共通ナビとボイス再生ボタンなし。S/A/B/Cの差はmotion-spec参照。リザルト到着時に同一結果IDへGPを二重付与しない。
- GACHA: bg-gacha。中央カードと軌道、下部1回/10連。金額は既存データ。確認ダイアログで所持/消費/残額を明示。抽選自体は既存処理を維持。S演出は取得結果に従う。演出から抽選結果を決めない。
- GACHA 10連: 横画面5×2。小画面はカードを小さくして文字を潰さず、5枚ずつページ/横スクロール。NEW/重複ラベルはDOM。重複変換の内容は既存ルール。
- CARDS: bg-cards。写真主役、フレームはC銀/B青/A紫/S虹色。希少度とリザルト成績は別概念。右上24pxランクバッジ、顔と重なる場合は写真ごとのbadgeSideを指定。
- LOGIN: bg-login。7つの報酬をゆるい曲線上の円形台座に配置。day-frameは補助部品として収録しているが、7つの四角い箱に戻さない。受領済みはチェック、当日は光輪とTODAY、7日目は大きいチケット。
- CHAT: bg-chat。縦画面、会話一覧→個別会話。既読/未読/通知。実キャラクターの写真が来るまでavatar-member-1〜3は仮素材。生成した本人風の顔を代用しない。会話は既存データのみ。
- 初回: setup-1 ニックネーム→setup-2 推し選択→setup-3 HOME写真→setup-4 無料10連→結果→HOME。各段階完了を保持。無料10連は完了フラグ/結果を先に保存し、再起動や戻るで再付与されない既存方針に統合。
- SETTINGS: bg-onboardingの静かな部分を共用。音量/推し/背景の変更は既存機能に合わせる。データ初期化は通常の保存ボタンと混同しない。

## レイヤー
背景0、植物/軌道10、写真15、UI30、カード枠40、DOM文字50、短い効果60、ナビ70、ダイアログ80、通知90、ローディング100。全画面効果はpointer-events:none。ダイアログだけは入力を受け、背景操作を止める。写真を黒いベールで常時覆わない。

## 伸縮と写真
画像の中の文字を読み取って実装しない。可変長ボタンはcomponents.cssのborder-imageで四隅を保持。各素材のnine_sliceは元画像pxの[top,right,bottom,left]。通常の全体background-size:100% 100%で角を潰すのは禁止。SVGは編集用原本としても収録しています。
カード全体600×840、共通透明窓[x30,y30,w540,h750,r18]。枠は5:7固定。写真は窓より各辺2source px広く敷き、object-fit:cover。写真の縦横比を変形しない。元写真ごとのfaceX/faceYを登録し、顔をトリミングしない位置を調整。

## PWAとロゴ
assets/branding/mrs_green_apple_pwa_icon.pngは添付JPEGをPNG化したもの。画像内の文字はMrs. Englishのまま維持。192/512/180px派生を収録。アイコンは角丸を焼き込んでいません。loading_symbolはアイコンの白い図形部分から文字と背景を除いたクリーン版。ノイズの多い透過添付もsourcesに保管。文字/比率/図形を勝手に作り替えないこと。

manifest.webmanifestへ以下のiconsを統合（既存のname/start_url/scope/id/displayを不用意に変えない）。アイコンファイルは以下のmanifestの位置を基準にパスを合わせること。
```json
{"name":"Mrs.English","short_name":"Mrs.English","display":"standalone","icons":[{"src":"assets/branding/icon-192.png","sizes":"192x192","type":"image/png","purpose":"any"},{"src":"assets/branding/icon-512.png","sizes":"512x512","type":"image/png","purpose":"any"}]}
```
```html
<link rel="manifest" href="./manifest.webmanifest">
<link rel="apple-touch-icon" sizes="180x180" href="./assets/branding/apple-touch-icon.png">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
```
GitHub Pagesのサブディレクトリを想定し、/assets等のルート絶対パスを使わない。既存service workerのキャッシュ版を更新し、古い素材のままになることを防ぐ。maskableアイコンとして登録しない（安全領域を別途制作していないため）。実機ホーム画面アイコンの変更反映は未検証。

ローディングは68px程度の静止ロゴ、不透明度.30。112pxの外周リングだけ900ms/linear/infiniteで回転。ロゴ自体に回転を適用しない。100ms未満の読み込みは表示を遅らせてちらつき回避。エラー時はローディングを止めて再試行を出す。

## iPhoneレイアウト
CHAT以外は横画面を基準。ブラウザの画面ロックに依存せず、CSS回転フォールバックを用意。components.css参照。縦持ち時の横UIは100dvh×100dvwを中央で90度回す。イベントの座標を生のclientX/Yで決めず、DOMのクリックを使う。Canvas/ドラッグがある場合は要素のgetBoundingClientRectと逆変換行列でローカル座標へ戻す。
CHATでは横UIの回転を解除し、縦UIを表示。端末横持ちなら縦UIを-90度回す設計例も収録。仮想キーボード使用中は回転を強制しない。MASTERとニックネーム入力はCSS回転中なら一時的に通常の縦入力画面へ切り替え、確定時に元の横画面へ戻す。実際の横画面キーボードではvisualViewportの変化に追従して写真領域を縮め、入力欄/CHECKを可視化。

セーフエリアは回転時に上下左右の対応を入れ替える。viewportを一律縮小して44pxボタンを小さくしない。最小目標667×375、844×390、932×430、CHAT390×844。小画面の文法リスト/カードは領域内スクロールのみ。本文16px、長い文章は2〜3行を許可し、問題帯の高さを増やしてタイル領域の縦スクロールを許可。ダブルタップ対策は操作要素のtouch-action:manipulation。user-scalable=noやdocument全体のtouchmove禁止を追加しない。

## 実装完了の確認
qa/production-status.mdの未検証項目を引き継ぐ。実際の写真/音声/日本語の長い設問、キーボード、回転、ノッチ、PWAオフライン更新、ボイス再生拒否時を実機確認。デザイン資料の検査合格をゲーム実機テスト合格と読み替えないこと。
