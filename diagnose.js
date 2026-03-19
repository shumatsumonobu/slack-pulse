const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const DATA_FILE = path.join(__dirname, "data", "graph-data.sample.json");
const OUT_FILE = path.join(__dirname, "data", "diagnosis.json");

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY が .env に設定されていません");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

  // グラフの統計を事前計算してプロンプトに含める
  const connCount = {};
  const totalScore = {};
  data.edges.forEach((e) => {
    connCount[e.source] = (connCount[e.source] || 0) + 1;
    connCount[e.target] = (connCount[e.target] || 0) + 1;
    totalScore[e.source] = (totalScore[e.source] || 0) + e.score;
    totalScore[e.target] = (totalScore[e.target] || 0) + e.score;
  });

  const nameMap = {};
  data.nodes.forEach((n) => (nameMap[n.id] = n.name));

  const ranking = Object.entries(totalScore)
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => `${nameMap[id]}: スコア${score}, ${connCount[id]}人と接続`)
    .join("\n");

  const isolated = data.nodes
    .filter((n) => !connCount[n.id] || connCount[n.id] <= 2)
    .map((n) => n.name);

  const prompt = `あなたはチームコミュニケーションの専門家です。
Slackのやり取りデータ（リアクション×1 + メンション×2 + スレッド返信×3 でスコア化）を分析して、チームの健康診断を行ってください。

## データ概要
- メンバー数: ${data.nodes.length}人
- つながり数: ${data.edges.length}本

## スコアランキング（上位→下位）
${ranking}

## 接続が少ないメンバー（2人以下）
${isolated.length > 0 ? isolated.join(", ") : "なし"}

## 出力フォーマット（JSON）
以下のJSON形式で出力してください。JSON以外のテキストは含めないでください。

{
  "overall_score": 75,
  "overall_label": "良好",
  "summary": "30文字以内のサマリー",
  "hubs": [
    { "name": "名前", "insight": "20文字以内で理由" }
  ],
  "risks": [
    { "type": "bottleneck|isolation|cluster", "description": "20文字以内で説明" }
  ],
  "recommendations": [
    "20文字以内の改善アクション"
  ]
}

- overall_score: 0〜100の健康スコア
- overall_label: "危険" / "要注意" / "良好" / "健全"
- hubs: 上位3人
- risks: 2〜4個
- recommendations: 2〜3個`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      thinkingConfig: { thinkingBudget: 1024 },
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          overall_score: { type: "integer" },
          overall_label: { type: "string", enum: ["危険", "要注意", "良好", "健全"] },
          summary: { type: "string" },
          hubs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                insight: { type: "string" },
              },
              required: ["name", "insight"],
            },
          },
          risks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["bottleneck", "isolation", "cluster"] },
                description: { type: "string" },
              },
              required: ["type", "description"],
            },
          },
          recommendations: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["overall_score", "overall_label", "summary", "hubs", "risks", "recommendations"],
      },
    },
  });

  console.log("Gemini APIに送信中...");
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const diagnosis = JSON.parse(text);
  diagnosis.generated_at = new Date().toISOString();
  diagnosis.model = "gemini-2.5-flash";

  fs.writeFileSync(OUT_FILE, JSON.stringify(diagnosis, null, 2), "utf-8");
  console.log(`診断完了 → ${OUT_FILE}`);
  console.log(`スコア: ${diagnosis.overall_score}/100 (${diagnosis.overall_label})`);
}

main().catch((err) => {
  console.error("エラー:", err.message);
  process.exit(1);
});
