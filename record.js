const { chromium } = require("playwright");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const PORT = 3987;
const DATA_DIR = path.join(__dirname, "data");
const REAL_DATA = path.join(DATA_DIR, "graph-data.json");
const REAL_DATA_BAK = path.join(DATA_DIR, "graph-data.json.bak");
const OUT_PATH = path.join(__dirname, "screenshots", "demo.webm");

(async () => {
  // 実データを一時退避（サンプルデータで録画するため）
  const hadRealData = fs.existsSync(REAL_DATA);
  if (hadRealData) {
    fs.renameSync(REAL_DATA, REAL_DATA_BAK);
    console.log("実データを一時退避 → サンプルデータで録画");
  }

  // ローカルサーバー起動
  const server = exec(`npx serve . -l ${PORT} --no-clipboard`, {
    cwd: __dirname,
  });
  await new Promise((r) => setTimeout(r, 2000));

  try {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: path.join(__dirname, "screenshots"),
        size: { width: 1920, height: 1080 },
      },
    });

    const page = await context.newPage();

    // ブラウザのデフォルト背景色（白）をCDPで上書き
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setDefaultBackgroundColorOverride", {
      color: { r: 10, g: 14, b: 26, a: 1 }, // #0a0e1a
    });

    // 暗い画面を1秒入れてからナビゲーション（フェードインをキャプチャ）
    await page.waitForTimeout(1000);

    await page.goto(`http://localhost:${PORT}`, { waitUntil: "domcontentloaded" });

    // イントロ + グラフアニメーション 15秒録画
    await page.waitForTimeout(15000);

    // demo.webm に上書き保存
    const video = page.video();
    await context.close();
    await video.saveAs(OUT_PATH);
    await browser.close();

    console.log(`録画完了 → ${OUT_PATH}`);
  } finally {
    server.kill();
    // 実データを復元
    if (hadRealData && fs.existsSync(REAL_DATA_BAK)) {
      fs.renameSync(REAL_DATA_BAK, REAL_DATA);
      console.log("実データを復元");
    }
  }
})();
