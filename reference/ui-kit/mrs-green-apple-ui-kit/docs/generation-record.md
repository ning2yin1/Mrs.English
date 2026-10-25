# 画像生成と整形の記録

生成方法：組み込みのimage_gen。CLI/APIへの切替は行っていない。UIの基本形状・アイコン・配置図はSVGで正確に作成し、PNGを書き出した。生成写真や実在人物の顔は使用していない。
以下は再制作に使う最終プロンプト条件の一覧。画面コンセプトと実装用素材を区別する。

## 共通プロンプト
Original premium K-pop fan English-learning game UI. Midnight navy translucent glass, brushed silver fine edges, mint accents, restrained violet iridescence. Commercial-quality alignment and readable type. Landscape iPhone 19.5:9. No official logos, no imitation of an existing game's exact UI, no people, no newly generated background photos. No fantasy ornament, no visual clutter. Photo-first composition. For production overlays, no text or labels and genuine transparent background.

## 画面ごとの生成条件
|保存先|追加したプロンプト条件|
|---|---|
|mockups/home-concept.png|HOME, large empty wallpaper region; slim top player/GP/heart bar; lower-left current lesson glass card; right wallpaper/gift/bell controls; six-tab bottom navigation HOME selected mint; abstract navy placeholder only; GREEN ROOM ENGLISH working title|
|mockups/play-concept.png|PLAY question screen; left 64% question/answer, right 26% photo placeholder; progress 04/10; word tiles, CHECK, RESET; navy glass with blue accents; six-tab navigation PLAY selected; no rhythm lanes|
|mockups/result-concept.png|RESULT; left vertical card placeholder, right score 9,250, 9/10, GP +250, heart +30, rose affection bar; refined S medal; RETRY NEXT HOME; warm gold highlights; no people|
|mockups/cards-concept.png|CARDS; one row six identical 5:7 cards; silver/blue/violet/gold-iridescent/locked/silver; same picture opening; rank labels outside photo; ALL C B A S filters; violet selected tab|
|mockups/gacha-concept.png|GACHA; left floating navy card back with gold orbit emblem and holographic rings; right collection information and DRAW ×1/×10; sample GP300/3000; gold selected tab; no casino/fantasy chest|
|mockups/chat-concept.png|CHAT; left 31% three member conversation rows with abstract icons, unread/locked states; right short prewritten bubbles Great work today! / One more lesson? / Let’s do it!; navy, mint, rose; six tabs; no portraits or keyboard|

コンセプト画像には生成上の揺れが残る。文字・教材の正確さ・アイコン・枠寸法は最終配置図と個別素材を正本とする。PLAYコンセプトの教材不一致と重複タイル、CHATの端末外枠は実装対象から除外した。

## 個別素材の生成条件
|生成原画/素材|プロンプト条件|
|---|---|
|sources/frame-c-generated.png|One isolated silver/platinum brushed metal photocard border, portrait5:7, orthographic front-facing, narrow beveled rails, geometric joints, minimal C rank, no letters/pictures, transparent outside and center, no drop shadow, no glow, blank bottom plate|
|sources/frame-b-generated.png|One blue metallic photocard border, portrait5:7, orthographic, sapphire dual rails, silver/cyan hairline reflections, stepped corner joints, no letters/pictures, genuine transparent outside/center, no jewels or external glow|
|sources/frame-a-generated.png|One amethyst purple photocard border, portrait5:7, orthographic, faceted purple metal/crystal bevels, diamond-cut corner geometry integrated into rails, no letters/photos, transparent outside/center, no protruding fantasy ornament|
|sources/frame-s-generated.png|One champagne gold holographic photocard border, portrait5:7, orthographic, pink/cyan/violet rainbow foil inside narrow rails, engraved orbital arcs, glamorous restrained S rank, no letters/photos, genuine transparent outside/center, no external particles|
|assets/ui/gacha/reveal-s-ring.png|One isolated wide2:1 elliptical holographic orbit ring, gold/pearl/cyan/violet/rose ribbon light, intertwined fine orbits, sparse close particles, transparent empty center/outside, feathered real-alpha glow, no card/text/scene/floor|
|assets/ui/effects/correct-sweep.png|One isolated wide3:1 mint-cyan luminous crescent sweep, small central four-point pearl glint, about8 sparse pale particles, restrained success effect above answer panel, real transparent feathered glow, no text/check/frame/scene|

## 寸法統一の工程
生成された4枠は外寸・窓位置が揺れるため、そのまま実装用フォルダへ置いていない。元の質感をSVGの1枚の連続画像レイヤーで配置し、全ランク共通のrounded aperture maskを適用した。最終PNGはこのSVGから書き出した。
最初に試した9分割伸縮では金属模様に継ぎ目が見えたため不採用。最終フレームは連続した質感で、600×840、写真窓30/30/540/750/r18へ統一。原画の中央はもともと実透過であり、チェッカー除去で透過を装っていない。
SVG正本とPNGの対応はasset-manifest.jsonに記録。全PNGの透明/半透明ピクセル数はqa/validation-report.jsonに記録した。
