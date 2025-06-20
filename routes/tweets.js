const express = require('express');
const router = express.Router();
const https = require('https');

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const USERNAME = process.env.TWITTER_USERNAME;

// キャッシュ用変数
let cache = {
  data: null,
  timestamp: 0
};
const CACHE_DURATION = 60 * 60 * 1000; // 1時間（ミリ秒）

router.get('/', async (req, res) => {
  // キャッシュが有効ならそれを返す
  if (cache.data && Date.now() - cache.timestamp < CACHE_DURATION) {
    return res.json(cache.data);
  }

  if (!BEARER_TOKEN || !USERNAME) {
    return res.status(500).json({ error: 'Twitter API設定がありません' });
  }

  // ユーザーID取得
  const userId = await getUserId(USERNAME);
  if (!userId) {
    return res.status(404).json({ error: 'ユーザーが見つかりません' });
  }

  // ツイート取得
  const tweets = await getLatestTweets(userId);
  if (!tweets) {
    return res.status(500).json({ error: 'ツイート取得に失敗しました' });
  }

  // キャッシュに保存
  cache = {
    data: tweets,
    timestamp: Date.now()
  };

  res.json(tweets);
});

// ユーザーID取得
function getUserId(username) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.twitter.com',
      path: `/2/users/by/username/${username}`,
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` }
    };
    https.get(options, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.data?.id || null);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// 最新ツイート取得
function getLatestTweets(userId) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.twitter.com',
      path: `/2/users/${userId}/tweets?max_results=5&tweet.fields=created_at,text`,
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` }
    };
    https.get(options, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.data || []);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

module.exports = router;