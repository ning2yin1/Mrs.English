# Mrs.English — Codex 実装開始指示

## リポジトリ
`https://github.com/ning2yin1/Mrs.English`（既存の空リポジトリ、main）。ユーザーが実装をCodexへ依頼する。**この制作キット作成段階ではGitHubへアップロード・デプロイしない。**

## 読む順番
1. `docs/CODEX-MASTER-PROMPT.md`（今回の最終仕様、競合時最優先）
2. `docs/QUALITY-AUDIT.md`（素材・教材の検査と既知の制約）
3. `data/grammar-topics.json`（60文法）
4. `data/questions-600.json`（600例文、英文・和訳・文法ポイント）
5. `data/assets.json`（素材への正確なパス、音声・写真の対応表）
6. `reference/ui-kit/mrs-green-apple-ui-kit/docs/codex-handoff.md`（UI実装技術）
7. `reference/ui-kit/mrs-green-apple-ui-kit/design/design-system.md`（デザイン）
8. `reference/ui-kit/mrs-green-apple-ui-kit/docs/screen-layouts.md`（画面配置）

UI素材は `reference/ui-kit/mrs-green-apple-ui-kit/assets/ui/` にある。使用する素材のみ `public/assets/ui/` などへコピーする。`reference/user-original/` はユーザー原本で、実装には `assets/photos/` と `assets/audio/` の正規化済み素材を使用。**両方を配信対象に含めないこと。**

教材データの `reviewStatus=editorial-draft` は自動的な英語母語話者監修済みを意味しない。Codexは全600問を機械的にそのまま4モードへ流し込むのではなく、設問生成・採点・選択肢を検証すること。
