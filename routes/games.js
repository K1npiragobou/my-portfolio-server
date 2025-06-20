const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const filePath = path.join(__dirname, '../data/games.json');
// JSONファイルの読み込み
const readGames = async () => {
  const data = await fs.readFile(filePath, 'utf8');
  return JSON.parse(data);
};

// JSONファイルへの保存
const writeGames = async (data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
};
// 全件取得
router.get('/', async (req, res) => {
  const games = await readGames();
  res.json(games);
});
// ...existing code...

// 新規追加（Create）＋バリデーション
router.post('/', async (req, res) => {
  const { id, name, rank, point, history } = req.body;
  if (!id || !name || !rank || typeof point !== 'number' || !Array.isArray(history)) {
    return res.status(400).json({ error: 'id, name, rank, point(number), history(array) are required' });
  }
  const games = await readGames();
  if (games.some(g => g.id === id)) {
    return res.status(400).json({ error: 'id must be unique' });
  }
  const newGame = { id, name, rank, point, history };
  games.push(newGame);
  await writeGames(games);
  res.status(201).json(newGame);
});

// 更新（Update）＋バリデーション
router.put('/:id', async (req, res) => {
  const games = await readGames();
  const index = games.findIndex(g => g.id === req.params.id);
  if (index === -1) return res.status(404).send('Not found');

  const { name, rank, point, history } = req.body;
  if (!name && !rank && point === undefined && !history) {
    return res.status(400).json({ error: 'At least one field (name, rank, point, history) is required' });
  }

  // 更新できるフィールドだけ上書き
  if (name) games[index].name = name;
  if (rank) games[index].rank = rank;
  if (point !== undefined) games[index].point = point;
  if (history) games[index].history = history;

  await writeGames(games);
  res.json(games[index]);
});

// 単一ゲーム取得・削除もidを文字列で比較
router.get('/:id', async (req, res) => {
  const games = await readGames();
  const game = games.find(g => g.id === req.params.id);
  if (game) res.json(game);
  else res.status(404).send('Not found');
});

router.delete('/:id', async (req, res) => {
  const games = await readGames();
  const index = games.findIndex(g => g.id === req.params.id);
  if (index === -1) return res.status(404).send('Not found');

  const deleted = games.splice(index, 1);
  await writeGames(games);
  res.json(deleted[0]);
});
// スプレッドシート等から全データを一括セット
router.post('/set-all', async (req, res) => {
  const games = req.body;
  if (!Array.isArray(games)) {
    return res.status(400).json({ error: 'Array of games is required' });
  }
  // バリデーション（最低限）
  for (const game of games) {
    if (!game.id || !game.name || !game.rank || typeof game.point !== 'number' || !Array.isArray(game.history)) {
      return res.status(400).json({ error: 'Each game must have id, name, rank, point(number), history(array)' });
    }
  }
  await writeGames(games);
  res.json({ message: 'Games data replaced', count: games.length });
});

module.exports = router;
