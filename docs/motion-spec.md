# アニメーション仕様

CSS/DOMによる演出設計。動画/音声/実ゲーム処理は未制作。各効果の素材は下表で指定。CSSキーフレームはdesign/components.css、動く見本はdesign/motion-preview.html。

|ID|時間ms|イージング|開始条件|動き|素材|
|---|---:|---|---|---|---|
|app-launch|700|ease-out|起動完了|ロゴ静止、植物を下から12px、prismを.94→1、最後にHOME操作解放|assets/ui/common/leaf-corner.svg|
|screen-transition|240|cubic-bezier(.22,1,.36,1)|画面遷移|旧画面-12px/opacity1→0を100ms、新画面+20px→0を180ms、背景を暗転させない|assets/ui/effects/prism.svg|
|button-press|100|ease-out|pointerdown/up|押下translateY2px scale.975、離したら復帰。pointercancelも復帰|assets/ui/common/state-pressed.svg|
|grammar-select|180|ease-out|文法選択|行を右へ4px、選択ライン表示、右情報は30ms遅延して切替|assets/ui/play/grammar-selected.svg|
|game-start|950|cubic-bezier(.22,1,.36,1)|STARTを押下|0–200ms背景のみ、200–500ms STARTを1.25→1、500–700ms保持、700–950ms上へ抜けて設問表示|assets/ui/play/start-button.svg|
|question-change|220|ease-out|NEXTまたは正解後|タイルを30ms間隔で8px下から整列、問題帯は右から12px。前の入力を終了してから|assets/ui/play/word-mint.svg|
|answer-correct|480|ease-out|正解判定|緑チェックとCORRECT、correct-sweepを左右へ移動し消す。写真の顔に重ねない|assets/ui/effects/correct-sweep.png|
|answer-incorrect|180|ease-in-out|不正解判定|不正解ラベルと×、解答帯だけ左右3pxを1往復。解説はその後表示|assets/ui/play/answer-incorrect.svg|
|score-count|800|cubic-bezier(.22,1,.36,1)|リザルト入場後300ms|0→最終値を同じ正規化時刻で算出。固定幅数字で揺れを防ぐ|assets/ui/result/result-ornament.svg|
|gp-gain|600|ease-out|カウント開始|GPアイコンを1→1.12→1、+GPを18px上げて残す。実付与は演出と分離|assets/ui/icons/gp.svg|
|heart-fill|1000|cubic-bezier(.22,1,.36,1)|好感度獲得|heart-mask内で液面上昇、数値と同じ時刻。4〜8粒のハートを上方へ36px飛ばす|assets/ui/result/heart-mask.svg|
|heart-full|420|cubic-bezier(.22,1,.36,1)|上限到達|scale1→1.12→.97→1、光輪1回。複数レベル分なら上限で区切り再び0から増加|assets/ui/result/heart-glass.svg|
|rank-reveal|500|cubic-bezier(.22,1,.36,1)|結果入場後100ms|Cは青白い光6粒/Bは青10粒/Aは紫16粒/Sは虹24粒。全ランクの数字可読性を維持|assets/ui/result/rank-s-emblem.svg|
|gacha-start|450|ease-in|確定した抽選開始|確認UIを閉じ、中央カードを20px浮上、軌道を.8→1|assets/ui/gacha/stage-orbit.svg|
|gacha-loop|900|linear|抽選結果準備中|prismとbubbleを軌道周回。最大3秒で結果表示へ。通信中はスキップで処理を再送しない|assets/ui/effects/bubble.svg|
|card-reveal|520|ease-out|カード結果表示|カード裏→rotateY90deg、260msで表へ差し替え→0deg、backface非表示|assets/ui/gacha/card-back.svg|
|s-reveal|1800|cubic-bezier(.22,1,.36,1)|取得カードがS|0–300ms虹リング.4→1、300–700ms輝点24粒、700msカード公開、1800ms入力解放。白い全面フラッシュなし|assets/ui/gacha/reveal-s-ring.png|
|ten-results|1200|ease-out|10連結果表示|5×2を左上→右下に70msずつ入場、各400ms。スキップで全カードを即表示。重複バッジは裏返し終了後|assets/ui/gacha/ten-result-slot.svg|
|login-claim|650|ease-out|報酬受取成功|報酬アイコンを1→1.2→1で跳ね、光粒10個。7日目は虹光輪追加。処理成功後だけ演出|assets/ui/login/reward-pedestal.svg|
|chat-notification|320|ease-out|未読到着|バッジscale.6→1.12→1、一覧は1回だけ上に2px。連続点滅なし|assets/ui/common/notification-badge.svg|
|loading|900|linear|表示遅延100ms後も読込中|中央ロゴはopacity.3・静止。外周リングのみ360度回転。完了/エラー時停止|assets/branding/mrs_green_apple_loading_symbol.png|

## 実装上の共通ルール
演出開始と報酬の付与を結びつけない。結果は処理済みIDで一度だけ確定。requestAnimationFrameの時刻から進捗tを計算し、スコアとハートは同じtを使う。アニメーション終了イベントだけに依存せず、中断/画面離脱でも最終値を保持。再入場で音声やGPを再発火させない。

連打は抽選処理中/結果確定中だけ抑止。結果確定後の演出はタップで短縮可能。粒子は同時40個以下。transform/opacity主体、blurや巨大なbox-shadowの連続更新なし。画面離脱でタイマー/rAF/音声を停止。prefers-reduced-motionでは数値と最終形を即表示し、操作導線を保つ。

S/A/B/Cは成績の祝福の強さだけを変える。低評価でも罰のような強い赤/揺れを出さない。heart-lightは原版の質感参照であり、液面実装はcomponents.cssのピンクのCSS背景を優先する。