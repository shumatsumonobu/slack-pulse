# Slack Pulse

チームの見えない繋がりを、光で描く

Slackのリアクション・メンション・スレッド返信から、コミュニケーション密度のネットワークグラフ

粒子が多いペアほど密なやり取り。丸が大きい人ほど広い繋がり

![demo](screenshots/demo.gif)

## 組織図には載らないものが見える

- **ハブ** — ひときわ大きい丸。情報がその人を経由してる。抜けたら止まるライン
- **派閥** — 固まって光るクラスタ。チーム間の壁がそのまま形になる
- **隠れたパイプ** — 部署をまたいで粒子が行き来するペア。組織図にない非公式な橋渡し役
- **沈黙** — 粒子が飛んでこない小さなノード。気づかなかった距離が見える

コマンド1つで、チームの健康状態が光と動きで浮かび上がる

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

`.env` にSlack Bot TokenとチャンネルIDを設定

```
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_CHANNEL_ID=C01XXXXXXXX
```

チャンネルIDはチャンネル名を右クリック → リンクをコピー → URL末尾の英数字

### データ取得

```bash
# Slackの対象チャンネルで /invite @slack-pulse してから
npm run fetch
```

出力: `graph-data.json`

`graph-data.json` がなければ同梱のサンプルデータで動く

### 可視化

```bash
npx serve .
```

ブラウザで表示されたURLを開く

## スコア算出

```
スコア = リアクション × 1 + メンション × 2 + スレッド返信 × 3
```

最重量はスレッド返信。実際の会話の証拠

## 技術構成

D3.js force-directed graph / Slack Web API / Node.js

## Author

**shumatsumonobu** — [GitHub](https://github.com/shumatsumonobu) / [X](https://x.com/shumatsumonobu) / [Facebook](https://www.facebook.com/takuya.motoshima.7)

## License

[MIT](LICENSE)
