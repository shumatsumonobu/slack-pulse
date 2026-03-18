require("dotenv").config();
const { WebClient } = require("@slack/web-api");
const fs = require("fs");

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const channelId = process.env.SLACK_CHANNEL_ID;

async function fetchMessages() {
  const messages = [];
  let cursor;

  // 直近1000件を取得（ページング）
  do {
    const res = await slack.conversations.history({
      channel: channelId,
      limit: 200,
      cursor,
    });
    messages.push(...res.messages);
    cursor = res.response_metadata?.next_cursor;
  } while (cursor && messages.length < 1000);

  console.log(`${messages.length} 件のメッセージを取得`);
  return messages;
}

function buildGraph(messages) {
  // コミュニケーション密度を計算
  // key: "userA->userB" value: { reactions: 0, mentions: 0, threads: 0 }
  const links = {};

  for (const msg of messages) {
    const sender = msg.user;
    if (!sender) continue;

    // リアクション: 誰がこのメッセージにリアクションしたか
    if (msg.reactions) {
      for (const reaction of msg.reactions) {
        for (const reactor of reaction.users || []) {
          if (reactor === sender) continue;
          const key = [reactor, sender].sort().join("<->");
          if (!links[key]) links[key] = { reactions: 0, mentions: 0, threads: 0 };
          links[key].reactions++;
        }
      }
    }

    // メンション: テキスト内の <@U12345> パターン
    const mentionPattern = /<@(U[A-Z0-9]+)>/g;
    let match;
    while ((match = mentionPattern.exec(msg.text || "")) !== null) {
      const mentioned = match[1];
      if (mentioned === sender) continue;
      const key = [sender, mentioned].sort().join("<->");
      if (!links[key]) links[key] = { reactions: 0, mentions: 0, threads: 0 };
      links[key].mentions++;
    }

    // スレッド返信: reply_usersから取得
    if (msg.reply_users) {
      for (const replier of msg.reply_users) {
        if (replier === sender) continue;
        const key = [sender, replier].sort().join("<->");
        if (!links[key]) links[key] = { reactions: 0, mentions: 0, threads: 0 };
        links[key].threads++;
      }
    }
  }

  // ユーザー一覧を抽出
  const userIds = new Set();
  for (const key of Object.keys(links)) {
    const [a, b] = key.split("<->");
    userIds.add(a);
    userIds.add(b);
  }

  // スコア計算: リアクション×1 + メンション×2 + スレッド×3
  const edges = Object.entries(links).map(([key, val]) => {
    const [source, target] = key.split("<->");
    const score = val.reactions * 1 + val.mentions * 2 + val.threads * 3;
    return { source, target, score, ...val };
  }).filter(e => e.score > 0);

  return {
    nodes: [...userIds].map(id => ({ id })),
    edges,
  };
}

async function resolveUserNames(graph) {
  const nameMap = {};
  for (const node of graph.nodes) {
    try {
      const res = await slack.users.info({ user: node.id });
      nameMap[node.id] = res.user.real_name || res.user.name;
    } catch {
      nameMap[node.id] = node.id;
    }
  }

  graph.nodes = graph.nodes.map(n => ({
    ...n,
    name: nameMap[n.id],
  }));

  return graph;
}

async function main() {
  console.log("Slackからメッセージを取得中...");
  const messages = await fetchMessages();

  console.log("グラフデータを構築中...");
  let graph = buildGraph(messages);

  console.log("ユーザー名を解決中...");
  graph = await resolveUserNames(graph);

  const outPath = "./graph-data.json";
  fs.writeFileSync(outPath, JSON.stringify(graph, null, 2));
  console.log(`完了！ ${outPath} に保存 (${graph.nodes.length}人, ${graph.edges.length}本の繋がり)`);
}

main().catch(console.error);
