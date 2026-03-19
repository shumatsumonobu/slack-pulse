const { chromium } = require("playwright");
const { exec } = require("child_process");
const path = require("path");

const PORT = 3987;

(async () => {
  // ローカルサーバー起動
  const server = exec(`npx serve . -l ${PORT} --no-clipboard`, {
    cwd: __dirname,
  });
  await new Promise((r) => setTimeout(r, 2000));

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

  // demo.webm にリネームして保存
  const video = page.video();
  await context.close();
  const outPath = path.join(__dirname, "screenshots", "demo.webm");
  await video.saveAs(outPath);
  await browser.close();
  server.kill();

  console.log(`録画完了 → ${outPath}`);
})();
