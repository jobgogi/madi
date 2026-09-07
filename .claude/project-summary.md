# プロジェクト概要

このプロジェクトの名前は`madi`です。
`madi`は韓国語また、日本語学習をする時、文章の翻訳、逆に作文をAIを利用してフィードバックをしてくれる学習ウェブアプリです。

## 対象
* 日本語勉強に興味がある韓国人
* 韓国語勉強に興味がある日本人
* 自分でLLMのAPIキーを用意できる人（BYOK方式のため）

## 仕様

### 開発環境
* 言語 - `TypeScript`
* フレームワーク - `Next.js` (App Router)
* デプロイ - `vinext` を使って `Cloudflare Workers` にデプロイ
* 認証 - `Supabase Auth`（Google OAuth）
* データベース - `Supabase`（Postgres）
* スタイリング - `Tailwind CSS`

### AI連携方式（BYOK）
* ユーザーが自分のAPIキーを用意して使用する方式
* 対応プロバイダー: OpenAI / Claude / gemini / Ollama（ローカルモデル）
* APIキーはサーバーを経由せず、ブラウザの`localStorage`にのみ保存
* Ollama利用時はTailscale経由での接続を案内

### 主な機能
* 原文入力（長さ問わず、自動で文分割）
* AIによる基準訳の生成 → ユーザー訳との比較分析
* 文法・語彙・ニュアンスの差分表示（10カテゴリに分類）
* 意味の反転（否定語の欠落など）を最優先で検出し、criticalとして表示
* JLPTレベルの自動判定、日本人ユーザーの場合は韓国能力試験レベルの自動判定
* 良かった点・惜しかった点・前回からの成長点を含むレポート表示
* ダッシュボード（学習の芝生グラフ、カテゴリ別ミス頻度）

### データベース設計（概要）
* `reports` - 学習レポート本体（原文/ユーザー訳/AI訳/評価など）
* `profiles` - ユーザー情報（role: user/admin）
* `prompt_templates` - 方向別プロンプトのバージョン管理
* `login_history` - ログイン履歴
* `session_feedback` - レポートへの良い/悪いフィードバック
* `error_categories` - エラーカテゴリのマスタ（10種）
* 全テーブルにRow Level Security (RLS) を適用し、本人データのみアクセス可能にする