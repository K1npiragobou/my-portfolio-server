const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;

// ミドルウェア
app.use(cors()); // GitHub Pages など外部からのアクセスを許可
app.use(express.json());
// ミドルウェアとして導入（index.jsなど）
app.use((req, res, next) => {
  const key = req.headers['x-api-key'];
  const allowedRoutes = ['GET']; // 誰でもアクセスOKなメソッド

  if (allowedRoutes.includes(req.method)) {
    return next();
  }

  if (key !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
});
// 各ルートの読み込み
const blogRoutes = require('./routes/blogs');
const gameRoutes = require('./routes/games');
const dramaRoutes = require('./routes/dramas');

// ルーティング
app.use('/api/blogs', blogRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/dramas', dramaRoutes);
// ルートが見つからない場合のエラーハンドリング
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});
// 予期せぬエラーのハンドリング
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});
// 起動
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
