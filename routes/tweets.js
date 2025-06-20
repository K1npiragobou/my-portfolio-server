const express = require('express');
const router = express.Router();
const https = require('https');

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const USERNAME = process.env.TWITTER_USERNAME;

// キャッシュ（1時間有効）
let cache = {
  data: null,
  timestamp: 0
};
const CACHE_DURATION = 60 * 60 * 1000; // 1時間（ミリ秒）

router.get('/', async (req, res) => {
  if (cache.data && Date.now() - cache.timestamp < CACHE_DURATION) {
    return res.json(cache.data);
  }

  if (!BEARER_TOKEN || !USERNAME) {
    return res.status(500).json({ error: 'Twitter API設定がありません' });
  }

  const userId = await getUserId(USERNAME);
  if (!userId) return res.status(404).json({ error: 'ユーザーが見つかりません' });

  const tweets = await getTweetsWithUser(userId);
  if (!tweets) return res.status(500).json({ error: 'ツイート取得失敗' });

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
    https.get(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
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

// ツイート取得 + ユーザー情報も含める
function getTweetsWithUser(userId) {
  return new Promise((resolve) => {
    const path = `/2/users/${userId}/tweets?max_results=5&tweet.fields=created_at&expansions=author_id&user.fields=name,username,profile_image_url`;
    const options = {
      hostname: 'api.twitter.com',
      path,
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` }
    };

    https.get(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const user = json.includes?.users?.[0];
          if (!user) return resolve(null);

          const tweets = (json.data || []).map(tweet => ({
            text: tweet.text,
            created_at: tweet.created_at,
            user: {
              name: user.name,
              username: user.username,
              profile_image_url: user.profile_image_url
            }
          }));

          resolve(tweets);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

module.exports = router;
