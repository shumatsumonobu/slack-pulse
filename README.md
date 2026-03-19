# Slack Pulse

チームの見えない繋がりを、光で描く

**[Live Demo](https://shumatsumonobu.github.io/slack-pulse/)**

![demo](screenshots/demo.gif)

Slackのリアクション・メンション・スレッド返信をスコア化し、ネットワークグラフで可視化。粒子が多いペアほど密なやり取り、丸が大きい人ほど広い繋がり。

Gemini AIがグラフ構造を読み取ってチームの健康診断も行う。ハブ・ボトルネック・孤立リスクをターミナル風UIで表示。

## 組織図には載らないものが見える

- **ハブ** — ひときわ大きい丸。情報がその人を経由してる。抜けたら止まるライン
- **派閥** — 固まって光るクラスタ。チーム間の壁がそのまま形になる
- **隠れたパイプ** — 部署をまたいで粒子が行き来するペア。組織図にない非公式な橋渡し役
- **沈黙** — 粒子が飛んでこない小さなノード。気づかなかった距離が見える

## セットアップ

### Slack App作成

1. [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. App Name: `slack-pulse`、Workspace: 対象ワークスペースを選択
3. 左メニュー **OAuth & Permissions** → **Bot Token Scopes** に以下を追加:
   - `channels:history` — メッセージ取得
   - `reactions:read` — リアクション取得
   - `users:read` — ユーザー名取得
4. 左メニュー **Install App** → **Install to Workspace** → 許可
5. 表示された **Bot User OAuth Token**（`xoxb-` で始まる）をコピー

### インストール

```bash
npm install
cp .env.example .env
```

`.env` を編集:

```
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_CHANNEL_ID=C01XXXXXXXX
GEMINI_API_KEY=your-gemini-api-key-here
```

- チャンネルID: チャンネル名を右クリック → リンクをコピー → URL末尾の英数字
- Gemini APIキー: [Google AI Studio](https://aistudio.google.com/apikey) から取得

### 使い方

```bash
# 1. Slackからデータ取得（対象チャンネルで /invite @slack-pulse してから）
npm run fetch

# 2. AIでチーム健康診断
npm run diagnose

# 3. 可視化
npm run dev
```

`data/graph-data.json` がなければ同梱のサンプルデータで動く。`diagnose` もサンプルデータ対応

### デモ動画の録画

```bash
npm run record
```

`screenshots/demo.webm` に1920×1080の15秒動画が出力される

### GitHub Pages デプロイ

```bash
npm run build:docs
```

`docs/` にデプロイ用ファイルが生成される。GitHub Pages の Source を `main` ブランチの `/docs` に設定

## スコア算出

```
スコア = リアクション × 1 + メンション × 2 + スレッド返信 × 3
```

最重量はスレッド返信。実際の会話の証拠

## AI健康診断

`npm run diagnose` でGemini AIがグラフ構造を分析し、`data/diagnosis.json` を生成。画面右上にターミナル風パネルで表示される。

```
DIAGNOSIS
55/100 [要注意]
> ハブ検出: 田中, 鈴木, 佐藤
! ボトルネック: 上位3名に集中
! 孤立リスク: 接続2人以下あり
> ハブ依存を分散させる
```

## 技術構成

- **可視化**: D3.js force-directed graph
- **AI診断**: Google Gemini AI（structured output）
- **データ取得**: Slack Web API / Node.js
- **録画**: Playwright（Chromium headless）

## Author

**shumatsumonobu** — [GitHub](https://github.com/shumatsumonobu) / [X](https://x.com/shumatsumonobu) / [Facebook](https://www.facebook.com/takuya.motoshima.7)

## License

[MIT](LICENSE)
