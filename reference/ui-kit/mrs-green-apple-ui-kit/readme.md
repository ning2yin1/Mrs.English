# GREEN ROOM ENGLISH — UI素材制作キット

Mrs. GREEN APPLEファン向け・iPhone横画面英語学習PWAのための、非公式オリジナルUIデザイン。
**ゲーム本体は実装していません。** 写真・音声・問題データ・GP経済設計も別途組み込む前提です。
ゲーム名「GREEN ROOM ENGLISH」は今回の仮称であり、変更できます。

## 最初に見るもの
1. `mockups/major-screens-overview.png`：納品部品を組み合わせた主要6画面の配置図。
2. `mockups/*-concept.png`：画像生成による6画面の質感コンセプト。
3. `design/design-system.md`：全体の色・文字・寸法・動き。
4. `docs/codex-handoff.md`：Codexに渡す実装指示。
5. `docs/asset-inventory.csv`：各素材の用途・寸法・レイヤー・動き・CSS補完。

## 収録
- UI **117種類**：PNG117点と編集可能SVG115点。PNG/SVGを二重に数えていません。
- 全4ランクの600×840カード枠。写真窓は全てx30/y30/540×750、角丸18。
- 26種類の統一アイコン。SVG24×24、PNG96×96。
- 主要6画面の生成コンセプト、15画面の正確な静的配置図、6画面の比較シート。
- デザインシステム、デザイントークン、素材一覧、アニメーション指定、写真/音声受け渡しテンプレート。
- 透過・共通写真窓・ファイル整合性の検査記録と全素材の暗色/明色背景チェックシート。

## 使い分け
`assets/ui/`だけが実装用素材です。`mockups/`は配置/質感確認用で、画面を丸ごと背景にしてはいけません。`sources/`の生成原画は寸法が未統一のため実装に使用せず、検査・再編集用に保管します。
PNGの透過は実アルファです。パネル内の半透明塗り、カード裏面、未所持カードの内部は意図した塗りであり透過欠陥ではありません。
ボタンラベル・英文・日本語・スコア・ランク字はDOMで表示します。例外は分離した編集可能な仮タイトルロゴ文字レイヤーです。

## 前提と未制作
既存写真20枚・カード写真・WAVは今回添付されていないため未収録。写真ごとの色合わせ・顔位置・トリミングの最終検査は未実施です。抽象グラデーションの写真領域は配置確認用で、新しい背景写真ではありません。
ゲームの実装、PWA設定、通信、保存処理、学習用の60文法/600問、会話本文一式、実メンバー情報、ガチャ確率/価格/重複報酬の決定、実機試験は未実施です。
アニメーションは静止画素材＋仕様書で納品し、動画・APNG・WAV効果音の生成はしていません。
1回/10連、7日ログイン、スコア評価C/B/A/S、仮価格などはUI上の表示例で、確定したゲーム仕様ではありません。

## ファイル構成
```text
assets/ui/
  common/ title/ home/ play/ result/ cards/ gacha/
  chat/ login/ settings/ effects/ icons/
design/
  design-system.md  tokens.json  tokens.css
  asset-manifest.json  layout-manifest.json  motion-spec.json
docs/
  codex-handoff.md  asset-inventory.csv  asset-inventory.md
  screen-layouts.md  animation-spec.md  integration-template.json
  production-status.md  generation-record.md
mockups/
  *-concept.png  *-layout.svg  *-layout.png
  major-screens-overview.png  concept-screens-overview.png
qa/
  validation-report.json  inspection-notes.md
  card-frames-dark.png  card-frames-light.png  asset-check-*.png
sources/
  frame-*-generated.png  build-assets.py  build-layouts.py
```

PNG/SVGは同じデザインの代替形式です。両方を同時に重ねないでください。外部CDNや外部フォントを必要としない素材です。
