const fs = require("fs");
const path = require("path");

const DOCS = path.join(__dirname, "docs");

const ogpPath = path.join(DOCS, "ogp.png");

// docs/ をクリーンアップして再作成
if (fs.existsSync(DOCS)) fs.rmSync(DOCS, { recursive: true });
fs.mkdirSync(DOCS);
fs.mkdirSync(path.join(DOCS, "data"));

// 必要なファイルをコピー
fs.copyFileSync("index.html", path.join(DOCS, "index.html"));
fs.copyFileSync("data/graph-data.sample.json", path.join(DOCS, "data/graph-data.sample.json"));
fs.copyFileSync("data/diagnosis.sample.json", path.join(DOCS, "data/diagnosis.sample.json"));

// ogp.png をコピー
const ogpSrc = path.join(__dirname, "screenshots", "ogp.png");
if (fs.existsSync(ogpSrc)) fs.copyFileSync(ogpSrc, ogpPath);

// Jekyll無効化
fs.writeFileSync(path.join(DOCS, ".nojekyll"), "");

console.log("docs/ にデプロイ用ファイルを生成しました");
