# アニメーション仕様

静止画と動作は別。動画/スプライトシートは含まない。全エフェクトは操作判定なし、pointer-events:none。transform/opacity中心。ベースはease-out、長い移動はcubic-bezier(.2,.7,.2,1)。常時光らせず操作への応答として使う。

|ID|時間|使用素材|タイムライン|
|---|---|---|---|
|tab-160|160ms|nav-selected|旧選択opacity1→0、新選択0→1。ナビ文字は即時状態更新|
|press-100|100ms|各button|押下translateY(1px)、brightness(.92)、離すと戻す。タップ範囲は移動させない|
|panel-enter|220ms|panel/modal|opacity0→1、translateY(6px)→0。scaleを大きく変えない|
|gentle-breathe|2400ms|start-ornament|opacity .55→.9→.55。ロゴ文字は常時読めるまま。低モーションでは静止|
|correct-450|450ms|answer-correct＋correct-sweep＋check|0ms枠/ラベル、80ms sweep表示、220ms opacity .7、450ms消える。光は設問上辺の外側|
|incorrect-180|180ms|answer-incorrect＋close|赤枠opacity0→.8→.45。横揺れ/画面赤塗り/点滅なし。説明は読めるまで残す|
|rank-enter|650ms|rank-*-emblem|opacity0→1、scale .92→1、DOMランクを同時表示|
|pulse-once|800ms|gp-gain/affection-up/message-unlock/reward-claim|scale .85→1.08、opacity0→.65→0。数値はカウント後必ず正しい最終値|
|particle-800|800ms|sparkle|12–24粒を原点から24–80px移動、opacity1→0。Canvasなら全体上限40粒|
|card-flip|500ms|card-backと表|perspective800px、rotateY0→180。backface-visibility:hidden、結果は回転前に確定|
|reveal-normal|900ms|reveal-normal|0–250光、250–700flip、700–900静止。通常の青い細光|
|reveal-a|1500ms|reveal-a＋sparkle|0–450紫の輪、450–1000flip、1000–1500細粒子。虹リングを使わずSと区別|
|s-reveal-2200|2200ms|reveal-s-ring＋sparkle＋soft-flare|0–450暗いscrimと虹リングscale .8→1、450–700金粒子、700–1200flip、1200–1700虹リングが広がる、1700–2200光が消えてカードだけ残る|

## S演出の重ね順
写真背景→暗いscrim→虹リングの奥側→カード裏/表→手前の粒子→一度のsoft-flare。カード枠の光とリングを常に両方最大輝度にしない。リングはカード幅の2.2–2.8倍、元画像比率2:1を保持。
任意のフラッシュは1200ms付近で1回、白の最大opacity .12、80–120ms。連続点滅や全面白飛びを作らない。設定/低モーションで省略可能。

## スキップと中断
演出開始200ms以降はSKIP可能とする案。スキップで抽選をやり直さない。10連は長い演出を10回繰り返さず、まとめ演出後に結果一覧、Sがあれば短い強調を1回。バックグラウンド移行/画面遷移時はanimatorを止め、結果の二重反映を防ぐ。

## 低モーション
prefers-reduced-motion:reduceでは移動/回転/粒子/呼吸/フラッシュを止める。120msのopacity切替後、カード枠とランク文字で結果を示す。光素材がなくても状態が理解できる構成を守る。

## 音声
BGM/WAVは未収録。音声IDとの対応はintegration-template.jsonに後から記入。音量はBGMとSFXを別設定。見た目のエフェクトと音を同時に開始しつつ、音声再生が失敗してもゲームが進む。S演出のSE長は最大2200ms程度が目安。今回効果音の波形ファイルは作成していない。
